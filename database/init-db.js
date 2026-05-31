const db = require("./db");

/* COURSES TABLE */

db.run(`

CREATE TABLE IF NOT EXISTS courses(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT,

    description TEXT,

    icon TEXT

)

`);

/* NOTICES TABLE */

db.run(`

CREATE TABLE IF NOT EXISTS notices(

    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

)

`);

/* CONTACT MESSAGES */

db.run(`

CREATE TABLE IF NOT EXISTS messages(

    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    subject TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

)

`);
/* USERS TABLE */

db.run(`

CREATE TABLE IF NOT EXISTS users(

    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT,
    password TEXT,
    course TEXT,
    year TEXT,
    student_id TEXT,
    status TEXT DEFAULT 'Offline'

)

`);
/* ATTENDANCE TABLE */

db.run(`

CREATE TABLE IF NOT EXISTS attendance(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    student_id INTEGER,

    course TEXT,

    attendance_date TEXT,

    status TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(student_id)
    REFERENCES users(id)

)

`);
/* RESULTS TABLE */
/* RESULTS TABLE */

db.run(`

CREATE TABLE IF NOT EXISTS results(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    student_id INTEGER,

    semester TEXT,

    subject_code TEXT,

    subject_name TEXT,

    credits INTEGER,

    marks INTEGER,

    grade TEXT,

    status TEXT,

    gpa_points REAL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(student_id)
    REFERENCES users(id)

)

`);

db.all(
    `
    SELECT name
    FROM sqlite_master
    WHERE type='table'
    `,
    (err, rows) => {
        console.log(rows);
    }
);
console.log("Database Tables Created");