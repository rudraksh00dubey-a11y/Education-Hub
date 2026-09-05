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

def get_sem(conn):
    row = conn.execute("SELECT semester FROM settings WHERE user_id = 1").fetchone()
    if row and row['semester']: return row['semester']
    now = datetime.datetime.now()
    return f"Even Semester (Jan-May) {now.year}" if 1 <= now.month <= 5 else f"Odd Semester (July-Dec) {now.year}"

# Hardened helper to guarantee Gamification row always exists
def get_gamification(conn):
    row = conn.execute("SELECT * FROM gamification WHERE user_id = 1").fetchone()
    if not row:
        conn.execute("INSERT INTO gamification (user_id, xp, level, streak, last_login, daily_goal) VALUES (1, 0, 1, 0, '', 2.0)")
        conn.commit()
        row = conn.execute("SELECT * FROM gamification WHERE user_id = 1").fetchone()
    return dict(row)

def create_tables():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS settings (user_id INTEGER PRIMARY KEY, fullName TEXT, email TEXT, university TEXT, major TEXT, targetGpa TEXT, semester TEXT, strictMode BOOLEAN, avatar TEXT, notif_deadlines BOOLEAN DEFAULT 1, notif_attendance BOOLEAN DEFAULT 1, notif_summary BOOLEAN DEFAULT 1)")
    cursor.execute("CREATE TABLE IF NOT EXISTS progress (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, subject TEXT, score INTEGER, total INTEGER, date TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, user_id INTEGER, title TEXT, tag TEXT, count INTEGER, column_id TEXT, created_at TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, description TEXT, subject TEXT, topic TEXT, date TEXT, pdfUrl TEXT, isCompleted BOOLEAN DEFAULT 0)")
    cursor.execute("CREATE TABLE IF NOT EXISTS resources (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, description TEXT, subject TEXT, topic TEXT, type TEXT, url TEXT, visualizerBg TEXT, isCompleted BOOLEAN DEFAULT 0)")
    cursor.execute("CREATE TABLE IF NOT EXISTS study_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, hours REAL)")
    cursor.execute("CREATE TABLE IF NOT EXISTS calendar_events (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, type TEXT, title TEXT, time TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS attendance (date TEXT PRIMARY KEY, user_id INTEGER, status TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS task_performance (id INTEGER PRIMARY KEY AUTOINCREMENT, week_start TEXT, completed_count INTEGER)")
    cursor.execute("CREATE TABLE IF NOT EXISTS exams (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, subject TEXT, date TEXT, credits INTEGER, requiredScore INTEGER, achievedScore INTEGER, isCompleted BOOLEAN)")
    cursor.execute("CREATE TABLE IF NOT EXISTS gamification (user_id INTEGER PRIMARY KEY, xp INTEGER DEFAULT 0, level INTEGER DEFAULT 1, streak INTEGER DEFAULT 0, last_login TEXT, daily_goal REAL DEFAULT 2.0)")
    cursor.execute("INSERT OR IGNORE INTO gamification (user_id, xp, level, streak, last_login, daily_goal) VALUES (1, 0, 1, 0, '', 2.0)")

    tables = ["progress", "tasks", "notes", "resources", "study_sessions", "calendar_events", "attendance", "task_performance", "exams"]
    for t in tables:
        try: cursor.execute(f"ALTER TABLE {t} ADD COLUMN semester TEXT")
        except sqlite3.OperationalError: pass
    
    conn.commit()
    default_sem = get_sem(conn)
    for t in tables: cursor.execute(f"UPDATE {t} SET semester = ? WHERE semester IS NULL", (default_sem,))
    conn.commit()
    conn.close()

engineering_subjects = {"Data Structures": {"quiz": [{"question": "Time complexity of searching in a balanced BST?", "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"], "answer": "O(log n)"}]}}

