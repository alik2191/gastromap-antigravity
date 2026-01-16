// ============================================
// PLAYWRIGHT CONFIGURATION
// Сохраните этот файл как: playwright.config.js (в корне проекта)
// ============================================

/*
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
*/

// ============================================
// TEST 1: RESPONSIVE DASHBOARD
// Сохраните как: e2e/responsive-dashboard.spec.js
// ============================================

/*
import { test, expect } from '@playwright/test';

const responsiveViewports = [
  { width: 375, height: 667, name: 'Mobile-iPhone-SE' },
  { width: 390, height: 844, name: 'Mobile-iPhone-12' },
  { width: 768, height: 1024, name: 'Tablet-iPad' },
  { width: 1366, height: 768, name: 'Desktop-Laptop' },
  { width: 1920, height: 1080, name: 'Desktop-Full-HD' },
];

test.describe('Dashboard Responsive Design', () => {
  responsiveViewports.forEach(viewport => {
    test(`Layout and UI elements on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/Dashboard');
      await page.waitForLoadState('networkidle');

      // Screenshot for visual regression testing
      await expect(page).toHaveScreenshot(`dashboard-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });

      // Check main heading visibility
      const mainHeading = page.locator('h1').first();
      await expect(mainHeading).toBeVisible();

      // Check location cards render
      await page.waitForSelector('[role="link"]', { timeout: 10000 });
      const locationCards = page.locator('[role="link"]');
      const cardCount = await locationCards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Mobile-specific checks
      if (viewport.width <= 768) {
        // Bottom navigation should be visible on mobile
        const mobileNav = page.locator('nav').last();
        await expect(mobileNav).toBeVisible();

        // Check if cards are stacked vertically
        const firstCard = locationCards.first();
        const firstCardBox = await firstCard.boundingBox();
        expect(firstCardBox.width).toBeLessThanOrEqual(viewport.width - 40);

        // Save button should be full width on mobile cards
        const saveButton = page.getByRole('button', { name: /save|add to wishlist/i }).first();
        await expect(saveButton).toBeVisible();
        const saveButtonBox = await saveButton.boundingBox();
        expect(saveButtonBox.width).toBeGreaterThan(100);
      } else {
        // Desktop-specific checks
        // Check grid layout - cards should be side by side
        const firstCard = locationCards.first();
        const secondCard = locationCards.nth(1);
        
        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();
        
        // On desktop, cards should be in columns
        if (viewport.width >= 1024) {
          expect(firstBox.y).toBeLessThanOrEqual(secondBox.y + 50);
        }
      }

      // Check filter button visibility
      const filterButton = page.getByRole('button', { name: /filter/i });
      await expect(filterButton).toBeVisible();

      // Check search input
      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
    });
  });

  test('Filter panel responsive behavior', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/Dashboard');
    await page.waitForLoadState('networkidle');

    // Open filter panel
    const filterButton = page.getByRole('button', { name: /filter/i });
    await filterButton.click();

    // Panel should slide up from bottom on mobile
    await expect(page.getByText(/type|price|rating/i).first()).toBeVisible();

    // Take screenshot of open filter
    await expect(page).toHaveScreenshot('filter-panel-mobile.png', {
      maxDiffPixelRatio: 0.05,
    });

    // Close and verify
    const closeButton = page.getByRole('button', { name: /close/i }).first();
    await closeButton.click();
  });
});
*/

// ============================================
// TEST 2: LOCATION DETAIL RESPONSIVE
// Сохраните как: e2e/responsive-location-detail.spec.js
// ============================================

