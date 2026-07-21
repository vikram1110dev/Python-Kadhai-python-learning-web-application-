# Python Kadhai (Python Stories) 🐍

**Python Kadhai** is an interactive, gamified web application designed to help beginners learn Python programming fundamentals using a friendly mix of **Tanglish (Tamil + English)**, **English**, and iconic **Tamil movie memes**! 

The application is built with a **Django (MVT Architecture)** backend with Django ORM models managing the curriculum database and powering Chitti, a conversational helper chatbot.

---

## 🌟 Key Features

1. **Django MVT Architecture**:
   - Clean separation of concerns with Django Models (`kadhai/models.py`), Views (`kadhai/views.py`), and Templates (`templates/`).
2. **Bilingual Explanations**: 
   - Side-by-side columns presenting programming concepts in conversational Tanglish and plain English.
3. **Interactive Meme Checkpoints**: 
   - Quizzes to test your understanding. Correct answers unlock funny Tamil movie dialogues, while incorrect ones show humorous warnings.
4. **Chitti 2.0 Chatbot (Meme Helper)**:
   - A floating AI helper named **Chitti** on the bottom right powered by database-driven keyword matching.
5. **Django Admin Management**:
   - Access `/admin` to edit lessons, quizzes, and chatbot meme responses through Django's graphical dashboard.

---

## 🗄️ Database Choices (DB Setup)

* **SQLite (Default & Enabled out-of-the-box)**: Ideal for fast, zero-configuration local development.
* **Microsoft SQL Server (MSSQL)**: Supported using `mssql-django` and `pyodbc`. Configuration instructions are provided directly inside `python_kadhai/settings.py`.

---

## 📁 Project Directory Structure

```text
python kadhai/
├── manage.py                          # Django CLI command runner
├── requirements.txt                   # Updated dependencies (Django)
├── db.sqlite3                         # SQLite Database (auto-generated & seeded)
├── python_kadhai/                     # Core Project Configuration
│   ├── settings.py                    # App settings, DB config, Static/Template paths
│   ├── urls.py                        # Root URL router
│   ├── wsgi.py                        # WSGI entrypoint
│   └── asgi.py                        # ASGI entrypoint
├── kadhai/                            # Django Application Domain
│   ├── admin.py                       # Django Admin Panel Registrations
│   ├── models.py                      # Django ORM Models (Lesson, Quiz, ChatbotResponse)
│   ├── views.py                       # View Functions (Index template, API endpoints)
│   ├── urls.py                        # App URL routes
│   └── management/commands/seed_data.py # Auto-seeds database with lessons & Chitti responses
├── templates/
│   └── index.html                     # Main Frontend HTML layout
└── static/
    ├── index.css                      # Application CSS styles
    └── app.js                         # Frontend interactive router & API handler
```

---

## 🚀 Setup & Execution Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Apply Migrations & Seed Database
```bash
python manage.py makemigrations kadhai
python manage.py migrate
python manage.py seed_data
```

### 3. Launch Development Server
```bash
python manage.py runserver
```

### 4. Open in Browser
Open your browser and navigate to:
* App Dashboard: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**
* Django Admin Panel: **[http://127.0.0.1:8000/admin](http://127.0.0.1:8000/admin)**

---

© vikram B
