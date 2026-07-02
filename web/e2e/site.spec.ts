import { test, expect, type Page } from '@playwright/test';

const IMPORTED_SLUG = '2025-10-13-wx-4lyhabh'; // 2025 Dresden annual meeting recap

function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

// On mobile the nav is collapsed behind a <details> hamburger; open it first.
async function openNav(page: Page) {
  const details = page.locator('details.mobile-nav');
  if (await details.isVisible()) {
    await details.evaluate((d) => {
      (d as HTMLDetailsElement).open = true;
    });
  }
}

async function clickNav(page: Page, label: string | RegExp) {
  await openNav(page);
  const desktopNav = page.locator('.primary-nav');
  const container = (await desktopNav.isVisible()) ? desktopNav : page.locator('.mobile-nav-panel');
  await container.locator('a').filter({ hasText: label }).first().click();
}

async function clickLang(page: Page, mobileLabel: string) {
  await openNav(page);
  const desktopSwitch = page.locator('.lang-switch');
  if (await desktopSwitch.isVisible()) await desktopSwitch.click();
  else await page.locator('.mobile-nav-panel a').filter({ hasText: mobileLabel }).first().click();
}

test.describe('home', () => {
  test('Chinese home renders hero, nav, news and gallery', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/上海交通大学德国校友会/);
    await expect(page.locator('h1')).toContainText('上海交通大学德国校友会');
    await expect(page.locator('.site-header .brand')).toBeVisible();
    await expect(page.locator('.article-card').first()).toBeVisible();
    await expect(page.locator('.gallery-card').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('German home renders localized chrome', async ({ page }) => {
    await page.goto('/de');
    await expect(page.locator('h1')).toContainText('Verein der Absolventen und Mitglieder');
    await expect(page.locator('a.button.primary').first()).toContainText('Aktuelles ansehen');
  });

  test('first article and gallery images actually load', async ({ page }) => {
    await page.goto('/');
    const img = page.locator('.article-card img, .gallery-card img').first();
    await expect(img).toBeVisible();
    const ok = await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0);
    expect(ok).toBeTruthy();
  });
});

test.describe('language switching', () => {
  test('zh → de and back', async ({ page }) => {
    await page.goto('/');
    await clickLang(page, 'DE');
    await expect(page).toHaveURL(/\/de$/);
    await expect(page.locator('h1')).toContainText('Verein der Absolventen und Mitglieder');
    await clickLang(page, '中文');
    await expect(page).toHaveURL(/localhost:\d+\/$/);
  });
});

test.describe('navigation', () => {
  test('News archive lists articles grouped by year', async ({ page }) => {
    await page.goto('/');
    await clickNav(page, '活动新闻');
    await expect(page).toHaveURL(/\/news$/);
    await expect(page.locator('.archive-year h2').first()).toBeVisible();
    await expect(page.locator('.article-row').first()).toBeVisible();
  });

  test('Gallery page lists albums', async ({ page }) => {
    await page.goto('/gallery');
    await expect(page.locator('.gallery-card').first()).toBeVisible();
  });

  test('mobile dropdown collapses after selecting an item', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile-only behavior');
    await page.goto('/');
    const details = page.locator('details.mobile-nav');
    await details.locator('summary').click();
    await expect(details).toHaveJSProperty('open', true);
    await page.locator('.mobile-nav-panel a').filter({ hasText: '活动新闻' }).first().click();
    await expect(page).toHaveURL(/\/news$/);
    await expect(details).toHaveJSProperty('open', false);
  });
});

test.describe('content pages', () => {
  test('imported WeChat article: title, local images, source link', async ({ page }) => {
    await page.goto(`/${IMPORTED_SLUG}`);
    await expect(page.locator('h1')).toContainText('德累斯顿');
    const imgs = page.locator('.article-body img');
    expect(await imgs.count()).toBeGreaterThan(0);
    const first = imgs.first();
    await expect(first).toHaveAttribute('src', /\/uploads\/wechat\//);
    const loaded = await first.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0);
    expect(loaded).toBeTruthy();
    await expect(page.locator('.article-body a', { hasText: '阅读原文' })).toBeVisible();
  });

  test('Vorstand shows current 2025 board with titles (zh + de)', async ({ page }) => {
    await page.goto('/Vorstand');
    await expect(page.locator('.article-body')).toContainText('冯新亮');
    await expect(page.locator('.article-body')).toContainText('教授');
    await expect(page.locator('.article-body')).not.toContainText('陈恒思');
    await page.goto('/de/Vorstand');
    await expect(page.locator('.article-body')).toContainText('Prof. Xinliang Feng');
  });

  test('legacy /-view/* links are gone from content', async ({ page }) => {
    await page.goto('/AboutUs');
    const hrefs = await page.locator('.article-body a').evaluateAll((as) => as.map((a) => a.getAttribute('href') || ''));
    expect(hrefs.some((h) => h.includes('/-view/'))).toBeFalsy();
  });
});

test.describe('routing & assets', () => {
  test('unknown slug returns localized 404', async ({ page }) => {
    const res = await page.goto('/definitely-not-a-page');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText('页面未找到');
  });

  test('legacy /node/:id redirects to the slug page', async ({ page }) => {
    await page.goto('/node/47');
    await expect(page).toHaveURL(/\/Vorstand$/);
  });

  test('favicon is served', async ({ request }) => {
    const res = await request.get('/icon.png');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  });
});

test.describe('link integrity', () => {
  test('no broken internal links on key pages', async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'run once on desktop');
    const pages = ['/', '/de', '/news', '/gallery', '/AboutUs', '/Vorstand', `/${IMPORTED_SLUG}`];
    const seen = new Set<string>();
    const broken: string[] = [];
    for (const p of pages) {
      await page.goto(p);
      const origin = new URL(page.url()).origin;
      const links = await page.locator('a[href]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
      for (const href of links) {
        if (!href.startsWith(origin)) continue;
        const url = href.split('#')[0];
        if (seen.has(url)) continue;
        seen.add(url);
        const res = await request.get(url);
        if (res.status() >= 400) broken.push(`${res.status()} ${url} (on ${p})`);
      }
    }
    expect(broken, `Broken links:\n${broken.join('\n')}`).toEqual([]);
  });
});

test.describe('performance', () => {
  test('home loads quickly with no uncaught errors', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'timing on desktop');
    const errors = trackPageErrors(page);
    await page.goto('/', { waitUntil: 'load' });
    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return { load: n.loadEventEnd - n.startTime, dcl: n.domContentLoadedEventEnd - n.startTime };
    });
    expect(nav.dcl).toBeLessThan(5000);
    expect(errors).toEqual([]);
  });
});