/*
import { test, expect } from '@playwright/test';

const responsiveViewports = [
  { width: 375, height: 667, name: 'Mobile-iPhone-SE' },
  { width: 768, height: 1024, name: 'Tablet-iPad' },
  { width: 1920, height: 1080, name: 'Desktop-Full-HD' },
];

test.describe('Location Detail Responsive Design', () => {
  responsiveViewports.forEach(viewport => {
    test(`Location detail layout on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/Dashboard');
      await page.waitForLoadState('networkidle');

      // Click first location
      const firstCard = page.locator('[role="link"]').first();
      await firstCard.click();
      await page.waitForURL(/LocationDetail/, { timeout: 5000 });

      // Screenshot
      await expect(page).toHaveScreenshot(`location-detail-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });

      // Hero image should be visible
      const heroImage = page.locator('img').first();
      await expect(heroImage).toBeVisible();

      // Title should be visible
      const title = page.locator('h1');
      await expect(title).toBeVisible();

      // Action buttons (Save, Visited)
      const saveButton = page.getByRole('button', { name: /save to wishlist/i });
      const visitedButton = page.getByRole('button', { name: /visited/i });
      
      await expect(saveButton).toBeVisible();
      await expect(visitedButton).toBeVisible();

      // Mobile-specific checks
      if (viewport.width <= 768) {
        // Buttons should be full width on mobile
        const saveButtonBox = await saveButton.boundingBox();
        expect(saveButtonBox.width).toBeGreaterThan(150);

        // Back button should be visible
        const backButton = page.getByLabel(/back to dashboard/i);
        await expect(backButton).toBeVisible();
      }

      // Tabs should be visible
      const overviewTab = page.getByRole('tab', { name: /overview/i });
      const reviewsTab = page.getByRole('tab', { name: /reviews/i });
      const notesTab = page.getByRole('tab', { name: /my notes/i });

      await expect(overviewTab).toBeVisible();
      await expect(reviewsTab).toBeVisible();
      await expect(notesTab).toBeVisible();
    });
  });

  test('Tabs navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/Dashboard');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('[role="link"]').first();
    await firstCard.click();
    await page.waitForURL(/LocationDetail/, { timeout: 5000 });

    // Test each tab
    const reviewsTab = page.getByRole('tab', { name: /reviews/i });
    await reviewsTab.click();
    await expect(page).toHaveScreenshot('location-detail-reviews-mobile.png', {
      fullPage: true,
    });

    const notesTab = page.getByRole('tab', { name: /my notes/i });
    await notesTab.click();
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page).toHaveScreenshot('location-detail-notes-mobile.png', {
      fullPage: true,
    });
  });
});
*/

// ============================================
// TEST 3: MOBILE LOCATION CARD
// Сохраните как: e2e/mobile-location-card.spec.js
// ============================================

/*
import { test, expect } from '@playwright/test';

test.describe('Mobile Location Card Design', () => {
  test('Card layout and elements on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/Dashboard');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[role="link"]', { timeout: 10000 });
    const firstCard = page.locator('[role="link"]').first();

    // Screenshot of card
    await expect(firstCard).toHaveScreenshot('location-card-mobile.png', {
      maxDiffPixelRatio: 0.05,
    });

    // Check image aspect ratio
    const image = firstCard.locator('img');
    const imageBox = await image.boundingBox();
    const aspectRatio = imageBox.width / imageBox.height;
    expect(aspectRatio).toBeCloseTo(4/3, 0.2); // 4:3 aspect ratio

    // Check title visibility and truncation
    const title = firstCard.locator('h3');
    await expect(title).toBeVisible();
    const titleBox = await title.boundingBox();
    expect(titleBox.height).toBeLessThan(50); // Should be single line

    // Check Save button
    const saveButton = page.getByRole('button', { name: /save|add to wishlist/i }).first();
    await expect(saveButton).toBeVisible();
    
    const buttonBox = await saveButton.boundingBox();
    const cardBox = await firstCard.boundingBox();
    
    // Button should be nearly full width of card (with padding)
    expect(buttonBox.width).toBeGreaterThan(cardBox.width * 0.8);
    expect(buttonBox.height).toBeGreaterThanOrEqual(32); // Minimum touch target

    // Check badges don't overflow
    const badges = firstCard.locator('.badge, [class*="badge"]');
    const badgeCount = await badges.count();
    
    for (let i = 0; i < badgeCount; i++) {
      const badge = badges.nth(i);
      const badgeBox = await badge.boundingBox();
      expect(badgeBox.x + badgeBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width);
    }
  });

  test('Card touch interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/Dashboard');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[role="link"]', { timeout: 10000 });
    
    // Test Save button click doesn't navigate
    const saveButton = page.getByRole('button', { name: /save|add to wishlist/i }).first();
    const currentUrl = page.url();
    
    await saveButton.click();
    await page.waitForTimeout(500);
    
    // Should still be on Dashboard
    expect(page.url()).toBe(currentUrl);

    // Test card click navigates
    const firstCard = page.locator('[role="link"]').first();
    await firstCard.click();
    await page.waitForURL(/LocationDetail/, { timeout: 5000 });
    expect(page.url()).toContain('LocationDetail');
  });

  test('Badge visibility and styling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/Dashboard');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[role="link"]', { timeout: 10000 });
    
    // Check for NEW badge animation
    const newBadge = page.locator('text=/NEW/i').first();
    if (await newBadge.count() > 0) {
      await expect(newBadge).toBeVisible();
      await expect(newBadge).toHaveScreenshot('new-badge.png');
    }

    // Check for Updated badge
    const updatedBadge = page.locator('text=/Updated/i').first();
    if (await updatedBadge.count() > 0) {
      await expect(updatedBadge).toBeVisible();
      await expect(updatedBadge).toHaveScreenshot('updated-badge.png');
    }
  });
});
*/

