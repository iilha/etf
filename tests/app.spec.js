const { test, expect } = require('@playwright/test');

test.describe('Taiwan ETFs PWA', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('http://localhost:8009');
  });

  test('page loads with correct title containing "ETF"', async ({ page }) => {
    await expect(page).toHaveTitle(/ETF/i);
  });

  test('page header displays correct title', async ({ page }) => {
    const header = page.locator('h1#page-title');
    await expect(header).toBeVisible();
    const text = await header.textContent();
    expect(text).toMatch(/Taiwan ETFs|台灣ETF/);
  });

  test('has no cross-app navigation links (standalone PWA)', async ({ page }) => {
    // Check for absence of links to other transport apps
    const ubikLink = page.locator('a[href*="ubike"]');
    const mrtLink = page.locator('a[href*="mrt"]');
    const busLink = page.locator('a[href*="bus"]');
    const railLink = page.locator('a[href*="rail"]');

    await expect(ubikLink).toHaveCount(0);
    await expect(mrtLink).toHaveCount(0);
    await expect(busLink).toHaveCount(0);
    await expect(railLink).toHaveCount(0);
  });

  test('has no map element (pure list-based app)', async ({ page }) => {
    // Check that there's no Leaflet map container
    const mapContainer = page.locator('#map, .leaflet-container');
    await expect(mapContainer).toHaveCount(0);
  });

  test('search input exists and is functional', async ({ page }) => {
    const searchInput = page.locator('input#etf-search');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /Search ticker or name/i);

    // Test search functionality
    await searchInput.fill('0050');
    await page.waitForTimeout(300); // Wait for debounce

    // Should filter results
    const etfRows = page.locator('.etf-row');
    await expect(etfRows).toHaveCount(1);
  });

  test('category filter buttons exist and are clickable', async ({ page }) => {
    const filterButtons = page.locator('.filter-btn');

    // Check all expected filter buttons exist
    await expect(filterButtons).toHaveCount(6);

    const allBtn = page.locator('.filter-btn[data-cat="all"]');
    const dividendBtn = page.locator('.filter-btn[data-cat="dividend"]');
    const broadBtn = page.locator('.filter-btn[data-cat="broad"]');
    const techBtn = page.locator('.filter-btn[data-cat="tech"]');
    const bondBtn = page.locator('.filter-btn[data-cat="bond"]');
    const themeBtn = page.locator('.filter-btn[data-cat="theme"]');

    await expect(allBtn).toBeVisible();
    await expect(dividendBtn).toBeVisible();
    await expect(broadBtn).toBeVisible();
    await expect(techBtn).toBeVisible();
    await expect(bondBtn).toBeVisible();
    await expect(themeBtn).toBeVisible();

    // "All" should be active by default
    await expect(allBtn).toHaveClass(/active/);
  });

  test('filter buttons change active state on click', async ({ page }) => {
    const allBtn = page.locator('.filter-btn[data-cat="all"]');
    const dividendBtn = page.locator('.filter-btn[data-cat="dividend"]');

    // Initially "All" is active
    await expect(allBtn).toHaveClass(/active/);
    await expect(dividendBtn).not.toHaveClass(/active/);

    // Click dividend filter
    await dividendBtn.click();
    await page.waitForTimeout(200);

    // Now dividend should be active, all should not
    await expect(dividendBtn).toHaveClass(/active/);
    await expect(allBtn).not.toHaveClass(/active/);
  });

  test('ETF list renders with items', async ({ page }) => {
    const etfList = page.locator('.etf-list');
    await expect(etfList).toBeVisible();

    const etfRows = page.locator('.etf-row');
    const count = await etfRows.count();

    // Should have multiple ETF rows
    expect(count).toBeGreaterThan(0);
  });

  test('ETF rows contain expected elements', async ({ page }) => {
    // Wait for first ETF row to be visible
    const firstRow = page.locator('.etf-row').first();
    await expect(firstRow).toBeVisible();

    // Check for ticker
    const ticker = firstRow.locator('.etf-ticker');
    await expect(ticker).toBeVisible();

    // Check for name
    const name = firstRow.locator('.etf-name');
    await expect(name).toBeVisible();

    // Check for arrow icon
    const arrow = firstRow.locator('.etf-arrow');
    await expect(arrow).toBeVisible();
  });

  test('ETF rows are clickable and expand to show details', async ({ page }) => {
    const firstRow = page.locator('.etf-row').first();
    const ticker = await firstRow.getAttribute('data-ticker');

    // Initially should not be expanded
    await expect(firstRow).not.toHaveClass(/expanded/);

    // Click to expand
    await firstRow.click();
    await page.waitForTimeout(300);

    // Should now be expanded
    await expect(firstRow).toHaveClass(/expanded/);

    // Detail panel should be visible
    const detailPanel = page.locator(`#detail-${ticker}`);
    await expect(detailPanel).toBeVisible();
    await expect(detailPanel).toHaveClass(/open/);

    // Detail should contain some content
    const detailContent = detailPanel.locator('.etf-detail');
    await expect(detailContent).toBeVisible();
  });

  test('clicking expanded row collapses it', async ({ page }) => {
    const firstRow = page.locator('.etf-row').first();

    // Expand
    await firstRow.click();
    await page.waitForTimeout(300);
    await expect(firstRow).toHaveClass(/expanded/);

    // Collapse
    await firstRow.click();
    await page.waitForTimeout(300);
    await expect(firstRow).not.toHaveClass(/expanded/);
  });

  test('language toggle exists and works', async ({ page }) => {
    const langBtn = page.locator('#lang-btn');
    await expect(langBtn).toBeVisible();

    // Default language might be EN or 中
    const initialText = await langBtn.textContent();
    expect(['EN', '中']).toContain(initialText);

    // Click to toggle language
    await langBtn.click();
    await page.waitForTimeout(300);

    // Text should change
    const newText = await langBtn.textContent();
    expect(newText).not.toBe(initialText);
    expect(['EN', '中']).toContain(newText);

    // Page title should change
    const title = await page.title();
    expect(title).toMatch(/Taiwan ETFs|台灣ETF/);
  });

  test('language toggle updates filter button text', async ({ page }) => {
    const dividendBtn = page.locator('.filter-btn[data-cat="dividend"]');
    const langBtn = page.locator('#lang-btn');

    // Get initial text
    const initialText = await dividendBtn.textContent();

    // Toggle language
    await langBtn.click();
    await page.waitForTimeout(300);

    // Text should change
    const newText = await dividendBtn.textContent();
    expect(newText).not.toBe(initialText);
    expect(['Dividend', '高股息']).toContain(newText);
  });

  test('TWSE API URL is configured in source', async ({ page }) => {
    // Check that TWSE_API constant exists in page source
    const content = await page.content();
    expect(content).toContain('TWSE_API');
    expect(content).toContain('openapi.twse.com.tw');
  });

  test('Worker proxy URL is configured in source', async ({ page }) => {
    const content = await page.content();
    expect(content).toContain('WORKER_URL');
    expect(content).toContain('twse-proxy');
  });

  test('manifest.webapp is accessible', async ({ page }) => {
    const response = await page.request.get('http://localhost:8009/manifest.webapp');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/application\/json|application\/manifest\+json/);

    const manifest = await response.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest.name).toMatch(/ETF/i);
  });

  test('service worker script is accessible', async ({ page }) => {
    const response = await page.request.get('http://localhost:8009/sw.js');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/javascript/);
  });

  test('service worker registration exists in HTML', async ({ page }) => {
    const content = await page.content();
    expect(content).toContain('serviceWorker');
    expect(content).toContain('sw.js');
  });

  test('no JavaScript console errors on load', async ({ page }) => {
    const errors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check no errors occurred
    expect(errors).toHaveLength(0);
  });

  test('result count is displayed after filtering', async ({ page }) => {
    const resultCount = page.locator('#result-count');

    // Should be visible after initial load
    await expect(resultCount).toBeVisible();

    // Apply dividend filter
    const dividendBtn = page.locator('.filter-btn[data-cat="dividend"]');
    await dividendBtn.click();
    await page.waitForTimeout(300);

    // Result count should show number
    const countText = await resultCount.textContent();
    expect(countText).toMatch(/\d+/); // Contains a number
  });

  test('search filters ETF list correctly', async ({ page }) => {
    const searchInput = page.locator('input#etf-search');
    const etfRows = page.locator('.etf-row');

    // Get initial count
    const initialCount = await etfRows.count();
    expect(initialCount).toBeGreaterThan(0);

    // Search for specific ticker
    await searchInput.fill('0056');
    await page.waitForTimeout(300);

    // Should filter to fewer results
    const filteredCount = await etfRows.count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);

    // First result should contain 0056
    const firstRowTicker = await etfRows.first().locator('.etf-ticker').textContent();
    expect(firstRowTicker).toContain('0056');
  });

  test('clearing search shows all ETFs again', async ({ page }) => {
    const searchInput = page.locator('input#etf-search');
    const etfRows = page.locator('.etf-row');

    // Get initial count
    const initialCount = await etfRows.count();

    // Search
    await searchInput.fill('0056');
    await page.waitForTimeout(300);
    const filteredCount = await etfRows.count();
    expect(filteredCount).toBeLessThan(initialCount);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);

    // Should show all again
    const finalCount = await etfRows.count();
    expect(finalCount).toBe(initialCount);
  });

  test('filter and search work together', async ({ page }) => {
    const searchInput = page.locator('input#etf-search');
    const dividendBtn = page.locator('.filter-btn[data-cat="dividend"]');
    const etfRows = page.locator('.etf-row');

    // Apply dividend filter
    await dividendBtn.click();
    await page.waitForTimeout(300);
    const dividendCount = await etfRows.count();

    // Add search on top of filter
    await searchInput.fill('00');
    await page.waitForTimeout(300);
    const combinedCount = await etfRows.count();

    // Combined should be same or fewer than filter alone
    expect(combinedCount).toBeLessThanOrEqual(dividendCount);
  });

  test('ETF detail contains expected information fields', async ({ page }) => {
    const firstRow = page.locator('.etf-row').first();
    const ticker = await firstRow.getAttribute('data-ticker');

    // Expand detail
    await firstRow.click();
    await page.waitForTimeout(300);

    const detailPanel = page.locator(`#detail-${ticker}`);
    await expect(detailPanel).toBeVisible();

    // Check for detail grid
    const detailGrid = detailPanel.locator('.detail-grid');
    await expect(detailGrid).toBeVisible();

    // Should contain detail items
    const detailItems = detailPanel.locator('.detail-item');
    const itemCount = await detailItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('localStorage persistence for language preference', async ({ page }) => {
    const langBtn = page.locator('#lang-btn');

    // Toggle to Chinese
    await langBtn.click();
    await page.waitForTimeout(300);

    // Check localStorage
    const storedLang = await page.evaluate(() => localStorage.getItem('etf-lang'));
    expect(storedLang).toBe('zh');

    // Reload page
    await page.reload();
    await page.waitForTimeout(500);

    // Language should persist
    const langText = await langBtn.textContent();
    expect(langText).toBe('中');
  });

  test('responsive design elements are present', async ({ page }) => {
    // Check for container with max-width
    const container = page.locator('.container');
    await expect(container).toBeVisible();

    // Check header exists
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check filter bar wraps on mobile
    const filterBar = page.locator('.filter-bar');
    await expect(filterBar).toBeVisible();
  });

  test('page has proper PWA meta tags', async ({ page }) => {
    const content = await page.content();

    // Check for viewport meta
    expect(content).toContain('viewport');
    expect(content).toContain('initial-scale=1.0');

    // Check for theme-color
    expect(content).toContain('theme-color');

    // Check for apple-mobile-web-app-capable
    expect(content).toContain('apple-mobile-web-app-capable');

    // Check for manifest link
    expect(content).toContain('manifest.webapp');

    // Check for apple-touch-icon
    expect(content).toContain('apple-touch-icon');
  });

  test('ETF data array is populated', async ({ page }) => {
    // Check that ETFS constant exists and has data
    const hasEtfsData = await page.evaluate(() => {
      return typeof ETFS !== 'undefined' && Array.isArray(ETFS) && ETFS.length > 0;
    });
    expect(hasEtfsData).toBeTruthy();
  });

  test('page initializes correctly', async ({ page }) => {
    // Wait for initialization
    await page.waitForLoadState('networkidle');

    // Check that initialize function ran
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.reload();
    await page.waitForTimeout(1000);

    // Should see initialization log
    const hasInitLog = consoleMessages.some(msg => msg.includes('[ETF]'));
    expect(hasInitLog).toBeTruthy();
  });

  test('footer or attribution is present if exists', async ({ page }) => {
    // Check if there's any footer element (optional, won't fail test)
    const footer = page.locator('footer');
    const footerExists = await footer.count();

    // This is just informational, not a failure point
    console.log(`Footer element found: ${footerExists > 0}`);
  });
});
