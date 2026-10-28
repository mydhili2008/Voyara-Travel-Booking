from flask import Flask, render_template, request, jsonify
from datetime import datetime
import sqlite3
import os
import re

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), "voyara.db")

def init_db():
    with sqlite3.connect(DB_PATH) as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS enquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                destination TEXT,
                travel_date TEXT,
                guests INTEGER DEFAULT 1,
                message TEXT,
                created_at TEXT NOT NULL
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS subscribers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/enquiry", methods=["POST"])
def create_enquiry():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip()
    destination = str(data.get("destination", "")).strip()
    travel_date = str(data.get("date", "")).strip()
    message = str(data.get("message", "")).strip()
    try:
        guests = max(1, min(20, int(data.get("guests", 1))))
    except (TypeError, ValueError):
        guests = 1

    if len(name) < 2:
        return jsonify(ok=False, message="Please enter your full name."), 400
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return jsonify(ok=False, message="Please enter a valid email address."), 400
    if not destination:
        return jsonify(ok=False, message="Please choose a destination."), 400

    with sqlite3.connect(DB_PATH) as con:
        cur = con.execute("""
            INSERT INTO enquiries (name, email, destination, travel_date, guests, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, email, destination, travel_date, guests, message, datetime.utcnow().isoformat(timespec="seconds")))
        enquiry_id = cur.lastrowid

    return jsonify(ok=True, message="Your trip request has been saved. Our team can follow up with you.", reference=f"VY-{enquiry_id:05d}")

@app.route("/api/subscribe", methods=["POST"])
def subscribe():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return jsonify(ok=False, message="Enter a valid email address."), 400
    try:
        with sqlite3.connect(DB_PATH) as con:
            con.execute(
                "INSERT INTO subscribers (email, created_at) VALUES (?, ?)",
                (email, datetime.utcnow().isoformat(timespec="seconds"))
            )
    except sqlite3.IntegrityError:
        return jsonify(ok=True, message="You're already on the list. Welcome back!")
    return jsonify(ok=True, message="You're on the list. Watch your inbox for inspiration.")

@app.route("/health")
def health():
    return jsonify(ok=True, app="Voyara")

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