@app.route("/api/dashboard", methods=["GET"])
def api_dashboard():
    conn = get_db()
    sem = get_sem(conn)
    today = datetime.date.today()
    start_of_week = today - datetime.timedelta(days=today.weekday())
    sessions = conn.execute("SELECT date, SUM(hours) as total_hours FROM study_sessions WHERE user_id = 1 AND date >= ? AND semester = ? GROUP BY date", (start_of_week.isoformat(), sem)).fetchall()
    weekly_data = [0] * 7
    total_week_hours = 0
    for row in sessions:
        d = datetime.date.fromisoformat(row["date"])
        weekly_data[d.weekday()] += row["total_hours"]
        total_week_hours += row["total_hours"]

    progress = conn.execute("SELECT * FROM progress WHERE semester = ? ORDER BY id DESC", (sem,)).fetchall()
    todays_schedule = conn.execute("SELECT * FROM calendar_events WHERE user_id = 1 AND date = ? AND type IN ('Class', 'Event') AND semester = ? ORDER BY time ASC", (today.isoformat(), sem)).fetchall()
    colors = ["bg-purple-500", "bg-blue-500", "bg-green-500", "bg-orange-500"]
    schedule_data = [{"time": r["time"] or "All Day", "title": r["title"], "room": r["type"], "color": colors[i % len(colors)]} for i, r in enumerate(todays_schedule)]
    
    user_settings = conn.execute("SELECT * FROM settings WHERE user_id = 1").fetchone()
    settings_dict = dict(user_settings) if user_settings else {}
    name = settings_dict.get("fullName", "Student") or "Student"
    
    notifications = []
    if settings_dict:
        if settings_dict.get("notif_deadlines"):
            upcoming_exams = conn.execute("SELECT subject, date FROM exams WHERE isCompleted = 0 AND date >= ? AND semester = ? ORDER BY date ASC LIMIT 3", (today.isoformat(), sem)).fetchall()
            for ex in upcoming_exams:
                days_left = (datetime.date.fromisoformat(ex['date']) - today).days
                if days_left <= 3: notifications.append({"type": "urgent", "title": "Upcoming Deadline", "message": f"{ex['subject']} exam is in {days_left} days!"})
        if settings_dict.get("notif_attendance"):
            att_list = conn.execute("SELECT * FROM attendance WHERE user_id = 1 AND semester = ?", (sem,)).fetchall()
            held = len(att_list)
            attended = sum(1 for a in att_list if a['status'] == 'attended')
            if held > 0 and (attended / held) < 0.75: notifications.append({"type": "warning", "title": "Attendance Alert", "message": f"Your attendance dropped to {(attended/held)*100:.1f}%."})
        if settings_dict.get("notif_summary") and sum(1 for c in todays_schedule if c['type'] == 'Class') > 0:
            notifications.append({"type": "info", "title": "Daily Summary", "message": f"You have {sum(1 for c in todays_schedule if c['type'] == 'Class')} classes today."})

    conn.close()
    return jsonify({"name": name, "active_semester": sem, "user_settings": settings_dict, "notifications": notifications, "subjects": list(engineering_subjects.keys()), "progress": [dict(row) for row in progress], "weekly_data": weekly_data, "total_week_hours": total_week_hours, "schedule": schedule_data})

