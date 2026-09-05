from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import random
import datetime

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

DATABASE = "engineering_hub.db"

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("CREATE TABLE IF NOT EXISTS settings (user_id INTEGER PRIMARY KEY, fullName TEXT, university TEXT, major TEXT, targetGpa TEXT, semester TEXT, strictMode BOOLEAN)")
    cursor.execute("CREATE TABLE IF NOT EXISTS progress (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, subject TEXT, score INTEGER, total INTEGER)")
    cursor.execute("CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, user_id INTEGER, title TEXT, tag TEXT, count INTEGER, column_id TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, description TEXT, subject TEXT, topic TEXT, date TEXT, pdfUrl TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS resources (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, description TEXT, subject TEXT, topic TEXT, type TEXT, url TEXT, visualizerBg TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS exams (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, subject TEXT, date TEXT, daysLeft INTEGER, credits INTEGER, requiredScore INTEGER, gradeNeeded TEXT, status TEXT, isCompleted BOOLEAN)")
    cursor.execute("CREATE TABLE IF NOT EXISTS study_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, hours REAL)")
    
    # NEW: Calendar & Attendance Tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS calendar_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            date TEXT,
            type TEXT,
            title TEXT,
            time TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            date TEXT PRIMARY KEY,
            user_id INTEGER,
            status TEXT
        )
    """)

    # Seed generic data if empty
    if not cursor.execute("SELECT * FROM tasks LIMIT 1").fetchone():
        tasks_data = [
            ("t1", "Combinatorics and validity", "Working with data", 5, "todo"),
            ("t2", "Hypothesis Testing", "Research", 3, "todo"),
            ("t5", "A/B Testing Experiments", "Working with data", 3, "inProgress"),
            ("t7", "Principal Component Analysis", "Working with data", 5, "approval"),
            ("t10", "Exponential Smoothing", "Research", 4, "completed")
        ]
        cursor.executemany("INSERT INTO tasks (id, title, tag, count, column_id) VALUES (?, ?, ?, ?, ?)", tasks_data)

    conn.commit()
    conn.close()

engineering_subjects = {
    "Data Structures": {"quiz": [{"question": "Time complexity of searching in a balanced BST?", "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"], "answer": "O(log n)"}]}
}

@app.route("/api/dashboard", methods=["GET"])
def api_dashboard():
    conn = get_db()
    today = datetime.date.today()
    start_of_week = today - datetime.timedelta(days=today.weekday())
    
    # 1. Weekly Study Hours
    sessions = conn.execute("SELECT date, SUM(hours) as total_hours FROM study_sessions WHERE user_id = 1 AND date >= ? GROUP BY date", (start_of_week.isoformat(),)).fetchall()
    
    weekly_data = [0] * 7
    total_week_hours = 0
    for row in sessions:
        d = datetime.date.fromisoformat(row["date"])
        weekly_data[d.weekday()] += row["total_hours"]
        total_week_hours += row["total_hours"]

    # 2. Progress
    progress = conn.execute("SELECT * FROM progress ORDER BY id DESC").fetchall()
    
    # 3. Dynamic Schedule (Classes AND Events)
    today_str = today.isoformat()
    todays_schedule = conn.execute(
        "SELECT * FROM calendar_events WHERE user_id = 1 AND date = ? AND type IN ('Class', 'Event') ORDER BY time ASC", 
        (today_str,)
    ).fetchall()
    
    # Auto-assign colors to make the timeline look good
    colors = ["bg-purple-500", "bg-blue-500", "bg-green-500", "bg-orange-500"]
    schedule_data = []
    for i, row in enumerate(todays_schedule):
        schedule_data.append({
            "time": row["time"] if row["time"] else "All Day",
            "title": row["title"],
            "room": row["type"], # Displays "Class" or "Event" dynamically
            "color": colors[i % len(colors)]
        })

    conn.close()
    
    return jsonify({
        "name": "Student",
        "subjects": list(engineering_subjects.keys()),
        "progress": [dict(row) for row in progress],
        "weekly_data": weekly_data,
        "total_week_hours": total_week_hours,
        "schedule": schedule_data
    })

@app.route("/api/study-time", methods=["POST"])
def add_study_time():
    data = request.get_json()
    conn = get_db()
    conn.execute("INSERT INTO study_sessions (user_id, date, hours) VALUES (1, ?, ?)", (datetime.date.today().isoformat(), float(data.get("hours", 0))))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/tasks", methods=["GET", "POST"])
def api_tasks():
    conn = get_db()
    if request.method == "POST":
        data = request.get_json()
        conn.execute("UPDATE tasks SET column_id = ? WHERE id = ?", (data['column_id'], data['id']))
        conn.commit()
        return jsonify({"success": True})
        
    tasks = conn.execute("SELECT * FROM tasks").fetchall()
    conn.close()
    board = {"todo": {"id": "todo", "title": "To Do", "tasks": []}, "inProgress": {"id": "inProgress", "title": "In Progress", "tasks": []}, "approval": {"id": "approval", "title": "Approval", "tasks": []}, "completed": {"id": "completed", "title": "Completed", "tasks": []}}
    for t in tasks:
        task_dict = dict(t)
        col = task_dict.pop("column_id")
        if col in board: board[col]["tasks"].append(task_dict)
    return jsonify(board)

@app.route("/api/notes", methods=["GET", "POST"])
def api_notes():
    conn = get_db()
    if request.method == "POST":
        data = request.get_json()
        conn.execute("INSERT INTO notes (title, description, subject, topic, date, pdfUrl) VALUES (?, ?, ?, ?, ?, ?)", (data['title'], data['description'], data['subject'], data['topic'], "Today", "dummy.pdf"))
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
        conn.execute("INSERT INTO resources (title, description, subject, topic, type, url, visualizerBg) VALUES (?, ?, ?, ?, ?, ?, ?)", (data['title'], data['description'], data['subject'], data['topic'], data['type'], data['url'], "from-cyan-500 to-blue-600"))
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
        "upcomingExams": [dict(row) for row in upcoming], "completedExams": [dict(row) for row in completed]
    })

@app.route("/api/settings", methods=["GET", "POST"])
def api_settings():
    conn = get_db()
    if request.method == "POST":
        data = request.get_json()
        conn.execute("INSERT OR REPLACE INTO settings (user_id, fullName, university, major, targetGpa, semester, strictMode) VALUES (1, ?, ?, ?, ?, ?, ?)", (data.get("fullName"), data.get("university"), data.get("major"), data.get("targetGpa"), data.get("semester"), data.get("strictMode")))
        conn.commit()
        return jsonify({"success": True})
    row = conn.execute("SELECT * FROM settings WHERE user_id = 1").fetchone()
    conn.close()
    if row:
        settings_dict = dict(row)
        settings_dict["strictMode"] = bool(settings_dict["strictMode"])
        return jsonify({"success": True, "settings": settings_dict})
    return jsonify({"success": True, "settings": {}})

# NEW: Calendar Data Endpoint
@app.route("/api/calendar", methods=["GET"])
def api_calendar():
    conn = get_db()
    events = conn.execute("SELECT * FROM calendar_events WHERE user_id = 1").fetchall()
    attendance = conn.execute("SELECT * FROM attendance WHERE user_id = 1").fetchall()
    
    att_list = [dict(row) for row in attendance]
    total_held = len(att_list)
    total_attended = sum(1 for a in att_list if a['status'] == 'attended')
    
    conn.close()
    return jsonify({
        "events": [dict(row) for row in events],
        "attendance_records": att_list,
        "attendance_stats": {
            "totalHeld": total_held,
            "totalAttended": total_attended
        }
    })

# NEW: Add Event/Class/Holiday
@app.route("/api/calendar/event", methods=["POST"])
def add_calendar_event():
    data = request.get_json()
    conn = get_db()
    conn.execute("INSERT INTO calendar_events (user_id, date, type, title, time) VALUES (1, ?, ?, ?, ?)", 
                (data['date'], data['type'], data['title'], data.get('time', '')))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# NEW: Mark Attendance
@app.route("/api/calendar/attendance", methods=["POST"])
def mark_attendance():
    data = request.get_json()
    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO attendance (date, user_id, status) VALUES (?, 1, ?)", 
                (data['date'], data['status']))
    conn.commit()
    conn.close()
    return jsonify({"success": True})
@app.route("/api/clear-data", methods=["POST"])
def clear_data():
    conn = get_db()
    # List of all tables containing user data
    tables = [
        "settings", "progress", "tasks", "notes", "resources", 
        "exams", "study_sessions", "calendar_events", "attendance"
    ]
    
    for table in tables:
        conn.execute(f"DELETE FROM {table}")
        
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "All user data cleared."})

if __name__ == "__main__":
    create_tables()
    app.run(debug=True, host="127.0.0.1", port=5000)