SaaS Review Scraper

📌 Objective

This project is a review scraper for SaaS product reviews from multiple sources (G2, Capterra, and TrustRadius for bonus). It allows scraping reviews for a given company within a specified time range and saves them into a structured JSON file.

The script:

Accepts Company Name, Start Date, End Date, and Source as inputs.

Scrapes reviews from G2 and Capterra (bonus: TrustRadius).

Handles pagination/load more and lazy-loading of reviews.

Saves output as a structured JSON file with fields like title, reviewer, date, rating, pros, cons, and description.

🚀 Features

Scrape reviews from G2 and Capterra.

Bonus: Scraping support for TrustRadius.

Time-bounded scraping: Only collects reviews within a given start & end date.

Structured JSON output including:

title – Review title

reviewer – Reviewer’s name (if available)

date – Review date (standardized to YYYY-MM-DD)

rating – Star rating (standardized to 1–5 scale)

pros – Pros mentioned by the reviewer (if available)

cons – Cons mentioned by the reviewer (if available)

problemsSolved – (Bonus field for Capterra/TrustRadius)

source – Review source (G2 / Capterra / TrustRadius)

🛠️ Tech Stack

Node.js (v18+) – Node.js Documentation

Puppeteer – Headless browser automation

date-fns – Date parsing/formatting

fs/promises – File system for JSON output

📥 Installation

Clone this repo:

git clone https://github.com/your-repo/review-scraper.git
cd review-scraper


Install dependencies:

npm install puppeteer date-fns

▶️ Usage

Run the script with the following format:

node scrapeReviews.js "Company Name" YYYY-MM-DD YYYY-MM-DD source

Arguments:

Company Name → Name of the product/company (e.g., "Slack")

YYYY-MM-DD → Start date (e.g., 2025-01-01)

YYYY-MM-DD → End date (e.g., 2025-06-30)

source → g2, capterra, or trustradius

📂 Output

Reviews are saved as a JSON file in the project root.

File naming convention:

{CompanyName}_{Source}_reviews.json


Example:

Slack_trustradius_reviews.json

Sample JSON Output
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

Invalid company name → Script exits with message.

Invalid date format → Must be YYYY-MM-DD.

Start date after end date → Throws error.

If "Load More" or lazy-loaded reviews stop appearing → Script gracefully stops and saves available reviews.

🏆 Bonus: Third Source

In addition to G2 and Capterra, this scraper also supports TrustRadius, with the same functionality and output structure.

📊 Evaluation Criteria

✅ Time: Efficient scraping with pagination and lazy-loading handling
✅ Code Quality: Modular, commented, and extensible
✅ Novelty: Integrates a third review source (TrustRadius) for bonus
✅ Output: Clean JSON with reviewer details, date filtering, and metadata

👨‍💻 Author

Developed by Hemanth Lakkoju for Pulse Coding Assignment.

🔗 References

Node.js Official Documentation

Puppeteer Official Documentation

date-fns Documentation

⚡ Quick Start Test

Here are 3 example commands to quickly test scraping from each supported source:

G2 Example

node scrapeReviews.js "Slack" 2023-01-01 2026-01-01 g2


Expected Output:

Scraping g2 reviews for "Slack" between 2023-01-01 and 2026-01-01
Navigating to G2: https://www.g2.com/products/slack/reviews
Attempting to load all reviews...
Saved X reviews to Slack_g2_reviews.json


Capterra Example

node scrapeReviews.js "Slack" 2023-01-01 2026-01-01 capterra


Expected Output:

Scraping capterra reviews for "Slack" between 2023-01-01 and 2026-01-01
Navigating to Capterra: https://www.capterra.com/p/slack/reviews
Scrolling to load all reviews...
Saved Y reviews to Slack_capterra_reviews.json


TrustRadius Example

node scrapeReviews.js "Slack" 2023-01-01 2026-01-01 trustradius


Expected Output:

Scraping trustradius reviews for "Slack" between 2023-01-01 and 2026-01-01
Navigating to TrustRadius: https://www.trustradius.com/products/slack/reviews
Attempting to click "Load More" buttons...
No buttons found, running auto-scroll fallback...
Saved 5 reviews to Slack_trustradius_reviews.json
