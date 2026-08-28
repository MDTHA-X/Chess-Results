# ♔ Chess Results

> **Modern, Lightweight Swiss Chess Tournament Management System**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-chessresults.juchc.i--inaya.com-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chessresults.juchc.i-inaya.com)
[![PHP](https://img.shields.io/badge/PHP-8.0%2B-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net/)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20MySQL-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 🌐 Live Website & Links

- **Live Tournament Platform:** [chessresults.juchc.i-inaya.com](https://chessresults.juchc.i-inaya.com)

---

## 📖 About Chess Results

**Chess Results** is a complete, high-performance web platform designed for chess arbiters, clubs, and tournament organizers. It streamlines the entire lifecycle of a chess tournament—from player registrations and seedings to Swiss pairing generations, result entries, and official multi-tiebreak standings.

Unlike heavy modern JavaScript frameworks that require complex server setups and large build dependencies, **Chess Results** is built with a pure **PHP + Vanilla JS/CSS** single-page application (SPA) architecture. It runs effortlessly on budget shared hosting (cPanel), standard LAMP servers, or locally via a lightweight SQLite file.

---

## ✨ Key Features

### 🏆 Advanced Swiss Pairing Engine
- Automated Dutch Swiss system pairing algorithm adhering to official FIDE pairing principles.
- Handles player color history balancing (White/Black counts), bye allocations, and repeat-pairing prevention.
- Seamlessly pairs odd numbers of players with automatic bye point awards.

### 📊 Official FIDE Standings & Tiebreak Scoring
- Real-time standing updates computed dynamically on every game result.
- Comprehensive tiebreak metrics including:
  - **Points (PTS)**
  - **Buchholz (BH)**
  - **Median Buchholz (BH-1)**
  - **Sonneborn-Berger (SB)**
  - **Koya System**
  - **Tournament Performance Rating (TPR)**
- Initial tiebreaking prioritizing newly registered players before round 1 begins.

### 🗂️ Divided Round Navigation
- Intuitive, dedicated navigation for every round of the tournament:
  - **`Pairing :`** `[Rd 1]` `[Rd 2]` `[Rd 3]` — View match tables, board assignments, and enter game scores.
  - **`Results :`** `[Rd 1]` `[Rd 2]` `[Rd 3]` — View exact historical tournament standings as they stood after each specific completed round.

### ⏪ Arbiters Control (Undo & Reopen)
- **Undo Pairings:** Delete accidental draft round pairings with a single click.
- **Reopen Completed Rounds:** Correct a misreported score from a previous round without corrupting or losing subsequent tournament data.
- **Roster Lock:** Automatically locks player additions once rounds have commenced.

### 👤 Interactive Player Profiles & Cards
- Click any player name to view detailed statistics:
  - Starting rank & current standing
  - Rating & performance rating ($R_p$)
  - Board-by-board match histories with opponent details and outcomes.

### 🎨 Modern Dark-Mode UI
- Built with a custom glassmorphism dark theme, smooth micro-interactions, responsive mobile layout, and zero third-party UI framework dependencies.

---

## 🛠️ Technology Stack

- **Backend:** Pure PHP (8.0+) RESTful JSON API
- **Frontend:** Vanilla JavaScript (ES6+ Single Page Application), Vanilla CSS3 (Custom Design System)
- **Database:** SQLite (default for local & zero-config) / MySQL (cPanel / production ready)
- **Typography:** Inter (Google Fonts)

---

## 🚀 Getting Started

### 1. Local Quick Start (SQLite)

Clone the repository and start the built-in PHP server:

```bash
# Navigate to directory
cd ChessResults_Ceila-main

# Start server with SQLite extension enabled
php -S localhost:8000 -d extension=pdo_sqlite
```

Visit **`http://localhost:8000`** in your browser.

---

### 2. Production / cPanel Deployment (MySQL)

1. Upload the project files to your server's `public_html` directory.
2. In cPanel, create a new MySQL database and user.
3. Import `schema.sql` via **phpMyAdmin**.
4. Configure your database connection in `includes/db.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'your_database_name');
   define('DB_USER', 'your_database_user');
   define('DB_PASS', 'your_database_password');
   ```

---

## 🔑 Default Admin Account

An administrator account is pre-configured in the database:

- **Username:** `admin`
- **Password:** `admin`

> *Note: Please update the administrator credentials after initial setup.*

---

## 📁 Project Structure

```text
├── api/
│   ├── auth.php         # Authentication & login sessions
│   ├── pairings.php     # Board results updating
│   ├── players.php      # Player CRUD & registration
│   ├── rounds.php       # Swiss round generation, completion & standings API
│   └── tournaments.php  # Tournament creation & management
├── assets/
│   ├── app.js           # Single Page Application core logic & router
│   └── style.css        # Modern dark-mode styling system
├── includes/
│   ├── auth.php         # Session validation & security
│   ├── db.php           # Database connection handler (PDO)
│   ├── pairing.php      # FIDE Swiss pairing engine
│   └── scoring.php      # Standings & tiebreak algorithms (Buchholz, SB, TPR)
├── index.php            # SPA root entry point
├── schema.sql           # MySQL database schema
├── schema_sqlite.sql    # SQLite database schema
└── README.md            # Documentation
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
