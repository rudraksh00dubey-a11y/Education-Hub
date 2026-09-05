from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import random
import datetime
import uuid

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
    cursor.execute("CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, user_id INTEGER, title TEXT, tag TEXT, count INTEGER, column_id TEXT, created_at TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, description TEXT, subject TEXT, topic TEXT, date TEXT, pdfUrl TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS resources (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, description TEXT, subject TEXT, topic TEXT, type TEXT, url TEXT, visualizerBg TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS study_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, hours REAL)")
    cursor.execute("CREATE TABLE IF NOT EXISTS calendar_events (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, type TEXT, title TEXT, time TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS attendance (date TEXT PRIMARY KEY, user_id INTEGER, status TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS task_performance (id INTEGER PRIMARY KEY AUTOINCREMENT, week_start TEXT, completed_count INTEGER)")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS exams (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            user_id INTEGER, 
            subject TEXT, 
            date TEXT, 
            credits INTEGER, 
            requiredScore INTEGER, 
            achievedScore INTEGER,
            isCompleted BOOLEAN
        )
    """)
    
    try:
        cursor.execute("ALTER TABLE exams ADD COLUMN achievedScore INTEGER")
    except sqlite3.OperationalError:
        pass 

    conn.commit()
    conn.close()

engineering_subjects = {"Data Structures": {"quiz": [{"question": "Time complexity of searching in a balanced BST?", "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"], "answer": "O(log n)"}]}}

@app.route("/api/dashboard", methods=["GET"])
def api_dashboard():
    conn = get_db()
    today = datetime.date.today()
    start_of_week = today - datetime.timedelta(days=today.weekday())
    
    sessions = conn.execute("SELECT date, SUM(hours) as total_hours FROM study_sessions WHERE user_id = 1 AND date >= ? GROUP BY date", (start_of_week.isoformat(),)).fetchall()
    weekly_data = [0] * 7
    total_week_hours = 0
    
    for row in sessions:
        d = datetime.date.fromisoformat(row["date"])
        weekly_data[d.weekday()] += row["total_hours"]
        total_week_hours += row["total_hours"]

    progress = conn.execute("SELECT * FROM progress ORDER BY id DESC").fetchall()
    todays_schedule = conn.execute("SELECT * FROM calendar_events WHERE user_id = 1 AND date = ? AND type IN ('Class', 'Event') ORDER BY time ASC", (today.isoformat(),)).fetchall()
    
    colors = ["bg-purple-500", "bg-blue-500", "bg-green-500", "bg-orange-500"]
    schedule_data = [{"time": r["time"] or "All Day", "title": r["title"], "room": r["type"], "color": colors[i % len(colors)]} for i, r in enumerate(todays_schedule)]
    
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
    conn = get_db()
    conn.execute("INSERT INTO study_sessions (user_id, date, hours) VALUES (1, ?, ?)", (datetime.date.today().isoformat(), float(request.get_json().get("hours", 0))))
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
    
    today = datetime.date.today()
    start_of_week = today - datetime.timedelta(days=today.weekday())
    old_tasks = conn.execute("SELECT * FROM tasks WHERE created_at < ?", (start_of_week.isoformat(),)).fetchall()
    
    if old_tasks:
        completed = sum(1 for t in old_tasks if t['column_id'] == 'completed')
        conn.execute("INSERT INTO task_performance (week_start, completed_count) VALUES (?, ?)", ((start_of_week - datetime.timedelta(days=7)).isoformat(), completed))
        conn.execute("DELETE FROM tasks WHERE created_at < ?", (start_of_week.isoformat(),))
        conn.commit()
        
    tasks = conn.execute("SELECT * FROM tasks").fetchall()
    perf = conn.execute("SELECT * FROM task_performance ORDER BY week_start DESC LIMIT 1").fetchone()
    conn.close()
    
    board = {"todo": {"id": "todo", "title": "To Do", "tasks": []}, "inProgress": {"id": "inProgress", "title": "In Progress", "tasks": []}, "approval": {"id": "approval", "title": "Approval", "tasks": []}, "completed": {"id": "completed", "title": "Completed", "tasks": []}}
    
    for t in tasks:
        task_dict = dict(t)
        col = task_dict.pop("column_id")
        if col in board: board[col]["tasks"].append(task_dict)
        
    return jsonify({"board": board, "performance": dict(perf) if perf else None})

@app.route("/api/tasks/crud", methods=["POST", "PUT", "DELETE"])
def api_tasks_crud():
    conn = get_db()
    data = request.get_json()
    
    if request.method == "POST":
        new_id = str(uuid.uuid4())
        conn.execute("INSERT INTO tasks (id, user_id, title, tag, count, column_id, created_at) VALUES (?, 1, ?, ?, ?, 'todo', ?)", (new_id, data['title'], data['tag'], int(data['count']), datetime.date.today().isoformat()))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "id": new_id})
    elif request.method == "PUT":
        conn.execute("UPDATE tasks SET title=?, tag=?, count=? WHERE id=?", (data['title'], data['tag'], int(data['count']), data['id']))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    elif request.method == "DELETE":
        conn.execute("DELETE FROM tasks WHERE id=?", (data['id'],))
        conn.commit()
        conn.close()
        return jsonify({"success": True})

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
    today_str = datetime.date.today().isoformat()
    
    # Auto-archive past deadlines
    conn.execute("UPDATE exams SET isCompleted = 1 WHERE date < ? AND isCompleted = 0", (today_str,))
    conn.commit()

    upcoming = conn.execute("SELECT * FROM exams WHERE isCompleted = 0 ORDER BY date ASC").fetchall()
    completed = conn.execute("SELECT * FROM exams WHERE isCompleted = 1 ORDER BY date DESC").fetchall()
    settings = conn.execute("SELECT targetGpa FROM settings WHERE user_id = 1").fetchone()
    conn.close()
    
    target_gpa = float(settings['targetGpa']) if settings and settings['targetGpa'] else 3.8

    # Server-Side GPA Math Engine
    completed_credits = 0
    earned_grade_points = 0
    
    for ex in completed:
        if ex['achievedScore']:
            completed_credits += ex['credits']
            gpa_equiv = (ex['achievedScore'] / 100.0) * 4.0
            earned_grade_points += (gpa_equiv * ex['credits'])
            
    current_gpa = (earned_grade_points / completed_credits) if completed_credits > 0 else 0.0
    
    upcoming_credits = sum(ex['credits'] for ex in upcoming)
    total_credits = completed_credits + upcoming_credits
    
    required_avg_score = 0
    margin_of_error = 0
    
    if upcoming_credits > 0:
        total_required_points = target_gpa * total_credits
        remaining_points_needed = total_required_points - earned_grade_points
        required_gpa_for_remaining = remaining_points_needed / upcoming_credits
        required_avg_score = (required_gpa_for_remaining / 4.0) * 100.0
        
        required_avg_score = min(100.0, max(0.0, required_avg_score))
        margin_of_error = max(0.0, (100.0 - required_avg_score) / 2.0)

    return jsonify({
        "gpaData": {
            "currentGPA": current_gpa,
            "targetGPA": target_gpa,
            "requiredAvgScore": required_avg_score,
            "marginOfError": margin_of_error
        },
        "upcomingExams": [dict(row) for row in upcoming],
        "completedExams": [dict(row) for row in completed]
    })

@app.route("/api/exams/crud", methods=["POST", "PUT", "DELETE"])
def api_exams_crud():
    conn = get_db()
    data = request.get_json()
    
    if request.method == "POST":
        conn.execute("INSERT INTO exams (user_id, subject, date, credits, isCompleted) VALUES (1, ?, ?, ?, 0)", 
                    (data['subject'], data['date'], int(data['credits'])))
    elif request.method == "PUT":
        if 'achievedScore' in data:
            conn.execute("UPDATE exams SET achievedScore = ? WHERE id = ?", (int(data['achievedScore']), data['id']))
        else:
            conn.execute("UPDATE exams SET subject=?, date=?, credits=? WHERE id=?", 
                        (data['subject'], data['date'], int(data['credits']), data['id']))
    elif request.method == "DELETE":
        conn.execute("DELETE FROM exams WHERE id=?", (data['id'],))
        
    conn.commit()
    conn.close()
    return jsonify({"success": True})

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

@app.route("/api/calendar", methods=["GET"])
def api_calendar():
    conn = get_db()
    events = conn.execute("SELECT * FROM calendar_events WHERE user_id = 1").fetchall()
    attendance = conn.execute("SELECT * FROM attendance WHERE user_id = 1").fetchall()
    att_list = [dict(row) for row in attendance]
    conn.close()
    return jsonify({
        "events": [dict(row) for row in events],
        "attendance_records": att_list,
        "attendance_stats": {"totalHeld": len(att_list), "totalAttended": sum(1 for a in att_list if a['status'] == 'attended')}
    })

@app.route("/api/calendar/event", methods=["POST"])
def add_calendar_event():
    data = request.get_json()
    conn = get_db()
    conn.execute("INSERT INTO calendar_events (user_id, date, type, title, time) VALUES (1, ?, ?, ?, ?)", (data['date'], data['type'], data['title'], data.get('time', '')))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/calendar/attendance", methods=["POST"])
def mark_attendance():
    data = request.get_json()
    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO attendance (date, user_id, status) VALUES (?, 1, ?)", (data['date'], data['status']))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/clear-data", methods=["POST"])
def clear_data():
    conn = get_db()
    tables = ["settings", "progress", "tasks", "notes", "resources", "exams", "study_sessions", "calendar_events", "attendance", "task_performance"]
    for table in tables:
        conn.execute(f"DELETE FROM {table}")
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "All user data cleared."})

if __name__ == "__main__":
    create_tables()
    app.run(debug=True, host="127.0.0.1", port=5000)