@app.route("/api/study-time", methods=["POST"])
def add_study_time():
    data = request.get_json()
    hours = float(data.get("hours", 0))
    conn = get_db()
    sem = get_sem(conn)
    conn.execute("INSERT INTO study_sessions (user_id, date, hours, semester) VALUES (1, ?, ?, ?)", (datetime.date.today().isoformat(), hours, sem))
    user_g = get_gamification(conn)
    new_xp = user_g['xp'] + int(hours * 50)
    new_level = (new_xp // 500) + 1
    if new_level > user_g['level']: new_xp += 100 
    conn.execute("UPDATE gamification SET xp=?, level=? WHERE user_id=1", (new_xp, new_level))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/progress", methods=["GET"])
def api_progress():
    conn = get_db()
    sem = get_sem(conn)
    today = datetime.date.today().isoformat()
    yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
    
    # Safe Gamification Fetch
    user_g = get_gamification(conn)
    xp, streak, level, last_login = user_g['xp'], user_g['streak'], user_g['level'], user_g['last_login']
    
    if last_login != today:
        if last_login == yesterday: streak += 1
        else: streak = 1
        xp += streak * 10
        new_level = (xp // 500) + 1
        if new_level > level:
            xp += 100
            level = new_level
        conn.execute("UPDATE gamification SET xp=?, streak=?, level=?, last_login=? WHERE user_id=1", (xp, streak, level, today))
        conn.commit()

    prog_rows = conn.execute("SELECT date, score, total FROM progress WHERE date IS NOT NULL AND semester = ? ORDER BY date ASC", (sem,)).fetchall()
    traj_labels = [f"Quiz {i+1}" for i in range(len(prog_rows))]
    traj_scores = [round((r['score']/r['total'])*100) if r['total'] else 0 for r in prog_rows]
    
    # Hardened Null-Safe Math Engine
    subjects = {row[0] for row in conn.execute("SELECT DISTINCT subject FROM progress WHERE semester=? UNION SELECT DISTINCT subject FROM notes WHERE semester=? UNION SELECT DISTINCT subject FROM resources WHERE semester=?", (sem, sem, sem)).fetchall() if row[0]}
    mastery_data = []
    
    for sub in subjects:
        q = conn.execute("SELECT SUM(score) as s, SUM(total) as t FROM progress WHERE subject=? AND semester=?", (sub, sem)).fetchone()
        q_s, q_t = (q['s'] or 0), (q['t'] or 0)
        q_perc = (q_s / q_t * 100) if q_t > 0 else 0
        
        n = conn.execute("SELECT COUNT(*) as c, SUM(isCompleted) as d FROM notes WHERE subject=? AND semester=?", (sub, sem)).fetchone()
        n_c, n_d = (n['c'] or 0), (n['d'] or 0)
        n_perc = (n_d / n_c * 100) if n_c > 0 else 0
        
        r = conn.execute("SELECT COUNT(*) as c, SUM(isCompleted) as d FROM resources WHERE subject=? AND semester=?", (sub, sem)).fetchone()
        r_c, r_d = (r['c'] or 0), (r['d'] or 0)
        r_perc = (r_d / r_c * 100) if r_c > 0 else 0
        
        comps = [val for val in (q_perc if q_t > 0 else None, n_perc if n_c > 0 else None, r_perc if r_c > 0 else None) if val is not None]
        final_mastery = sum(comps)/len(comps) if comps else 0
        mastery_data.append({"subject": sub, "score": round(final_mastery)})

    events = conn.execute("SELECT title FROM calendar_events WHERE type='Event' AND semester=?", (sem,)).fetchall()
    ec_dict = {}
    for e in events: ec_dict[e['title']] = ec_dict.get(e['title'], 0) + 2 
    conn.close()
    return jsonify({
        "stats": {"level": level, "currentXP": xp, "requiredXP": (level * 500), "streak": streak, "dailyGoal": user_g['daily_goal']},
        "trajectory": {"labels": traj_labels, "scores": traj_scores},
        "mastery": {"labels": [m['subject'] for m in mastery_data], "scores": [m['score'] for m in mastery_data]},
        "extracurriculars": {"labels": list(ec_dict.keys()), "hours": list(ec_dict.values())}
    })

@app.route("/api/progress/goal", methods=["POST"])
def update_goal():
    conn = get_db()
    conn.execute("UPDATE gamification SET daily_goal=? WHERE user_id=1", (float(request.get_json().get("goal", 2.0)),))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/tasks", methods=["GET", "POST"])
def api_tasks():
    conn = get_db()
    sem = get_sem(conn)
    if request.method == "POST":
        data = request.get_json()
        conn.execute("UPDATE tasks SET column_id = ? WHERE id = ?", (data['column_id'], data['id']))
        conn.commit()
        return jsonify({"success": True})
    
    today = datetime.date.today()
    start_of_week = today - datetime.timedelta(days=today.weekday())
    old_tasks = conn.execute("SELECT * FROM tasks WHERE created_at < ? AND semester = ?", (start_of_week.isoformat(), sem)).fetchall()
    if old_tasks:
        completed = sum(1 for t in old_tasks if t['column_id'] == 'completed')
        conn.execute("INSERT INTO task_performance (week_start, completed_count, semester) VALUES (?, ?, ?)", ((start_of_week - datetime.timedelta(days=7)).isoformat(), completed, sem))
        conn.execute("DELETE FROM tasks WHERE created_at < ? AND semester = ?", (start_of_week.isoformat(), sem))
        conn.commit()
        
    tasks = conn.execute("SELECT * FROM tasks WHERE semester = ?", (sem,)).fetchall()
    perf = conn.execute("SELECT * FROM task_performance WHERE semester = ? ORDER BY week_start DESC LIMIT 1", (sem,)).fetchone()
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
    sem = get_sem(conn)
    data = request.get_json()
    if request.method == "POST":
        conn.execute("INSERT INTO tasks (id, user_id, title, tag, count, column_id, created_at, semester) VALUES (?, 1, ?, ?, ?, 'todo', ?, ?)", (str(uuid.uuid4()), data['title'], data['tag'], int(data['count']), datetime.date.today().isoformat(), sem))
    elif request.method == "PUT": conn.execute("UPDATE tasks SET title=?, tag=?, count=? WHERE id=?", (data['title'], data['tag'], int(data['count']), data['id']))
    elif request.method == "DELETE": conn.execute("DELETE FROM tasks WHERE id=?", (data['id'],))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/notes", methods=["GET"])
def api_notes():
    conn = get_db()
    notes = conn.execute("SELECT * FROM notes WHERE semester = ? ORDER BY id DESC", (get_sem(conn),)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in notes])

@app.route("/api/notes/crud", methods=["POST", "PUT", "DELETE"])
def api_notes_crud():
    conn = get_db()
    sem = get_sem(conn)
    data = request.get_json()
    if request.method == "POST": conn.execute("INSERT INTO notes (user_id, title, description, subject, topic, date, pdfUrl, isCompleted, semester) VALUES (1, ?, ?, ?, ?, ?, ?, 0, ?)", (data['title'], data['description'], data['subject'], data['topic'], datetime.date.today().isoformat(), data.get('pdfUrl', 'dummy.pdf'), sem))
    elif request.method == "PUT": conn.execute("UPDATE notes SET title=?, description=?, subject=?, topic=?, pdfUrl=?, isCompleted=? WHERE id=?", (data['title'], data['description'], data['subject'], data['topic'], data.get('pdfUrl', 'dummy.pdf'), int(data.get('isCompleted', 0)), data['id']))
    elif request.method == "DELETE": conn.execute("DELETE FROM notes WHERE id=?", (data['id'],))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/resources", methods=["GET"])
def api_resources():
    conn = get_db()
    resources = conn.execute("SELECT * FROM resources WHERE semester = ? ORDER BY id DESC", (get_sem(conn),)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in resources])

