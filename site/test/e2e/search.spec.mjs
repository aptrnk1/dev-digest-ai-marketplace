import { expect, test } from '@playwright/test';
import { bulkIndex, mockIndex } from './helpers.mjs';

test.describe('home and search', () => {
  test('home shows hero, tag chips, stats, browse by type and footer (AC72, AC52)', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Знайди потрібний артефакт і постав його одним copy-paste');
    await expect(page.getByText('Marketplace плагінів · скілів · агентів')).toBeVisible();
    await expect(page.locator('.chip')).toHaveText(['#code-quality', '#refactoring', '#database', '#mcp', '#review']);
    await expect(page.locator('.stat')).toHaveCount(5);
    await expect(page.locator('.stat').first()).toContainText('5плагінів');
    await expect(page.locator('.browse-item')).toHaveCount(6);
    await expect(page.locator('[data-footer]')).toHaveText(/^Індекс зібрано 2026-10-25 12:34 UTC · 0123456$/);
    await expect(page.locator('[data-footer] a')).toHaveAttribute('href', 'https://github.com/fixture-owner/fixture-repo/commit/0123456789abcdef0123456789abcdef01234567');
  });

  test('typing updates results and ?q= after the debounce (AC18, AC29)', async ({ page }) => {
    await page.goto('./');
    await page.locator('[data-hero-search] input').fill('code review');
    await expect(page).toHaveURL(/\?q=code\+review$/);
    await expect(page.locator('[data-results-heading]')).toHaveText('Результати: “code review”');
    await expect(page.locator('[data-results-count]')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('[data-card]').first()).toContainText('code-review');
  });

  test('a Ukrainian query with a type word filters by type (AC20) and shows synonyms (AC25)', async ({ page }) => {
    await page.goto('./?q=' + encodeURIComponent('мені треба скіл для рефакторинг'));
    // code-review inherits the plugin tag "refactoring", so it matches too; the name match ranks first.
    await expect(page.locator('.card-title')).toHaveText(['refactor', 'code-review']);
    await expect(page.locator('[data-card] .kind-badge')).toHaveText(['skill', 'skill']);
    await expect(page.locator('[data-also-searched]')).toHaveText('Також шукали: рефакторинг → refactor, refactoring');
  });

  test('card shows type, version, highlighted snippet, invocation, tags, plugin link (AC26)', async ({ page }) => {
    await page.goto('./?q=refactor&type=skill');
    const card = page.locator('[data-card]').first();
    await expect(card.locator('.kind-badge')).toHaveText('skill');
    await expect(card.locator('.card-version')).toHaveText('v1.2.3');
    await expect(card.locator('mark').first()).toHaveText(/refactor/i);
    await expect(card.locator('.card-invocation code')).toHaveText('/alpha-tools:refactor');
    await expect(card.locator('.card-tags')).toContainText('#refactoring');
    await expect(card.locator('.card-meta a')).toHaveAttribute('href', 'plugin.html?name=alpha-tools');
    await expect(card.getByRole('link', { name: 'Відкрити' })).toHaveAttribute('href', 'artifact.html?plugin=alpha-tools&type=skill&name=refactor');
  });

  test('HTML in descriptions is shown as text (AC27)', async ({ page }) => {
    let dialog = false;
    page.on('dialog', (d) => {
      dialog = true;
      d.dismiss();
    });
    await page.goto('./?q=xss');
    await expect(page.locator('[data-card] .card-snippet').first()).toContainText('<img src=x onerror=alert(1)> literal');
    expect(dialog).toBe(false);
  });

  test('plugin cards show risk badges (AC30)', async ({ page }) => {
    await page.goto('./?type=plugin');
    const gamma = page.locator('[data-card]', { hasText: 'gamma-mcp' });
    await expect(gamma.locator('.risk')).toHaveText(['Запускає hooks', 'Запускає MCP-сервер', 'Запускає LSP-сервер', 'Запускає monitors']);
  });

  test('filters only → catalog overview sorted by name; URL restores state (AC31, AC37, AC38)', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: /скіли/ }).click();
    await expect(page).toHaveURL(/\?type=skill$/);
    await expect(page.locator('[data-results-heading]')).toHaveText('Огляд каталогу');
    const names = await page.locator('.card-title').allTextContents();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'uk', { sensitivity: 'base' })));
    await page.locator('[data-filters] .tag-option', { hasText: 'review' }).click();
    await page.locator('[data-sort]').selectOption('name');
    await expect(page).toHaveURL(/\?type=skill&tag=review&sort=name$/);
    const before = await page.locator('.card-title').allTextContents();
    await page.reload();
    await expect(page.locator('[data-sort]')).toHaveValue('name');
    await expect(page.locator('.card-title')).toHaveText(before);
  });

  test('reset keeps the query (AC33); unknown URL values are ignored (AC39)', async ({ page }) => {
    await page.goto('./?q=review&type=agent,banana&tag=nope');
    await expect(page.locator('[data-filters] input[type=checkbox]:checked')).toHaveCount(1);
    await page.getByRole('button', { name: 'Скинути', exact: true }).click();
    await expect(page).toHaveURL(/\?q=review$/);
    await expect(page.locator('[data-hero-search] input')).toHaveValue('review');
  });

  test('0 results: empty state, clear-filters only with filters, prefilled issue (AC32, AC51, EC21)', async ({ page }) => {
    await page.goto('./?q=' + encodeURIComponent('тестування'));
    await expect(page.getByRole('heading', { name: 'Нічого не знайшли' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Скинути фільтри' })).toHaveCount(0);
    const href = await page.getByRole('link', { name: 'Запропонувати плагін' }).getAttribute('href');
    const url = new URL(href);
    expect(url.origin + url.pathname).toBe('https://github.com/fixture-owner/fixture-repo/issues/new');
    expect(url.searchParams.get('title')).toBe('Пропозиція плагіна: тестування');
    expect(url.searchParams.get('body')).toContain('Шукали: тестування');
    expect(url.searchParams.get('body')).toContain('## Що має робити плагін?');
    expect(url.searchParams.get('body')).toContain('## Приклад використання');
    await page.goto('./?q=' + encodeURIComponent('тестування') + '&type=skill');
    await page.getByRole('button', { name: 'Скинути фільтри' }).click();
    await expect(page).toHaveURL(/\?q=/);
  });

  test('more than 50 results: first 50 + "Показати ще 50" (AC28)', async ({ page }) => {
    await mockIndex(page, bulkIndex(120));
    await page.goto('./?q=bulk');
    await expect(page.locator('[data-card]')).toHaveCount(50);
    await page.getByRole('button', { name: 'Показати ще 50' }).click();
    await expect(page.locator('[data-card]')).toHaveCount(100);
    await page.getByRole('button', { name: 'Показати ще 50' }).click();
    await expect(page.locator('[data-card]')).toHaveCount(120);
    await expect(page.getByRole('button', { name: /Показати ще/ })).toHaveCount(0);
  });

  test('empty marketplace (AC34)', async ({ page }) => {
    await mockIndex(page, (i) => ({ ...i, plugins: [], artifacts: [] }));
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Каталог порожній' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Як почати' })).toHaveAttribute('href', 'getting-started.html');
    await expect(page.getByRole('link', { name: 'Запропонувати плагін' })).toBeVisible();
    await expect(page.locator('.stat')).toHaveCount(0);
  });

  test('index failure shows error + retry (AC50); slow index shows skeleton (AC49)', async ({ page }) => {
    let fail = true;
    await page.route('**/index.json', async (route) => {
      if (fail) return route.fulfill({ status: 500, body: 'boom' });
      await new Promise((r) => setTimeout(r, 700));
      return route.continue();
    });
    await page.goto('./');
    await expect(page.getByText('Не вдалося завантажити індекс плагінів.').first()).toBeVisible();
    await expect(page.locator('[data-footer]')).toHaveText('');
    fail = false;
    await page.getByRole('button', { name: 'Спробувати ще' }).first().click();
    await expect(page.locator('.skeleton').first()).toBeVisible();
    await expect(page.locator('.stat')).toHaveCount(5);
  });

  test('keyboard: "/" focuses search, Esc clears, ↓/↑ move between cards (AC55–AC57)', async ({ page }) => {
    await page.goto('./');
    await page.locator('body').press('/');
    await expect(page.locator('[data-hero-search] input')).toBeFocused();
    await page.keyboard.type('review');
    await expect(page.locator('[data-card]').first()).toBeVisible();
    const input = page.locator('[data-header-search] input');
    await expect(input).toBeFocused();
    await input.press('ArrowDown');
    await expect(page.locator('.card-title').nth(0)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.card-title').nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('.card-title').nth(0)).toBeFocused();
    const href = await page.locator('.card-title').nth(0).getAttribute('href');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(href.replace(/[?.]/g, '\\$&') + '$'));
    await page.goBack();
    await page.locator('[data-header-search] input').press('Escape');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('[data-view="home"]')).toBeVisible();
  });

  test('stop-word-only query keeps the text and shows home (AC72, EC1)', async ({ page }) => {
    await page.goto('./?q=I%20need%20a');
    await expect(page.locator('[data-view="home"]')).toBeVisible();
    await expect(page.locator('[data-hero-search] input')).toHaveValue('I need a');
  });
});