// ============================================
// TEST 4: AI ASSISTANT RESPONSIVE
// Сохраните как: e2e/ai-assistant.spec.js
// ============================================

/*
import { test, expect } from '@playwright/test';

test.describe('AI Assistant Responsive Design', () => {
  test('AI chat window on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/Dashboard');
    await page.waitForLoadState('networkidle');

    // Click AI button
    const aiButton = page.locator('button').filter({ 
      has: page.locator('svg[class*="lucide-sparkles"]') 
    }).first();
    await aiButton.click();

    // Wait for chat window
    await expect(page.getByText(/AI Guide/i)).toBeVisible();

    // Screenshot of chat window
    await expect(page).toHaveScreenshot('ai-chat-mobile.png', {
      maxDiffPixelRatio: 0.05,
    });

    // Check chat window takes full screen on mobile
    const chatWindow = page.locator('div').filter({ 
      hasText: /AI Guide/ 
    }).first();
    const windowBox = await chatWindow.boundingBox();
    
    expect(windowBox.width).toBeGreaterThanOrEqual(375 - 20);
    expect(windowBox.height).toBeGreaterThan(500);

    // Check input field visibility
    const input = page.getByPlaceholder(/what are you looking for/i);
    await expect(input).toBeVisible();

    // Check send button
    const sendButton = page.getByRole('button').filter({ 
      has: page.locator('svg[class*="send"]') 
    });
    await expect(sendButton.first()).toBeVisible();
  });

  test('AI chat window on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/Dashboard');
    await page.waitForLoadState('networkidle');

    const aiButton = page.locator('button').filter({ 
      has: page.locator('svg[class*="lucide-sparkles"]') 
    }).first();
    await aiButton.click();

    await expect(page.getByText(/AI Guide/i)).toBeVisible();

    // Screenshot
    await expect(page).toHaveScreenshot('ai-chat-desktop.png', {
      maxDiffPixelRatio: 0.05,
    });

    // On desktop, chat should be a floating window, not full screen
    const chatWindow = page.locator('div').filter({ 
      hasText: /AI Guide/ 
    }).first();
    const windowBox = await chatWindow.boundingBox();
    
    expect(windowBox.width).toBeLessThan(600); // Fixed width on desktop
  });
});
*/

// ============================================
// ИНСТРУКЦИИ ПО ЗАПУСКУ
// ============================================

/*

1. Создайте playwright.config.js в корне проекта (скопируйте из секции PLAYWRIGHT CONFIGURATION)

2. Создайте папку e2e/ в корне проекта

3. Создайте файлы тестов в папке e2e/:
   - e2e/responsive-dashboard.spec.js
   - e2e/responsive-location-detail.spec.js
   - e2e/mobile-location-card.spec.js
   - e2e/ai-assistant.spec.js

4. Установите браузеры Playwright (если еще не установлены):
   npx playwright install

5. Запустите тесты:
   npx playwright test

6. Просмотрите отчет:
   npx playwright show-report

7. Запустите тесты в UI режиме (интерактивный):
   npx playwright test --ui

8. Запустите конкретный тест:
   npx playwright test responsive-dashboard

9. Запустите только для одного браузера:
   npx playwright test --project="Mobile Chrome"

ВАЖНО: При первом запуске будут созданы эталонные скриншоты. 
При последующих запусках тесты будут сравнивать с эталонами и показывать различия.

*/

export default null;