@app.route("/api/resources/crud", methods=["POST", "PUT", "DELETE"])
def api_resources_crud():
    conn = get_db()
    sem = get_sem(conn)
    data = request.get_json()
    if request.method == "POST": conn.execute("INSERT INTO resources (user_id, title, description, subject, topic, type, url, visualizerBg, isCompleted, semester) VALUES (1, ?, ?, ?, ?, ?, ?, ?, 0, ?)", (data['title'], data['description'], data['subject'], data['topic'], data['type'], data['url'], random.choice(["from-fuchsia-600 to-purple-600", "from-cyan-500 to-blue-600", "from-red-500 to-orange-500", "from-emerald-500 to-teal-500", "from-pink-500 to-rose-500"]), sem))
    elif request.method == "PUT": conn.execute("UPDATE resources SET title=?, description=?, subject=?, topic=?, type=?, url=?, isCompleted=? WHERE id=?", (data['title'], data['description'], data['subject'], data['topic'], data['type'], data['url'], int(data.get('isCompleted', 0)), data['id']))
    elif request.method == "DELETE": conn.execute("DELETE FROM resources WHERE id=?", (data['id'],))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/exams", methods=["GET"])
def api_exams():
    conn = get_db()
    sem = get_sem(conn)
    today_str = datetime.date.today().isoformat()
    conn.execute("UPDATE exams SET isCompleted = 1 WHERE date < ? AND isCompleted = 0", (today_str,))
    conn.commit()
    upcoming = conn.execute("SELECT * FROM exams WHERE isCompleted = 0 AND semester = ? ORDER BY date ASC", (sem,)).fetchall()
    completed = conn.execute("SELECT * FROM exams WHERE isCompleted = 1 AND semester = ? ORDER BY date DESC", (sem,)).fetchall()
    settings = conn.execute("SELECT targetGpa FROM settings WHERE user_id = 1").fetchone()
    conn.close()
    
    target_gpa = float(settings['targetGpa']) if settings and settings['targetGpa'] else 3.8
    comp_cred = sum(ex['credits'] for ex in completed if ex['achievedScore'] is not None)
    earned_pts = sum((ex['achievedScore']/100.0)*4.0*ex['credits'] for ex in completed if ex['achievedScore'] is not None)
    cur_gpa = (earned_pts / comp_cred) if comp_cred > 0 else 0.0
    up_cred = sum(ex['credits'] for ex in upcoming)
    req_avg, margin = 0, 0
    if up_cred > 0:
        req_avg = min(100.0, max(0.0, (((target_gpa*(comp_cred+up_cred) - earned_pts) / up_cred) / 4.0) * 100.0))
        margin = max(0.0, (100.0 - req_avg) / 2.0)
    return jsonify({"gpaData": {"currentGPA": cur_gpa, "targetGPA": target_gpa, "requiredAvgScore": req_avg, "marginOfError": margin}, "upcomingExams": [dict(row) for row in upcoming], "completedExams": [dict(row) for row in completed]})

