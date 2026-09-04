from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import random

app = Flask(__name__)
# Solves the CORS credentials mismatch permanently
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

DATABASE = "engineering_hub.db"

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Settings & Progress (Dashboard / Progress Pages)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            user_id INTEGER PRIMARY KEY, fullName TEXT, university TEXT, 
            major TEXT, targetGpa TEXT, semester TEXT, strictMode BOOLEAN
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, 
            subject TEXT, score INTEGER, total INTEGER
        )
    """)
    
    # 2. Tasks (Kanban Board)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY, user_id INTEGER, title TEXT, 
            tag TEXT, count INTEGER, column_id TEXT
        )
    """)
    
    # 3. Notes (Study Vault)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, 
            title TEXT, description TEXT, subject TEXT, topic TEXT, 
            date TEXT, pdfUrl TEXT
        )
    """)
    
    # 4. Resources (Resource Hub)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, 
            title TEXT, description TEXT, subject TEXT, topic TEXT, 
            type TEXT, url TEXT, visualizerBg TEXT
        )
    """)
    
    # 5. Exams (Exams & Targets)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS exams (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, 
            subject TEXT, date TEXT, daysLeft INTEGER, credits INTEGER, 
            requiredScore INTEGER, gradeNeeded TEXT, status TEXT, isCompleted BOOLEAN
        )
    """)

    # --- AUTO-SEED INITIAL DATA IF EMPTY ---
    # Tasks Seed
    if not cursor.execute("SELECT * FROM tasks LIMIT 1").fetchone():
        tasks_data = [
            ("t1", "Combinatorics and validity", "Working with data", 5, "todo"),
            ("t2", "Hypothesis Testing", "Research", 3, "todo"),
            ("t5", "A/B Testing Experiments", "Working with data", 3, "inProgress"),
            ("t7", "Principal Component Analysis", "Working with data", 5, "approval"),
            ("t10", "Exponential Smoothing", "Research", 4, "completed")
        ]
        cursor.executemany("INSERT INTO tasks (id, title, tag, count, column_id) VALUES (?, ?, ?, ?, ?)", tasks_data)

    # Notes Seed
    if not cursor.execute("SELECT * FROM notes LIMIT 1").fetchone():
        notes_data = [
            ("Graph Theory Algorithms", "Detailed walkthrough of Dijkstra's, A*, and Bellman-Ford.", "Data Structures", "Algorithms", "Dec 10, 2024", "dummy.pdf"),
            ("Thermodynamics Laws", "Summary of the 4 laws of thermodynamics.", "Physics", "Thermal Dynamics", "Dec 12, 2024", "dummy.pdf")
        ]
        cursor.executemany("INSERT INTO notes (title, description, subject, topic, date, pdfUrl) VALUES (?, ?, ?, ?, ?, ?)", notes_data)

    # Resources Seed
    if not cursor.execute("SELECT * FROM resources LIMIT 1").fetchone():
        resources_data = [
            ("Algorithm Visualizer", "Interactive tool for sorting and graphs.", "Data Structures", "Algorithms", "Interactive", "https://algorithm-visualizer.org/", "from-fuchsia-600 to-purple-600"),
            ("CS50: Memory & Pointers", "Harvard's deep dive into memory.", "Computer Science", "Memory", "Video", "https://youtube.com", "from-red-500 to-orange-500")
        ]
        cursor.executemany("INSERT INTO resources (title, description, subject, topic, type, url, visualizerBg) VALUES (?, ?, ?, ?, ?, ?, ?)", resources_data)

    # Exams Seed
    if not cursor.execute("SELECT * FROM exams LIMIT 1").fetchone():
        exams_data = [
            ("Data Structures & Algorithms", "Dec 15", 5, 4, 92, "A", "urgent", False),
            ("Machine Learning", "Dec 18", 8, 3, 85, "B+", "warning", False),
            ("Calculus III", "Nov 20", 0, 4, 94, "A", "normal", True)
        ]
        cursor.executemany("INSERT INTO exams (subject, date, daysLeft, credits, requiredScore, gradeNeeded, status, isCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", exams_data)

    conn.commit()
    conn.close()

# Engineering Quizzes 
engineering_subjects = {
    "Data Structures": {
        "quiz": [
            {"question": "Time complexity of searching in a balanced BST?", "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"], "answer": "O(log n)"},
            {"question": "Which data structure uses LIFO?", "options": ["Queue", "Stack", "Tree", "Graph"], "answer": "Stack"}
        ]
    },
    "Operating Systems": {
        "quiz": [
            {"question": "Which scheduling algorithm gives CPU to shortest burst?", "options": ["FCFS", "SJF", "Round Robin", "Priority"], "answer": "SJF"},
            {"question": "Handles virtual to physical address translation?", "options": ["CPU", "MMU", "ALU", "Cache"], "answer": "MMU"}
        ]
    }
}

# ==============================================================================
# UNIFIED API ENDPOINTS
# ==============================================================================

@app.route("/api/dashboard", methods=["GET"])
def api_dashboard():
    conn = get_db()
    progress = conn.execute("SELECT * FROM progress ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify({
        "name": "Alex Student",
        "subjects": list(engineering_subjects.keys()),
        "progress": [dict(row) for row in progress]
    })

@app.route("/api/tasks", methods=["GET", "POST"])
def api_tasks():
    conn = get_db()
    if request.method == "POST":
        data = request.get_json() # Updates task columns via drag-and-drop
        conn.execute("UPDATE tasks SET column_id = ? WHERE id = ?", (data['column_id'], data['id']))
        conn.commit()
        return jsonify({"success": True})
        
    tasks = conn.execute("SELECT * FROM tasks").fetchall()
    conn.close()
    
    # Format exactly how Tasks.jsx expects it
    board = {
        "todo": {"id": "todo", "title": "To Do", "tasks": []},
        "inProgress": {"id": "inProgress", "title": "In Progress", "tasks": []},
        "approval": {"id": "approval", "title": "Approval", "tasks": []},
        "completed": {"id": "completed", "title": "Completed", "tasks": []}
    }
    for t in tasks:
        task_dict = dict(t)
        col = task_dict.pop("column_id")
        if col in board:
            board[col]["tasks"].append(task_dict)
            
    return jsonify(board)

@app.route("/api/notes", methods=["GET", "POST"])
def api_notes():
    conn = get_db()
    if request.method == "POST":
        data = request.get_json()
        conn.execute("INSERT INTO notes (title, description, subject, topic, date, pdfUrl) VALUES (?, ?, ?, ?, ?, ?)", 
                    (data['title'], data['description'], data['subject'], data['topic'], "Today", "dummy.pdf"))
        conn.commit()
        return jsonify({"success": True})
        
    notes = conn.execute("SELECT * FROM notes ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(row) for row in notes])

@app.route("/api/resources", methods=["GET", "POST"])
def api_resources():
    conn = get_db()
    if request.method == "POST":
        data = request.get_json()
        bg = random.choice(["from-fuchsia-600 to-purple-600", "from-cyan-500 to-blue-600", "from-red-500 to-orange-500"])
        conn.execute("INSERT INTO resources (title, description, subject, topic, type, url, visualizerBg) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                    (data['title'], data['description'], data['subject'], data['topic'], data['type'], data['url'], bg))
        conn.commit()
        return jsonify({"success": True})
        
    resources = conn.execute("SELECT * FROM resources ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(row) for row in resources])

@app.route("/api/exams", methods=["GET"])
def api_exams():
    conn = get_db()
    upcoming = conn.execute("SELECT * FROM exams WHERE isCompleted = 0").fetchall()
    completed = conn.execute("SELECT * FROM exams WHERE isCompleted = 1").fetchall()
    conn.close()
    
    return jsonify({
        "gpaData": {"currentGPA": 3.42, "targetGPA": 3.8, "creditsCompleted": 45, "creditsThisSemester": 15},
        "upcomingExams": [dict(row) for row in upcoming],
        "completedExams": [dict(row) for row in completed]
    })

@app.route("/api/settings", methods=["GET", "POST"])
def api_settings():
    conn = get_db()
    if request.method == "POST":
        data = request.get_json()
        conn.execute("""
            INSERT OR REPLACE INTO settings (user_id, fullName, university, major, targetGpa, semester, strictMode)
            VALUES (1, ?, ?, ?, ?, ?, ?)
        """, (data.get("fullName"), data.get("university"), data.get("major"), data.get("targetGpa"), data.get("semester"), data.get("strictMode")))
        conn.commit()
        return jsonify({"success": True})
        
    row = conn.execute("SELECT * FROM settings WHERE user_id = 1").fetchone()
    conn.close()
    
    if row:
        settings_dict = dict(row)
        settings_dict["strictMode"] = bool(settings_dict["strictMode"])
        return jsonify({"success": True, "settings": settings_dict})
    return jsonify({"success": True, "settings": {}})

@app.route("/api/quiz/<subject>", methods=["GET"])
def api_quiz(subject):
    if subject not in engineering_subjects: return jsonify({"error": "Not found"}), 404
    questions = engineering_subjects[subject]["quiz"].copy()
    random.shuffle(questions)
    return jsonify({"subject": subject, "questions": [{"question": q["question"], "options": q["options"]} for q in questions]})

@app.route("/api/result/<subject>", methods=["POST"])
def api_result(subject):
    data = request.get_json() 
    questions = engineering_subjects[subject]["quiz"]
    score = sum(1 for i, q in enumerate(questions) if data.get(f"q{i}") == q["answer"])
    
    conn = get_db()
    conn.execute("INSERT INTO progress(user_id, subject, score, total) VALUES (1, ?, ?, ?)", (subject, score, len(questions)))
    conn.commit()
    conn.close()
    return jsonify({"score": score, "total": len(questions), "success": True})
@app.route("/api/calendar", methods=["GET"])
def api_calendar():
    return jsonify({
        "attendance": {
            "totalHeld": 45,
            "totalAttended": 31
        },
        "upcomingClasses": [
            {"date": "Dec 25th", "title": "Calculus III", "time": "09:00 - 10:30 AM", "status": "Mandatory"},
            {"date": "Dec 26th", "title": "Data Structures", "time": "11:00 - 12:30 PM", "status": "Mandatory"},
            {"date": "Dec 27th", "title": "Database Lab", "time": "02:00 - 04:00 PM", "status": "Optional"}
        ]
    })

if __name__ == "__main__":
    create_tables()
    app.run(debug=True, host="127.0.0.1", port=5000)