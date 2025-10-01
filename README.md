Overview

SaaS Review Scraper is a Node.js-based scraper for collecting SaaS product reviews from multiple platforms:

G2

Capterra

TrustRadius (bonus)

The scraper allows you to fetch reviews for a specific company/product within a given time range and outputs them into a structured JSON file.

Key Features:

Scrape reviews from multiple sources

Handles pagination and "Load More" buttons

Supports lazy-loaded content

Time-bounded scraping with start and end dates

Saves structured JSON output including title, reviewer, date, rating, pros, cons, and more

🚀 Features
Feature	Description
Sources	G2, Capterra, TrustRadius (bonus)
Time-bounded	Collects reviews only within the given start & end date
Structured Output	JSON with fields: title, reviewer, date, rating, pros, cons, problemsSolved, source
Error Handling	Invalid company names, dates, or failed loads handled gracefully
Bonus	TrustRadius scraping integrated
🛠️ Tech Stack

Node.js v18+ – Official Docs

Puppeteer – Headless browser automation (Docs
)

date-fns – Date parsing & formatting (Docs
)

fs/promises – File system for JSON output

📥 Installation

Clone the repository:

git clone https://github.com/your-repo/review-scraper.git
cd review-scraper


Install dependencies:

npm install puppeteer date-fns

▶️ Usage
node scrapeReviews.js "Company Name" YYYY-MM-DD YYYY-MM-DD source


Arguments:

Argument	Description
Company Name	Name of the SaaS product/company (e.g., "Slack")
YYYY-MM-DD	Start date (e.g., 2023-01-01)
YYYY-MM-DD	End date (e.g., 2026-01-01)
source	g2, capterra, or trustradius
📂 Output

Saved as a JSON file in the project root

File naming convention:

{CompanyName}_{Source}_reviews.json


Sample JSON:

[
  {
    "title": "Great for team communication",
    "reviewer": "Amie S.",
    "date": "2025-09-30",
    "rating": 5,
    "pros": "Easy to use, mobile + desktop support",
    "cons": "Notification overload at times",
    "problemsSolved": "",
    "source": "G2"
  }
]

⚠️ Error Handling

Invalid company name → exits with a message

Invalid date format → must be YYYY-MM-DD

Start date after end date → throws an error

"Load More" or lazy-loaded reviews stop appearing → script gracefully stops and saves available reviews

Example error output:

node scrapeReviews.js "NonExistentProductXYZ" 2023-01-01 2026-01-01 g2

Scraping g2 reviews for "NonExistentProductXYZ" between 2023-01-01 and 2026-01-01
Navigating to G2: https://www.g2.com/products/nonexistentproductxyz/reviews
No reviews found or invalid company/product name.
Scraping failed: No reviews available for the given company.

⚡ Quick Start Test
G2
node scrapeReviews.js "Slack" 2023-01-01 2026-01-01 g2


Expected Output:

Scraping g2 reviews for "Slack" between 2023-01-01 and 2026-01-01
Navigating to G2: https://www.g2.com/products/slack/reviews
Attempting to load all reviews...
Saved X reviews to Slack_g2_reviews.json

Capterra
node scrapeReviews.js "Slack" 2023-01-01 2026-01-01 capterra


Expected Output:

Scraping capterra reviews for "Slack" between 2023-01-01 and 2026-01-01
Navigating to Capterra: https://www.capterra.com/p/slack/reviews
Scrolling to load all reviews...
Saved Y reviews to Slack_capterra_reviews.json

TrustRadius (Bonus)
node scrapeReviews.js "Slack" 2023-01-01 2026-01-01 trustradius


Expected Output:

Scraping trustradius reviews for "Slack" between 2023-01-01 and 2026-01-01
Navigating to TrustRadius: https://www.trustradius.com/products/slack/reviews
Attempting to click "Load More" buttons...
No buttons found, running auto-scroll fallback...
Saved 5 reviews to Slack_trustradius_reviews.json

📊 Evaluation Criteria

✅ Time: Efficient scraping with pagination & lazy-loading
✅ Code Quality: Modular, commented, extensible
✅ Novelty: Integrates TrustRadius for bonus points
✅ Output: Clean JSON with reviewer details, date filtering, and metadata

👨‍💻 Author

Hemanth Lakkoju – Developed for Pulse Coding Assignment

🔗 References

Node.js Official Documentation

Puppeteer Documentation

date-fns Documentation
