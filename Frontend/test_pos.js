import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("Navigating to Login...");
    await page.goto('http://localhost:5173/login');

    // Fill in login
    console.log("Logging in...");
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123'); // Assuming default admin from previous seed
    await page.click('button[type="submit"]');

    console.log("Waiting for Dashboard to load...");
    await page.waitForURL('http://localhost:5173/dashboard', { timeout: 10000 });

    console.log("Navigating to POS...");
    await page.goto('http://localhost:5173/pos');

    // Wait for products to load
    await page.waitForTimeout(2000);

    console.log("Clicking the first product to add to cart...");
    // Find a product card and click it
    const productCards = await page.$$('.nintendo-card.cursor-pointer');
    if (productCards.length > 0) {
        await productCards[0].click();
        console.log("Item added to cart.");
    } else {
        console.log("No products found on POS screen!");
        await browser.close();
        process.exit(1);
    }

    // Wait for ML recommendations API call
    await page.waitForTimeout(2000);

    console.log("Checking for Suggested Add-ons section...");
    const recommendationsBox = await page.$('text="Suggested Add-ons"');

    if (recommendationsBox) {
        console.log("SUCCESS: Recommendations box appeared!");
        // Count recommendations
        const recs = await page.$$('text="🎯"');
        console.log(`Found ${recs.length} recommended items.`);
    } else {
        console.log("FAILURE: Recommendations box did not appear.");
    }

    await browser.close();
})();
