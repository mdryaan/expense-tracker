# 💸 Expense Tracker

A clean, modern expense tracking web application to help you monitor and manage your daily spending with ease.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-lightgrey?style=flat-square&logo=flask)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow?style=flat-square&logo=javascript)
![HTML5](https://img.shields.io/badge/HTML5-orange?style=flat-square&logo=html5)
![CSS3](https://img.shields.io/badge/CSS3-blue?style=flat-square&logo=css3)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Features

- Add expenses with title, amount, category, and date
- View all expenses in a sortable table (newest first)
- Delete any expense instantly
- Filter expenses by category
- Live total summary (overall, count, this month)
- Data persists via localStorage and backend JSON file
- Works offline — syncs with backend when available
- Fully responsive mobile-friendly layout

## Screenshots
<img width="1862" height="1011" alt="Screenshot 2026-05-04 045715" src="https://github.com/user-attachments/assets/bd1c57c0-0f86-4876-9aff-0e5b7f1d8a34" />

## Tech Stack

| Layer     | Technology                  |
|-----------|-----------------------------|
| Frontend  | Vanilla JavaScript, HTML5, CSS3 |
| Backend   | Python, Flask, Flask-CORS   |
| Storage   | localStorage + `expenses.json` |

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/mdryaan/expense-tracker.git
cd expense-tracker
```

### 2. Set up the backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The Flask API will start on `http://localhost:5000`.

### 3. Open the frontend

Open `frontend/index.html` directly in your browser — no build step needed.

Or serve it with any static file server:

```bash
cd frontend
npx serve .
```

## Project Structure

```
expense-tracker/
├── backend/
│   ├── app.py            # Flask REST API
│   ├── requirements.txt  # Python dependencies
│   └── expenses.json     # Data storage file
├── frontend/
│   ├── index.html        # App markup
│   ├── style.css         # Styles
│   └── app.js            # Frontend logic
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Endpoint               | Description            |
|--------|------------------------|------------------------|
| GET    | `/expenses`            | Get all expenses       |
| GET    | `/expenses?category=Food` | Filter by category  |
| POST   | `/expenses`            | Add a new expense      |
| DELETE | `/expenses/<id>`       | Delete an expense      |
| GET    | `/expenses/summary`    | Get totals summary     |

### POST /expenses — Request Body

```json
{
  "title": "Coffee",
  "amount": 4.50,
  "category": "Food",
  "date": "2025-04-21"
}
```

### Categories

`Food` · `Transport` · `Housing` · `Entertainment` · `Health` · `Shopping` · `Education` · `Other`

## Offline Support

The frontend works offline — expenses are saved to `localStorage` immediately. When the Flask backend is available, data is synced automatically on page load. Expenses added offline are stored with a local ID and persist across sessions.

## License

MIT © [mdryaan](https://github.com/mdryaan)
