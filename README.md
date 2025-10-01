# Review Scraper

This is a Node.js script built to scrape customer reviews from multiple popular software review platforms (G2, Capterra, and TrustRadius) and filter the results by a specific date range. It uses Puppeteer for robust browser automation, handling dynamic content loading (like "Load More" buttons) to ensure comprehensive data collection.

## Features

- Scrapes reviews from G2, Capterra, and TrustRadius.
- Filters reviews based on a specified date range.
- Saves the extracted reviews in a JSON file.
- Handles lazy-loaded content and pagination.
- Robust error handling and fallback mechanisms for finding company pages.
- Flexible date parsing to accommodate various date formats.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository or download the source code.
2. Navigate to the project directory.
3. Install the required dependencies:

   ```bash
   npm install
   ```

## Usage

Run the scraper using the following command:

```bash
node review-scraper.js "Company Name" YYYY-MM-DD YYYY-MM-DD [g2|capterra|trustradius]
```

### Parameters:

- `Company Name`: The name of the company to scrape reviews for (in quotes if it contains spaces)
- First `YYYY-MM-DD`: Start date for filtering reviews (inclusive)
- Second `YYYY-MM-DD`: End date for filtering reviews (inclusive)
- Source: One of the supported review platforms (`g2`, `capterra`, or `trustradius`)

### Examples:

```bash
# Scrape G2 reviews for Slack from January 1, 2023 to December 31, 2023
node review-scraper.js "Slack" 2023-01-01 2023-12-31 g2

# Scrape Capterra reviews for Microsoft Teams from March 1, 2023 to April 30, 2023
node review-scraper.js "Microsoft Teams" 2023-03-01 2023-04-30 capterra

# Scrape TrustRadius reviews for Zoom from January 1, 2024 to June 30, 2024
node review-scraper.js "Zoom" 2024-01-01 2024-06-30 trustradius
```

## Output

Scraping capterra reviews for "Slack" between 2023-01-01 and 2026-01-01
Navigating to Capterra: https://www.capterra.com/p/135003/Slack/reviews
Scrolling to load all Capterra reviews...
Saved 25 reviews to Slack_capterra_reviews.json

### Sample JSON Output:

```json
[
  {
    "title": "Great tool for team communication",
    "description": "Slack has been a game-changer for our team's communication. The interface is intuitive and the integrations are powerful.",
    "date": "2023-05-15",
    "rating": 4.5,
    "reviewer": "John Smith",
    "source": "G2"
  },
  {
    "title": "Needs improvement in video calls",
    "description": "While the messaging features are excellent, the video call functionality could use some improvement compared to dedicated video conferencing tools.",
    "date": "2023-03-22",
    "rating": 3,
    "reviewer": "Jane Doe",
    "source": "G2"
  }
]
```

## How It Works

The scraper performs the following steps:

1. Validates input parameters (company name, date range, and source).
2. Launches a Puppeteer browser instance with appropriate settings.
3. Attempts to find the company page on the selected review platform:
   - Tries direct URL formats first
   - Falls back to search functionality if direct URLs fail
4. Extracts reviews from the page, handling pagination where available.
5. Parses and normalizes dates from various formats.
6. Filters reviews based on the specified date range.
7. Saves the results to a JSON file.

## Supported Platforms

### G2
- Scrapes review title, content, date, rating, and reviewer name.
- Handles pagination to collect reviews from multiple pages.
- Supports multiple URL formats and search fallback.

### Capterra
- Extracts reviews including title, content, rating, and date.
- Navigates through search results if direct URL access fails.
- Handles Capterra's specific page structure and review formats.

### TrustRadius
- Collects detailed reviews including pros, cons, and ratings.
- Supports "Load More" functionality to get additional reviews.
- Processes TrustRadius's unique date formats and review structure.

## Notes

- The scraper runs with `headless: false` by default, which means you'll see the browser window during execution. This can be changed to `true` in the code for production use.
- Screenshots are saved during the Capterra and TrustRadius scraping process for debugging purposes.
- The scraper limits pagination to 5 pages by default to prevent excessive requests.
- Reviews with unparseable dates are included with a date value of "unknown".

## Troubleshooting

- If the scraper fails to find a company, try different variations of the company name.
- Some websites may change their structure over time, which could require updates to the selectors used in the code.
- If you encounter CAPTCHA or access restrictions, you may need to adjust the request headers or implement additional anti-bot detection measures.

## Author

Hemanth Lakkoju – Developed for Pulse Coding Assignment

## References

Node.js Official Documentation

Puppeteer Documentation

date-fns Documentation
