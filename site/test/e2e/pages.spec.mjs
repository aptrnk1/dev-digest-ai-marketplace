import { expect, test } from '@playwright/test';

test.describe('plugin page', () => {
  test('metadata, install, components, dependencies, transparency, README (AC43, AC45, AC89)', async ({ page }) => {
    await page.goto('plugin.html?name=alpha-tools');
    await expect(page).toHaveTitle('Alpha Tools · Каталог dev-digest');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alpha Tools');
    await expect(page.locator('.version-badge')).toHaveText('v1.2.3');
    await expect(page.locator('.detail-meta')).toContainText('Категорія: engineering');
    await expect(page.locator('.detail-meta')).toContainText('Ліцензія: MIT');
    await expect(page.locator('.terminal pre').first()).toHaveText('claude plugin marketplace add fixture-owner/fixture-repo && claude plugin install alpha-tools@fixture-market');
    await expect(page.getByRole('link', { name: 'View on GitHub ↗' })).toHaveAttribute('href', /tree\/0123456789abcdef0123456789abcdef01234567\/plugins\/alpha-tools$/);
    await expect(page.locator('.comp-group-title')).toHaveText(['скіли', 'агенти', 'команди', 'hooks']);
    await expect(page.locator('.comp', { hasText: 'security' })).toContainText('@agent-alpha-tools:review:security');
    await expect(page.locator('.dep').nth(0)).toHaveText('beta-review ↗');
    await expect(page.locator('.dep').nth(0)).toHaveAttribute('href', 'plugin.html?name=beta-review');
    await expect(page.locator('.dep').nth(1)).toHaveText('gamma-mcp ^1.0.0 ↗');
    await expect(page.locator('.dep').nth(2)).toHaveText('outside-tool@other-marketпоза цим marketplace');
    const transparency = page.locator('section', { has: page.getByRole('heading', { name: 'Що цей плагін запускає на вашій машині' }) });
    await expect(transparency).toContainText('PostToolUse · Write');
    await expect(transparency).toContainText('env: ALPHA_TOKEN');
    await expect(transparency).toContainText('alpha-cli');
    await expect(transparency).toContainText('Плагіни працюють з вашими правами. Перегляньте ці команди перед встановленням.');
    await expect(page.locator('body')).not.toContainText('SECRET-MARKER-123');
    await expect(page.locator('.markdown h2').first()).toHaveText('Alpha Tools');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.markdown img')).toHaveAttribute('src', 'content/_assets/plugins/alpha-tools/assets/logo.png');
  });

  test('no README (AC44), nothing runs (AC46)', async ({ page }) => {
    await page.goto('plugin.html?name=hello');
    await expect(page.getByText('README відсутній.')).toBeVisible();
    await expect(page.getByText('Цей плагін не запускає hooks, MCP- чи LSP-серверів, monitors або бінарників.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Залежності' })).toHaveCount(0);
  });

  test('external plugin (AC47) and unknown plugin (AC48)', async ({ page }) => {
    await page.goto('plugin.html?name=external-plugin');
    await expect(page.getByText('Компоненти не показано: плагін розміщено поза цим репозиторієм.')).toBeVisible();
    await page.goto('plugin.html?name=nope');
    await expect(page.getByText('Плагін "nope" не знайдено')).toBeVisible();
    await page.getByRole('link', { name: '← На головну' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('artifact page', () => {
  test('nested agent: breadcrumbs, invocation, tools, model, docs (AC78, AC79)', async ({ page }) => {
    await page.goto('artifact.html?plugin=alpha-tools&type=agent&name=review:security');
    const crumbs = page.locator('.breadcrumbs');
    await expect(crumbs).toHaveText('Каталог/Alpha Tools/review:security');
    await expect(crumbs.getByRole('link', { name: 'Alpha Tools' })).toHaveAttribute('href', 'plugin.html?name=alpha-tools');
    await expect(page.locator('.invocation-pill code')).toHaveText('@agent-alpha-tools:review:security');
    await expect(page.locator('.tool')).toHaveText(['Read', 'Grep', 'Glob', 'Bash']);
    await expect(page.getByText('Модель: sonnet')).toBeVisible();
    await expect(page.locator('.markdown')).toContainText('Report findings with severity.');
  });

  test('missing tools fields (AC80) and unknown artifact (AC81)', async ({ page }) => {
    await page.goto('artifact.html?plugin=beta-review&type=agent&name=striped');
    await expect(page.getByText('Успадковує всі інструменти сесії')).toBeVisible();
    await page.goto('artifact.html?plugin=hello&type=skill&name=hello');
    await expect(page.getByText('Додаткових дозволів не надає')).toBeVisible();
    await page.goto('artifact.html?plugin=hello&type=skill&name=missing');
    await expect(page.getByText('Артефакт не знайдено')).toBeVisible();
  });

  test('MCP artifact shows command and env names only (AC78, AC13)', async ({ page }) => {
    await page.goto('artifact.html?plugin=gamma-mcp&type=mcp&name=local-db');
    await expect(page.locator('.transparency-list')).toContainText('node server.js --readonly');
    await expect(page.locator('.transparency-list')).toContainText('env: DB_PASSWORD');
    await expect(page.locator('body')).not.toContainText('SECRET-MARKER-123');
  });
});

test('getting started shows three baked-in commands (AC83)', async ({ page }) => {
  await page.route('**/index.json', (route) => route.fulfill({ status: 500 }));
  await page.goto('getting-started.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Як підключити marketplace');
  await expect(page.locator('.terminal pre')).toHaveText([
    '/plugin marketplace add fixture-owner/fixture-repo',
    '/plugin install alpha-tools@fixture-market',
    '/plugin marketplace update fixture-market',
  ]);
  await expect(page.getByText('Не вдалося завантажити індекс плагінів.')).toHaveCount(0);
});

test.describe('copy', () => {
  test('Copy install copies one shell line, shows label and toast (AC40)', async ({ page, browserName, context }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only in Playwright');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('plugin.html?name=hello');
    const button = page.locator('.install button');
    await expect(button).toHaveText('Copy install');
    await button.click();
    await expect(button).toHaveText('Скопійовано ✓');
    await expect(page.locator('.toast')).toHaveText('✓ Скопійовано в буфер');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'claude plugin marketplace add fixture-owner/fixture-repo && claude plugin install hello@fixture-market',
    );
    await expect(button).toHaveText('Copy install', { timeout: 3000 });
  });

  test('invocation copy (AC41)', async ({ page, browserName, context }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only in Playwright');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('./?q=hello&type=skill');
    await page.locator('.card-invocation').getByRole('button', { name: 'Copy' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('/hello:hello');
  });

  test('clipboard unavailable → manual copy field (AC42)', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }));
    await page.goto('plugin.html?name=hello');
    await page.getByRole('button', { name: 'Copy install' }).click();
    await expect(page.getByText('Не вдалося скопіювати — виділіть і скопіюйте вручну')).toBeVisible();
    await expect(page.locator('.copy-fallback textarea')).toHaveValue(/\/plugin install hello@fixture-market/);
    await expect(page.locator('.toast')).toHaveCount(0);
  });
});
