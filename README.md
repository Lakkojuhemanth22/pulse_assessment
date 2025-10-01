📊 Multi-Source Review Scraper
This is a Node.js script built to scrape customer reviews from multiple popular software review platforms (G2, Capterra, and TrustRadius) and filter the results by a specific date range. It uses Puppeteer for robust browser automation, handling dynamic content loading (like "Load More" buttons) to ensure comprehensive data collection.

🛠️ Prerequisites
Before running the scraper, you need to have the following installed on your system:

Node.js (LTS version recommended)

npm (Node Package Manager)

📦 Installation
Save the Script: Save the provided code as a file named scrapeReviews.js.

Initialize Project: If you don't have a package.json, create one:

npm init -y

Install Dependencies: This script uses puppeteer for browser automation and date-fns for robust date handling.

npm install puppeteer date-fns

Enable ES Modules: Since the script uses import/export syntax (ES modules), you must add "type": "module" to your package.json file.

Your package.json should look something like this:

{
  "name": "review-scraper",
  "version": "1.0.0",
  "type": "module", 
  "dependencies": {
    "date-fns": "^x.x.x",
    "puppeteer": "^x.x.x"
  }
}

🚀 Usage
The script is executed via the command line and requires four positional arguments: the product name, the start date, the end date, and the source platform.

Command Structure
node scrapeReviews.js "Company Name" YYYY-MM-DD YYYY-MM-DD [source]

Argument

Description

Required Format

"Company Name"

The product you want to search for (e.g., "Slack"). Use quotes if the name contains spaces.

string

Start Date

The beginning of the review period (inclusive).

YYYY-MM-DD

End Date

The end of the review period (inclusive).

YYYY-MM-DD

Source

The review platform to scrape.

g2, capterra, or trustradius

Examples
1. Scraping G2 Reviews for Slack
To get all G2 reviews for "Slack" between January 1st, 2024, and June 30th, 2024:

node scrapeReviews.js "Slack" 2024-01-01 2024-06-30 g2

2. Scraping Capterra Reviews for Zoom
To get all Capterra reviews for "Zoom" between October 1st, 2023, and March 31st, 2024:

node scrapeReviews.js "Zoom" 2023-10-01 2024-03-31 capterra

Output
The scraped and filtered data will be saved to a JSON file in the root directory named using the following pattern:

[Company Name]_[Source]_reviews.json

(Example: Slack_g2_reviews.json)

✨ Key Features
1. Robust Dynamic Content Loading (G2 Fix)
The script explicitly addresses the challenge of modern websites that don't load all content via simple scrolling:

G2: It uses a loop to repeatedly click the "Load More" button until it is no longer visible, ensuring all available reviews are loaded before extraction.

Capterra/TrustRadius: It uses combinations of "Load More" clicking and automated scrolling as required by those platforms.

2. Precise Date Filtering
Reviews are fetched and then rigorously filtered against the YYYY-MM-DD date range you provide using the reliable date-fns library. Only reviews posted within that exact window will be included in the final JSON output.

3. Stealth Configuration
The Puppeteer configuration includes several advanced settings (e.g., modifying the navigator.webdriver property and custom user agent strings) to reduce the likelihood of detection by anti-bot measures.