@app.route("/api/exams/crud", methods=["POST", "PUT", "DELETE"])
def api_exams_crud():
    conn = get_db()
    sem = get_sem(conn)
    data = request.get_json()
    if request.method == "POST": conn.execute("INSERT INTO exams (user_id, subject, date, credits, isCompleted, semester) VALUES (1, ?, ?, ?, 0, ?)", (data['subject'], data['date'], int(data['credits']), sem))
    elif request.method == "PUT":
        if 'achievedScore' in data: conn.execute("UPDATE exams SET achievedScore = ? WHERE id = ?", (int(data['achievedScore']), data['id']))
        else: conn.execute("UPDATE exams SET subject=?, date=?, credits=? WHERE id=?", (data['subject'], data['date'], int(data['credits']), data['id']))
    elif request.method == "DELETE": conn.execute("DELETE FROM exams WHERE id=?", (data['id'],))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/settings", methods=["GET", "POST"])
def api_settings():
    conn = get_db()
    if request.method == "POST":
        data = request.get_json()
        conn.execute("""
            INSERT OR REPLACE INTO settings (user_id, fullName, email, university, major, targetGpa, semester, strictMode, avatar, notif_deadlines, notif_attendance, notif_summary) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (data.get("fullName", ""), data.get("email", ""), data.get("university", ""), data.get("major", ""), data.get("targetGpa", ""), data.get("semester", ""), data.get("strictMode", True), data.get("avatar", ""), data.get("notif_deadlines", True), data.get("notif_attendance", True), data.get("notif_summary", True)))
        conn.commit()
        return jsonify({"success": True})
    
    row = conn.execute("SELECT * FROM settings WHERE user_id = 1").fetchone()
    if not row or not dict(row).get("semester"):
        now = datetime.datetime.now()
        def_sem = f"Even Semester (Jan-May) {now.year}" if 1 <= now.month <= 5 else f"Odd Semester (July-Dec) {now.year}"
        conn.execute("INSERT OR REPLACE INTO settings (user_id, semester) VALUES (1, ?)", (def_sem,))
        conn.commit()
        row = conn.execute("SELECT * FROM settings WHERE user_id = 1").fetchone()
        
    conn.close()
    s_dict = dict(row)
    s_dict["strictMode"] = bool(s_dict["strictMode"])
    s_dict["notif_deadlines"] = bool(s_dict["notif_deadlines"])
    s_dict["notif_attendance"] = bool(s_dict["notif_attendance"])
    s_dict["notif_summary"] = bool(s_dict["notif_summary"])
    return jsonify({"success": True, "settings": s_dict})

@app.route("/api/calendar", methods=["GET"])
def api_calendar():
    conn = get_db()
    sem = get_sem(conn)
    events = conn.execute("SELECT * FROM calendar_events WHERE user_id = 1 AND semester = ?", (sem,)).fetchall()
    attendance = conn.execute("SELECT * FROM attendance WHERE user_id = 1 AND semester = ?", (sem,)).fetchall()
    att_list = [dict(row) for row in attendance]
    conn.close()
    return jsonify({"events": [dict(row) for row in events], "attendance_records": att_list, "attendance_stats": {"totalHeld": len(att_list), "totalAttended": sum(1 for a in att_list if a['status'] == 'attended')}})

@app.route("/api/calendar/event", methods=["POST"])
def add_calendar_event():
    data = request.get_json()
    conn = get_db()
    sem = get_sem(conn)
    conn.execute("INSERT INTO calendar_events (user_id, date, type, title, time, semester) VALUES (1, ?, ?, ?, ?, ?)", (data['date'], data['type'], data['title'], data.get('time', ''), sem))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/calendar/attendance", methods=["POST"])
def mark_attendance():
    data = request.get_json()
    conn = get_db()
    sem = get_sem(conn)
    conn.execute("INSERT OR REPLACE INTO attendance (date, user_id, status, semester) VALUES (?, 1, ?, ?)", (data['date'], data['status'], sem))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/export", methods=["GET"])
def export_data():
    conn = get_db()
    data = {}
    tables = ["settings", "progress", "tasks", "notes", "resources", "exams", "study_sessions", "calendar_events", "attendance", "gamification", "task_performance"]
    for table in tables: data[table] = [dict(row) for row in conn.execute(f"SELECT * FROM {table}").fetchall()]
    conn.close()
    return jsonify(data)

@app.route("/api/import", methods=["POST"])
def import_data():
    data = request.get_json()
    conn = get_db()
    for table, rows in data.items():
        if rows and isinstance(rows, list):
            cols = ", ".join(rows[0].keys())
            placeholders = ", ".join("?" for _ in rows[0].keys())
            for row in rows: conn.execute(f"INSERT OR REPLACE INTO {table} ({cols}) VALUES ({placeholders})", tuple(row.values()))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/clear-data", methods=["POST"])
def clear_data():
    conn = get_db()
    tables = ["settings", "progress", "tasks", "notes", "resources", "exams", "study_sessions", "calendar_events", "attendance", "task_performance", "gamification"]
    for table in tables: conn.execute(f"DELETE FROM {table}")
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "All user data cleared."})

if __name__ == "__main__":
    create_tables()
    app.run(debug=True, host="127.0.0.1", port=5000)