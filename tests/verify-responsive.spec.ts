import { test, expect } from '@playwright/test';

const viewports = [
    { width: 360, height: 800, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1366, height: 768, name: 'desktop-laptop' },
    { width: 1920, height: 1080, name: 'desktop-wide' },
];

test.describe('Responsive Visual Verification', () => {
    test.setTimeout(120000); // 2 minutes timeout

    for (const viewport of viewports) {
        test(`capture screenshots for ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
            // Listen to console logs
            page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
            page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

            // Set viewport
            await page.setViewportSize({ width: viewport.width, height: viewport.height });

            // Navigate to app (assuming local dev server or production URL)
            // For local testing, we might need to start the server first or assume it's running.
            // Using the production URL for now as requested in the prompt context implies verification of deployed changes, 
            // but typically we verify local changes first. 
            // I will assume localhost:5173 for local verification as per standard Vite.
            try {
                console.log(`Navigating to http://localhost:5173 for ${viewport.name}...`);
                await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 60000 });
            } catch (e) {
                console.log('Localhost not reachable or timed out, trying production URL as fallback/reference');
                await page.goto('https://data-journaling.web.app', { waitUntil: 'networkidle', timeout: 60000 });
            }

            // Handle Login if needed
            const guestButton = page.getByText('Continue as Guest');
            if (await guestButton.isVisible()) {
                console.log('Login page detected, clicking Continue as Guest...');
                await guestButton.click();
                await page.waitForTimeout(2000); // Wait for transition
            }

            // Wait for content to load
            console.log('Waiting for header selector...');
            await page.waitForSelector('header', { timeout: 30000 });
            console.log('Header found, taking screenshots...');

            // Capture full page
            await page.screenshot({ path: `screenshots/${viewport.name}-full.png`, fullPage: true });

            // Capture specific elements
            const header = page.locator('header');
            await header.screenshot({ path: `screenshots/${viewport.name}-header.png` });

            // Capture sidebar (if visible/open)
            // On mobile it's hidden, on desktop it might be open.
            // We can try to toggle it on mobile to capture the drawer.
            if (viewport.width < 768) {
                const menuButton = page.locator('button[aria-label="Toggle sidebar"]');
                if (await menuButton.isVisible()) {
                    await menuButton.click();
                    await page.waitForTimeout(500); // Wait for animation
                    await page.screenshot({ path: `screenshots/${viewport.name}-sidebar-open.png` });
                    // Close it back
                    await page.locator('.fixed.inset-0').click();
                }
            } else {
                // Desktop sidebar
                const sidebar = page.locator('aside');
                if (await sidebar.isVisible()) {
                    await sidebar.screenshot({ path: `screenshots/${viewport.name}-sidebar.png` });
                }
            }
        });
    }
});
