import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { format, parse, isWithinInterval } from 'date-fns';

// --- Utility Functions ---

/** Helper for inserting a reliable delay */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


function parseDate(dateStr) {
    if (!dateStr) return null;
    // Clean common prefixes/suffixes and normalize whitespace
    const cleanDateText = dateStr.replace(/reviewed on|posted on|verified review|\||reviewed/i, '').trim();

    // Standard formats used by date-fns
    const formats = [
        'MMMM d, yyyy', 'MMM d, yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy',
        'MMMM yyyy', 'MMM yyyy', 'M/d/yy', 'M/d/yyyy' // Added common short formats
    ];

    for (const fmt of formats) {
        try {
            // date-fns parse function uses the current date for missing parts (like day)
            const d = parse(cleanDateText, fmt, new Date());
            if (!isNaN(d.getTime())) return d;
        } catch {}
    }

    return null;
}

/**
 * Scrolls the page down repeatedly to load lazy-loaded content.
 * Used as a fallback for sites without a clean "Load More" button.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 */
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise(resolve => {
            let totalHeight = 0;
            const distance = 500; // Scroll distance
            const maxScrolls = 50; // Safety limit
            let scrolls = 0;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                scrolls++;
                // Stop scrolling if we reached the bottom or hit the limit
                if (totalHeight >= scrollHeight - window.innerHeight || scrolls >= maxScrolls) {
                    clearInterval(timer);
                    resolve();
                }
            }, 300); // Wait 300ms between scrolls
        });
    });
}

// --- Main Scraper Logic ---

