# Voyara Travel Booking — Ultimate Edition

A polished travel discovery and enquiry website built with **HTML, CSS, JavaScript, Python (Flask), and SQLite**.

## Features

### Motion and visual design
- Large cinematic hero with parallax background movement
- Scroll-triggered reveal animations with staggered timing
- Scroll progress indicator and sticky header transition
- Smooth hover zoom on destination and journal imagery
- Animated orbit accents, floating scroll cue, and CTA hover movement
- Responsive layouts for desktop, tablet, and mobile
- Reduced-motion accessibility support

### Interactive travel experience
- Destination search and travel-date selection
- Filters for coast, culture, nature, and slow travel
- Sort destinations by price or rating
- Save destinations to a browser-local shortlist
- Slide-in saved-places drawer
- Trip enquiry form with client and server validation
- Newsletter signup with duplicate-email handling
- Toast feedback, FAQ-free clean layout, keyboard-close drawer, and back-to-top button

### Python backend
- Flask routes for the page and JSON endpoints
- SQLite database created automatically
- `/api/enquiry` stores trip enquiry submissions
- `/api/subscribe` stores unique newsletter emails
- `/health` health-check endpoint

> This is a functional starter project, not a full OTA booking engine. It does not connect to live flight/hotel inventory, process payments, send emails, or authenticate users. Add those integrations before using it as a production travel business.

## Run locally

1. Install Python 3.10+.
2. Open a terminal in this project folder.
3. Create and activate a virtual environment (recommended):

   **Windows**
   ```bash
   py -m venv .venv
   .venv\Scripts\activate
   ```

   **macOS / Linux**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Start the app:
   ```bash
   python app.py
   ```

6. Open `http://127.0.0.1:5000` in your browser.

The `voyara.db` database file is created automatically when the server starts.

## Project structure

```text
Voyara-Travel-Booking-Ultimate/
├── app.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── images/
│       └── README.md
└── voyara.db                 # created at runtime
```

## Notes

- Destination photos and Google Fonts are loaded from external services; an internet connection is needed for those assets.
- Demo prices are illustrative and not live quotes.
- Do not use Flask's debug server or `debug=True` for public production deployment.
- For production, configure environment variables, CSRF protection, rate limiting, secure deployment, privacy/consent text, and server-side error logging.
