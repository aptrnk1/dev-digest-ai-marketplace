import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('palette', () => {
  test('Ctrl/⌘+K opens, arrows select, Enter opens, Esc closes and restores focus (AC84, AC85)', async ({ page }) => {
    await page.goto('getting-started.html');
    const opener = page.locator('[data-palette-open]');
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Палітра команд' });
    await expect(dialog).toBeVisible();
    await expect(page.getByPlaceholder('Перейти до артефакту…')).toBeFocused();
    await expect(dialog.locator('.palette-item')).toHaveCount(8);
    await expect(dialog.locator('.palette-item').first()).toContainText('плагін');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();

    await page.keyboard.press('ControlOrMeta+k');
    await expect(dialog).toBeVisible();
    await page.keyboard.type('code review');
    await expect(dialog.locator('.palette-item').first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(dialog.locator('.palette-item').nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/artifact\.html\?plugin=alpha-tools&type=skill&name=code-review$/);
  });

  test('0 results and repeat shortcut closes (AC84, AC86)', async ({ page }) => {
    await page.goto('./');
    await page.keyboard.press('ControlOrMeta+k');
    await page.keyboard.type('zzzzqqq');
    await expect(page.getByRole('dialog').getByText('Нічого не знайдено')).toBeVisible();
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('theme', () => {
  test('system theme by default, follows system changes (AC58)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('manual toggle persists across pages before first paint (AC76)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('./');
    const toggle = page.locator('[data-theme-toggle]');
    await expect(toggle).toHaveAttribute('aria-label', 'Увімкнути світлу тему');
    await expect(toggle).toHaveText('☾');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-label', 'Увімкнути темну тему');
    expect(await page.evaluate(() => localStorage.getItem('dd-theme'))).toBe('light');
    await page.goto('plugin.html?name=hello', { waitUntil: 'commit' });
    await page.waitForSelector('html[data-theme]', { state: 'attached' });
    expect(await page.locator('html').getAttribute('data-theme')).toBe('light');
  });

  test('blocked localStorage: toggle still works without errors (AC77)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('./');
    await page.locator('[data-theme-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(errors).toEqual([]);
  });
});

test('only same-origin requests (AC54)', async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const foreign = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) && !r.url().startsWith('data:')) foreign.push(r.url());
  });
  for (const url of ['./', './?q=review', 'plugin.html?name=alpha-tools', 'artifact.html?plugin=alpha-tools&type=skill&name=refactor', 'getting-started.html']) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  }
  expect(foreign).toEqual([]);
});

const PAGES = ['./', './?q=review', 'plugin.html?name=alpha-tools', 'artifact.html?plugin=alpha-tools&type=agent&name=review:security', 'getting-started.html'];

for (const scheme of ['light', 'dark']) {
  test(`no serious/critical axe violations, ${scheme} theme (NFR5)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    for (const url of PAGES) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${url}: ${v.id} — ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)).toEqual([]);
    }
  });
}

for (const scheme of ['light', 'dark']) {
  test(`palette has no serious/critical axe violations, ${scheme} theme (NFR5)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('./');
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog')).toBeVisible();
    // The palette fades in; axe must see the settled colours, not a half-transparent frame.
    await page.locator('.palette-backdrop').evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
    const { violations } = await new AxeBuilder({ page }).include('.palette').analyze();
    const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.flatMap((v) => v.nodes.slice(0, 3).map((n) => `${v.id}: ${n.target.join(' ')} — ${n.any[0]?.message ?? ''}`))).toEqual([]);
  });
}

test('320 px wide: no horizontal scroll (NFR6, EC27)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const url of PAGES) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(0);
  }
  await page.goto('./?q=review');
  await expect(page.locator('[data-header-search] input')).toBeVisible();
});