async function scrapeReviews(companyName, startDate, endDate, source) {
    if (!companyName) throw new Error('Company name is required');

    const parsedStartDate = parse(startDate, 'yyyy-MM-dd', new Date());
    const parsedEndDate = parse(endDate, 'yyyy-MM-dd', new Date());

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    // Set end date to end of day to include reviews posted on the endDate
    parsedEndDate.setHours(23, 59, 59, 999);

    if (parsedStartDate > parsedEndDate) throw new Error('Start date must be before end date');

    const validSources = ['g2', 'capterra', 'trustradius'];
    const normalizedSource = source.toLowerCase();
    if (!validSources.includes(normalizedSource)) {
        throw new Error(`Invalid source. Choose from: ${validSources.join(', ')}`);
    }

    console.log(`Scraping ${normalizedSource} reviews for "${companyName}" between ${startDate} and ${endDate}`);

    let browser;
    try {
        // ENHANCED BROWSER CONFIGURATION
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled', // Essential for stealth
                '--disable-dev-shm-usage',
                '--window-size=1920,1080',
                '--disable-notifications',
                '--disable-popup-blocking',
            ],
            ignoreHTTPSErrors: true
        });

        const page = await browser.newPage();

        // ENHANCED STEALTH CONFIGURATION
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });
        await page.evaluateOnNewDocument(() => {
            // Remove automation indicators
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });
        // END OF ENHANCED STEALTH CONFIGURATION

        let reviews = [];

        switch (normalizedSource) {
            case 'g2':
                reviews = await scrapeG2(page, companyName, parsedStartDate, parsedEndDate);
                break;
            case 'capterra':
                reviews = await scrapeCapterra(page, companyName, parsedStartDate, parsedEndDate);
                break;
            case 'trustradius':
                reviews = await scrapeTrustRadius(page, companyName, parsedStartDate, parsedEndDate);
                break;
        }

        const filename = `${companyName.replace(/\s+/g,'_')}_${normalizedSource}_reviews.json`;
        await fs.writeFile(filename, JSON.stringify(reviews, null, 2));
        console.log(`Saved ${reviews.length} reviews to ${filename}`);
        return reviews;

    } catch (err) {
        console.error('Scraping failed:', err.message);
        throw err;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// ------------------- G2 Scraper (Fixed with Load More Loop) -------------------
async function scrapeG2(page, companyName, startDate, endDate) {
    const reviews = [];
    const productSlug = companyName.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.g2.com/products/${productSlug}/reviews`;
    // G2's reliable selector for the "Load More" button
    const loadMoreSelector = 'button[data-qa="loadMoreButton"]';

    console.log(`Navigating to G2: ${url}`);
    
    // Navigate to the base review URL
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    
    // --- Load More Loop ---
    let reviewsLoaded = 0;
    let iteration = 0;
    const maxLoads = 30;
    console.log('Attempting to load all reviews by clicking "Load More" button...');

    while (iteration < maxLoads) {
        iteration++;
        try {
            // Wait for the button to appear
            await page.waitForSelector(loadMoreSelector, { timeout: 5000 });

            const isButtonVisible = await page.evaluate((selector) => {
                const button = document.querySelector(selector);
                // Check if button exists, is not disabled, and is visible
                const style = window.getComputedStyle(button);
                return button && !button.disabled && style.display !== 'none' && style.visibility !== 'hidden';
            }, loadMoreSelector);

            if (!isButtonVisible) {
                console.log(`Load More button is no longer visible after ${iteration} clicks. Stopping loop.`);
                break;
            }

            // Click the button
            await page.click(loadMoreSelector);
            await delay(1500); // Give time for new reviews to render

            // Check if the review count increased
            const currentReviewCount = await page.$$eval('.review-list__item', items => items.length);
            if (currentReviewCount === reviewsLoaded) {
                 console.log(`Review count did not increase after click ${iteration}. Exiting loop.`);
                 break;
            }
            reviewsLoaded = currentReviewCount;
            console.log(`Found ${reviewsLoaded} reviews after load attempt ${iteration}.`);

        } catch (error) {
            // Timeout or navigation failure means the button is likely gone or stuck.
            console.log(`"Load More" button timed out or not found after ${iteration} attempts. Stopping load loop.`);
            break;
        }
    }
    
    // --- Extraction after loading all reviews ---
    console.log('Starting extraction of visible reviews...');

    const rawReviews = await page.evaluate(() => {
        // Use the common, predictable review item selector
        const reviewCards = document.querySelectorAll('.review-list__item');
        
        return Array.from(reviewCards).map(r => {
            const getText = (selector) => r.querySelector(selector)?.textContent.trim() || '';
            const getRating = () => {
                // Find rating component and count the filled stars
                const ratingEl = r.querySelector('[data-qa="rating-component"]');
                return ratingEl ? ratingEl.querySelectorAll('.full-star-icon').length : 0;
            };

            // Using G2's reliable data-qa attributes
            return {
                title: getText('[data-qa="review-title"]'),
                reviewer: getText('[data-qa="reviewer-name"]'),
                date: getText('[data-qa="review-date-posted"]'),
                pros: getText('[data-qa="review-pros-text"]'),
                cons: getText('[data-qa="review-cons-text"]'),
                rating: getRating(),
                source: 'G2'
            };
        });
    });

    // --- Filtering and Formatting ---
    for (const r of rawReviews) {
        const reviewDate = parseDate(r.date);
        
        // Ensure we have a valid date, it's within the interval, and the review has content
        if (reviewDate && isWithinInterval(reviewDate, { start: startDate, end: endDate }) && (r.pros || r.cons)) {
            // Format the Date object back to clean YYYY-MM-DD string
            r.date = format(reviewDate, 'yyyy-MM-dd');
            reviews.push(r);
        }
    }

    return reviews;
}

// ------------------- Capterra Scraper -------------------
async function scrapeCapterra(page, companyName, startDate, endDate) {
    const reviews = [];
    // Using a reliable slug (e.g., /p/135003/Slack/reviews) is best, but we'll use a dynamic one
    const url = `https://www.capterra.com/p/${companyName.toLowerCase().replace(/\s+/g, '-')}/reviews`;

    console.log(`Navigating to Capterra: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // The autoScroll function is used here to trigger lazy-loaded Capterra reviews.
    console.log('Scrolling to load all Capterra reviews...');
    await autoScroll(page);
    await delay(3000);

    const pageReviews = await page.evaluate(() => {
        const getText = (r, selectors) => {
            for (const sel of selectors) {
                const el = r.querySelector(sel);
                if (el && el.textContent.trim()) return el.textContent.trim();
            }
            return '';
        };

        const reviewElements = document.querySelectorAll(
            'div[data-test-id="review-cards-container"] > div:not([data-test-id="load-more-container"])'
        );

        return Array.from(reviewElements).map(r => {
            const dateEl = r.querySelector('.space-y-1 .typo-0.text-neutral-90');
            const date = dateEl ? dateEl.textContent.trim() : '';

            const ratingEl = r.querySelector('div[data-testid="rating"]');
            const rating = ratingEl ? ratingEl.querySelectorAll('i[role="img"][aria-label*="star-full"]').length : null;
            
            // Extract detailed pros/cons/problems solved
            let pros = '', cons = '', problemsSolved = '';
            const detailSections = r.querySelectorAll('.space-y-6 > .space-y-2');
            detailSections.forEach(section => {
                const headerText = section.querySelector('span.font-semibold span')?.textContent.trim() || '';
                const content = section.querySelector('p')?.textContent.trim() || '';
                if (headerText === 'Pros') pros = content; 
                else if (headerText === 'Cons') cons = content;
                else if (headerText.toLowerCase().includes('problems solved')) problemsSolved = content;
            });

            return {
                reviewer: getText(r, ['.typo-10.text-neutral-90 span.typo-20.font-semibold']),
                title: getText(r, ['h3.typo-20.font-semibold']),
                date: date,
                rating: rating,
                pros: pros,
                cons: cons,
                problemsSolved: problemsSolved,
                source: 'Capterra'
            };
        });
    });

    for (const r of pageReviews) {
        const reviewDate = parseDate(r.date); 
        if (reviewDate && isWithinInterval(reviewDate, { start: startDate, end: endDate })) {
            r.date = format(reviewDate, 'yyyy-MM-dd');
            reviews.push(r);
        }
    }
    return reviews;
}

// ------------------- TrustRadius Scraper -------------------
async function scrapeTrustRadius(page, companyName, startDate, endDate) {
    const reviews = [];
    const formattedCompanyName = companyName.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.trustradius.com/products/${formattedCompanyName}/reviews`;

    console.log(`Navigating to TrustRadius: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // --- Load More Loop (Optimized) ---
    console.log('Attempting to click "Load More" buttons on TrustRadius...');
    let loadMoreCount = 0;
    const maxLoads = 10;

    while (loadMoreCount < maxLoads) {
        const buttonExists = await page.evaluate(async () => {
             const loadMoreButton = document.querySelector('button[data-testid="load-more-button"], button.load-more-reviews');
             if (loadMoreButton && !loadMoreButton.disabled) {
                 const style = window.getComputedStyle(loadMoreButton);
                 if (style.display !== 'none' && style.visibility !== 'hidden') {
                     loadMoreButton.click();
                     return true;
                 }
             }
             return false;
        });

        if (buttonExists) {
            await delay(2000); // Wait for content to load
            loadMoreCount++;
            console.log(`Loaded more reviews (${loadMoreCount})`);
        } else {
            console.log('No visible "Load More" button found. Stopping load loop.');
            break;
        }
    }
    
    // Fallback scroll, if the page uses both mechanisms
    if (loadMoreCount === 0) {
        console.log('No buttons found, running auto-scroll fallback...');
        await autoScroll(page);
    }
    await delay(2000);

    const pageReviews = await page.evaluate(() => {
        const getText = (r, selectors) => {
            for (const sel of selectors) {
                const el = r.querySelector(sel);
                if (el && el.textContent.trim()) return el.textContent.trim();
            }
            return '';
        };
        
        const getRating = (r) => {
            const el = r.querySelector('[class*="_sr-only"]');
            if (!el) return null;
            const text = el.textContent;
            const m = text.match(/Rating: (\d+(\.\d+)?)\s*out of 10/i);
            // Convert 1-10 scale to 1-5 scale
            if (m && m[1]) return parseFloat(m[1]) * 0.5;
            return null;
        };

        const reviewElements = document.querySelectorAll(
             'article[class*="ReviewNew_article"], .tr-review-card, .review-detail, article[role="article"]'
        );

        return Array.from(reviewElements).map(r => {
            const problemsSolved = getText(r, ['[id*="-text"] [class*="ReviewAnswer_longForm"] div', '[id*="question-"] [class*="ReviewAnswer_longForm"] div']);
            const likeBest = getText(r, ['[class*="ReviewAnswer_pros-list"] ul', '[class*="ReviewAnswer_pros-list"]']);
            const dislike = getText(r, ['[class*="ReviewAnswer_cons-list"] ul', '[class*="ReviewAnswer_cons-list"]']);

            return {
                reviewer: getText(r, ['div[class*="Byline_byline"] a[class*="Byline_name"]', '.reviewer-name', '.author']),
                title: getText(r, ['h4[class*="Header_heading"] a', 'h3', 'h4', '.review-title-text']),
                date: getText(r, ['div[class*="Header_date"]', 'time', '.review-date', '.review-timestamp']),
                rating: getRating(r),
                pros: likeBest,
                cons: dislike,
                problemsSolved: problemsSolved,
                source: 'TrustRadius'
            };
        });
    });

    for (const r of pageReviews) {
        const reviewDate = parseDate(r.date);
        if (reviewDate && isWithinInterval(reviewDate, { start: startDate, end: endDate })) {
            r.date = format(reviewDate, 'yyyy-MM-dd');
            reviews.push(r);
        }
    }

    return reviews;
}

// ------------------- CLI Execution (ES Module Wrapper) -------------------

// Use an async IIFE to allow top-level await for the main function call.
(async () => {
    const args = process.argv.slice(2);
    const [companyName, startDate, endDate, source] = args;

    if (args.length < 4) {
        console.log('Usage: node scrapeReviews.js "Company Name" YYYY-MM-DD YYYY-MM-DD [g2|capterra|trustradius]');
        console.log('Example: node scrapeReviews.js "Slack" 2024-01-01 2024-06-30 g2');
        process.exit(1);
    }

    try {
        await scrapeReviews(companyName, startDate, endDate, source);
    } catch (err) {
        // Error already logged in scrapeReviews, exit with failure code
        process.exit(1);
    }
})();
// ------------------- End of File -------------------