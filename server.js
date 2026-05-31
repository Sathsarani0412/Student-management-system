const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");

const db = require("./database/db");

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(__dirname));

app.use(
    session({
        secret: "educare-secret",
        resave: false,
        saveUninitialized: true
    })
);

/* =========================
   PUBLIC PAGES
========================= */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/aboutus", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "aboutus.html"));
});

app.get("/courses", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "courses.html"));
});

app.get("/notices", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "notices.html"));
});

app.get("/contactus", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "contactus.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "signup.html"));
});

/* =========================
   STUDENT PAGES
========================= */

app.get("/student/dashboard", (req, res) => {
    res.sendFile(
        path.join(__dirname, "student", "student-dashboard.html")
    );
});

app.get("/student/profile", (req, res) => {
    res.sendFile(
        path.join(__dirname, "student", "student-profile.html")
    );
});

app.get("/student/attendance", (req, res) => {
    res.sendFile(
        path.join(__dirname, "student", "student-attendance.html")
    );
});

app.get("/student/results", (req, res) => {
    res.sendFile(
        path.join(__dirname, "student", "student-results.html")
    );
});

app.get("/student/notices", (req, res) => {
    res.sendFile(
        path.join(__dirname, "student", "student-notices.html")
    );
});

/* =========================
   ADMIN PAGES
========================= */

app.get("/admin/dashboard", (req, res) => {
    res.sendFile(
        path.join(__dirname, "admin", "admin-dashboard.html")
    );
});

app.get("/admin/students", (req, res) => {
    res.sendFile(
        path.join(__dirname, "admin", "admin-student.html")
    );
});

app.get("/admin/attendance", (req, res) => {
    res.sendFile(
        path.join(__dirname, "admin", "admin-attendance.html")
    );
});

app.get("/admin/results", (req, res) => {
    res.sendFile(
        path.join(__dirname, "admin", "admin-results.html")
    );
});

app.get("/admin/notices", (req, res) => {
    res.sendFile(
        path.join(__dirname, "admin", "admin-notices.html")
    );
});

app.get("/admin/settings", (req, res) => {
    res.sendFile(
        path.join(__dirname, "admin", "admin-settings.html")
    );
});

/* =========================
   SIGNUP USER
========================= */

app.post("/signup-user", async (req, res) => {

    const {
        fullname,
        email,
        phone,
        role,
        password,
        confirmPassword
    } = req.body;

    if(password !== confirmPassword){

        return res.send("Passwords do not match");

    }

    try{

        const hashedPassword =
        await bcrypt.hash(password, 10);

        const studentId =
        "STU" + Math.floor(
            1000 + Math.random() * 9000
        );

        db.run(

            `
            INSERT INTO users
            (
                student_id,
                fullname,
                email,
                phone,
                role,
                password,
                course,
                year,
                status
            )

            VALUES(?,?,?,?,?,?,?,?,?)
            `,

            [
                studentId,
                fullname,
                email,
                phone,
                role,
                hashedPassword,
                "Not Assigned",
                "1st Year",
                "Online"
            ],

            function(err){

                if(err){

                    console.log(err.message);

                    return res.send(
                        "Email already exists"
                    );

                }

                console.log("User Created");

                if(role === "Admin"){

                    return res.redirect(
                        "/admin/dashboard"
                    );

                }else{

                    return res.redirect(
                        "/student/dashboard"
                    );

                }

            }

        );

    }catch(error){

        console.log(error);

        res.send("Signup Error");

    }

});

/* =========================
   LOGIN USER
========================= */

app.post("/login-user", (req, res) => {

    const { email, password } = req.body;

    db.get(

        `
        SELECT * FROM users
        WHERE email = ?
        `,

        [email],

        async (err, user) => {

            if(err){

                console.log(err.message);

                return res.send("Database Error");

            }

            if(!user){

                return res.send("User Not Found");

            }

            const validPassword =
            await bcrypt.compare(
                password,
                user.password
            );

            if(!validPassword){

                return res.send("Invalid Password");

            }

            req.session.user = user;

            db.run(

                `
                UPDATE users
                SET status = 'Online'
                WHERE id = ?
                `,

                [user.id]

            );

            if(user.role === "Admin"){

                return res.redirect(
                    "/admin/dashboard"
                );

            }else{

                return res.redirect(
                    "/student/dashboard"
                );

            }

        }

    );

});

/* =========================
   CURRENT USER
========================= */

app.get("/current-user", (req, res) => {

    if(req.session.user){

        res.json(req.session.user);

    }else{

        res.json(null);

    }

});

/* =========================
   GET STUDENTS
========================= */

app.get("/students-data", (req, res) => {

    db.all(

        `
        SELECT *
        FROM users
        WHERE role = 'Student'
        ORDER BY id DESC
        `,

        (err, rows) => {

            if(err){

                return res.json([]);

            }

            res.json(rows);

        }

    );

});

/* =========================
   DELETE STUDENT
========================= */

app.delete("/delete-student/:id", (req, res) => {

    db.run(

        `
        DELETE FROM users
        WHERE id = ?
        `,

        [req.params.id],

        function(err){

            if(err){

                console.log(err.message);

                return res.send("Error");

            }

            res.send("Deleted");

        }

    );

});

/* =========================
   EDIT STUDENT
========================= */

app.put("/edit-student/:id", (req, res) => {

    const { course, year } = req.body;

    db.run(

        `
        UPDATE users
        SET course = ?,
            year = ?
        WHERE id = ?
        `,

        [
            course,
            year,
            req.params.id
        ],

        function(err){

            if(err){

                console.log(err.message);

                return res.send("Error");

            }

            res.send("Updated");

        }

    );

});

/* =========================
   ADD NOTICE
========================= */

app.post("/add-notice", (req, res) => {

    const {
        title,
        category,
        description
    } = req.body;

    db.run(

        `
        INSERT INTO notices
        (title,category,description)
        VALUES(?,?,?)
        `,

        [title, category, description],

        function(err){

            if(err){

                console.log(err.message);

                return res.send("Error");

            }

            res.redirect("/admin/notices");

        }

    );

});

/* =========================
   GET NOTICES
========================= */

app.get("/notices-data", (req, res) => {

    db.all(

        "SELECT * FROM notices ORDER BY id DESC",

        (err, rows) => {

            if(err){

                return res.json([]);

            }

            res.json(rows);

        }

    );

});

/* =========================
   CONTACT FORM
========================= */

app.post("/send-message", (req, res) => {

    const {
        name,
        email,
        subject,
        message
    } = req.body;

    db.run(

        `
        INSERT INTO messages
        (name,email,subject,message)
        VALUES(?,?,?,?)
        `,

        [name, email, subject, message],

        function(err){

            if(err){

                console.log(err.message);

                return res.send("Error");

            }

            res.redirect("/contactus");

        }

    );

});

/* =========================
   GET MESSAGES
========================= */

app.get("/messages-data", (req, res) => {

    db.all(

        "SELECT * FROM messages ORDER BY id DESC",

        (err, rows) => {

            if(err){

                return res.json([]);

            }

            res.json(rows);

        }

    );

});

/* =========================
   LOGOUT
========================= */

app.get("/logout", (req, res) => {

    if(req.session.user){

        db.run(

            `
            UPDATE users
            SET status = 'Offline'
            WHERE id = ?
            `,

            [req.session.user.id]

        );

    }

    req.session.destroy(() => {

        res.redirect("/login");

    });

});
/* =========================
   DELETE STUDENT
========================= */

app.delete("/delete-student/:id", (req, res) => {

    db.run(

        `
        DELETE FROM users
        WHERE id = ?
        `,

        [req.params.id],

        function(err){

            if(err){

                console.log(err.message);

                return res.send("Error");

            }

            res.send("Deleted");

        }

    );

});

/* =========================
   EDIT STUDENT
========================= */

app.put("/edit-student/:id", (req, res) => {

    const { course, year } = req.body;

    db.run(

        `
        UPDATE users
        SET course = ?,
            year = ?
        WHERE id = ?
        `,

        [
            course,
            year,
            req.params.id
        ],

        function(err){

            if(err){

                console.log(err.message);

                return res.send("Error");

            }

            res.send("Updated");

        }

    );

});

/* =========================
   CURRENT USER
========================= */

app.get("/current-user", (req, res) => {

    if(req.session.user){

        res.json(req.session.user);

    }else{

        res.json(null);

    }

});

/* =========================
UPDATE PROFILE
========================= */

app.put("/update-profile", (req, res) => {

    const {
        fullname,
        phone
    } = req.body;

    db.run(

        `
        UPDATE users
        SET fullname = ?,
            phone = ?
        WHERE id = ?
        `,

        [
            fullname,
            phone,
            req.session.user.id
        ],

        function(err){

            if(err){

                return res.send("Error");

            }

            req.session.user.fullname =
            fullname;

            req.session.user.phone =
            phone;

            res.send("Updated");

        }

    );

});

/* =========================
UPDATE COURSE
========================= */

app.put("/update-course", (req, res) => {

    const { course } = req.body;

    db.run(

        `
        UPDATE users
        SET course = ?
        WHERE id = ?
        `,

        [
            course,
            req.session.user.id
        ],

        function(err){

            if(err){

                return res.send("Error");

            }

            req.session.user.course =
            course;

            res.send("Course Updated");

        }

    );

});

/* =========================
GET COURSES
========================= */

app.get("/courses-data", (req, res) => {

    db.all(

        `
        SELECT *
        FROM courses
        ORDER BY id DESC
        `,

        (err, rows) => {

            if(err){

                return res.json([]);

            }

            res.json(rows);

        }

    );

});

/* =========================
ADD COURSE
========================= */

app.post("/add-course", (req, res) => {

    const {
        title,
        description
    } = req.body;

    db.run(

        `
        INSERT INTO courses
        (title, description)
        VALUES(?,?)
        `,

        [
            title,
            description
        ],

        function(err){

            if(err){

                return res.send("Error");

            }

            res.send("Course Added");

        }

    );

});

/* =========================
ADMIN ADD STUDENT
========================= */

app.post("/admin-add-student", async (req, res) => {

    const {
        fullname,
        email,
        phone,
        password
    } = req.body;

    const hashedPassword =
    await bcrypt.hash(password, 10);

    const studentId =
    "STU" + Math.floor(
        1000 + Math.random() * 9000
    );

    db.run(

        `
        INSERT INTO users
        (
            student_id,
            fullname,
            email,
            phone,
            role,
            password,
            course,
            year,
            status
        )

        VALUES(?,?,?,?,?,?,?,?,?)
        `,

        [
            studentId,
            fullname,
            email,
            phone,
            "Student",
            hashedPassword,
            "Not Assigned",
            "1st Year",
            "Online"
        ],

        function(err){

            if(err){

                return res.send(
                    "Student Add Failed"
                );

            }

            res.send(
                "Student Added Successfully"
            );

        }

    );

});

/* =========================
ADD COURSE
========================= */

/* =========================
ADD COURSE
========================= */

app.post("/add-course", (req, res) => {

    const {
        title,
        description,
        image,
        icon
    } = req.body;

    db.run(

        `
        INSERT INTO courses
        (
            title,
            description,
            image,
            icon
        )

        VALUES(?,?,?,?)
        `,

        [
            title,
            description,
            image,
            icon
        ],

        function(err){

            if(err){

                console.log(err);

                return res.send("Error");

            }

            res.send(
                "Course Added Successfully"
            );

        }

    );

});

/* =========================
GET COURSES
========================= */

app.get("/courses-data", (req, res) => {

    db.all(

        `
        SELECT *
        FROM courses
        ORDER BY id DESC
        `,

        (err, rows) => {

            if(err){

                return res.json([]);

            }

            res.json(rows);

        }

    );

});

/* =========================
UPDATE PROFILE
========================= */

app.put("/update-profile", (req, res) => {

    if(!req.session.user){

        return res.send("Login Required");

    }

    const {
        fullname,
        phone,
        email
    } = req.body;

    db.run(

        `
        UPDATE users

        SET fullname = ?,
            phone = ?,
            email = ?

        WHERE id = ?
        `,

        [
            fullname,
            phone,
            email,
            req.session.user.id
        ],

        function(err){

            if(err){

                return res.send("Error");

            }

            req.session.user.fullname =
            fullname;

            req.session.user.phone =
            phone;

            req.session.user.email =
            email;

            res.send(
                "Profile Updated"
            );

        }

    );

});
/* =========================
UPDATE COURSE
========================= */

app.put("/update-course", (req, res) => {

    if(!req.session.user){

        return res.send("Login Required");

    }

    const { course } = req.body;

    db.run(

        `
        UPDATE users
        SET course = ?
        WHERE id = ?
        `,

        [
            course,
            req.session.user.id
        ],

        function(err){

            if(err){

                return res.send("Error");

            }

            req.session.user.course =
            course;

            res.send(
                "Course Updated"
            );

        }

    );

});
app.get("/attendance-students", (req, res) => {

    db.all(

        `
        SELECT id,
               student_id,
               fullname,
               course
        FROM users
        WHERE role='Student'
        ORDER BY fullname
        `,

        (err, rows) => {

            if(err){
                return res.json([]);
            }

            res.json(rows);

        }

    );

});
app.post("/add-attendance", (req, res) => {

    const {
        studentId,
        course,
        attendanceDate,
        status
    } = req.body;

    db.run(

        `
        INSERT INTO attendance
        (
            student_id,
            course,
            attendance_date,
            status
        )

        VALUES(?,?,?,?)
        `,

        [
            studentId,
            course,
            attendanceDate,
            status
        ],

        function(err){

            if(err){

                console.log(err);

                return res.send("Error");

            }

            res.send("Attendance Saved");

        }

    );

});
app.get("/attendance-data", (req, res) => {

    db.all(

        `
        SELECT

            a.id,
            u.student_id,
            u.fullname,
            a.course,
            a.status,
            a.attendance_date

        FROM attendance a

        JOIN users u
        ON a.student_id = u.id

        ORDER BY a.attendance_date DESC

        `,

        (err, rows) => {

            if(err){

                return res.json([]);

            }

            res.json(rows);

        }

    );

});
app.get("/attendance-stats", (req, res) => {

    const today =
    new Date().toISOString().split("T")[0];

    db.get(

        `
        SELECT COUNT(*) as total
        FROM users
        WHERE role='Student'
        `,

        (err,totalResult)=>{

            const totalStudents =
            totalResult.total;

          
          db.get(

    `
    SELECT COUNT(*) AS present
    FROM attendance
    WHERE attendance_date = ?
    AND status = 'Present'
    `,

    [today],

    (err, presentResult) => {

        if(err){

            console.log(err);

            return res.json({
                totalStudents: 0,
                present: 0,
                absent: 0,
                rate: 0
            });

        }

        const present =
        presentResult
        ? presentResult.present
        : 0;

        const absent =
        totalStudents - present;

        const rate =
        totalStudents > 0
        ? ((present / totalStudents) * 100).toFixed(1)
        : 0;

        res.json({

            totalStudents,
            present,
            absent,
            rate

        });

    }

);          
        }

    );

});
app.get("/student-attendance-data", (req, res) => {

    if(!req.session.user){

        return res.json([]);

    }

    db.all(

        `
        SELECT
            attendance_date,
            course,
            status
        FROM attendance
        WHERE student_id = ?
        ORDER BY attendance_date DESC
        `,

        [req.session.user.id],

        (err, rows) => {

            if(err){

                return res.json([]);

            }

            res.json(rows);

        }

    );

});
app.get("/student-attendance-stats", (req, res) => {

    if(!req.session.user){

        return res.json({});

    }

    const studentId =
    req.session.user.id;

    db.get(

        `
        SELECT COUNT(*) as total
        FROM attendance
        WHERE student_id=?
        `,

        [studentId],

        (err,totalRow)=>{

            const total =
            totalRow.total;

            db.get(

                `
                SELECT COUNT(*) as present
                FROM attendance
                WHERE student_id=?
                AND status='Present'
                `,

                [studentId],

                (err,presentRow)=>{

                    const present =
                    presentRow.present;

                    const absent =
                    total - present;

                    const rate =
                    total > 0
                    ? ((present/total)*100).toFixed(1)
                    : 0;

                    res.json({

                        total,
                        present,
                        absent,
                        rate

                    });

                }

            );

        }

    );

});
app.get("/results-students",(req,res)=>{

    db.all(

        `
        SELECT *
        FROM users
        WHERE role='Student'
        `,

        (err,rows)=>{

            res.json(rows);

        }

    );

});

app.post("/add-result",(req,res)=>{

    const {

        studentId,
        semester,
        subjectCode,
        subjectName,
        credits,
        marks,
        grade,
        gpa

    } = req.body;

    console.log("Student ID received:", studentId);

    const status =
    grade === "Absent"
    ? "Absent"
    : "Completed";

    db.run(

        `
        INSERT INTO results
        (
            student_id,
            semester,
            subject_code,
            subject_name,
            credits,
            marks,
            grade,
            status,
            gpa_points
        )

        VALUES(?,?,?,?,?,?,?,?,?)
        `,

        [
            studentId,
            semester,
            subjectCode,
            subjectName,
            credits,
            marks,
            grade,
            status,
            gpa
        ],

        function(err){

            if(err){
                console.log(err);
                return res.send("Error");
            }

            res.send("Result Added");
        }

    );

});

app.get("/results-data",(req,res)=>{

    const semester =
    req.query.semester;

    let sql = `

    SELECT

        u.student_id,
        u.fullname,
        u.course,
        r.semester,

        ROUND(
            AVG(r.gpa_points),
            2
        ) AS gpa

    FROM users u

    JOIN results r
    ON u.id = r.student_id

    `;

    let params = [];

    if(semester){

        sql += `
        WHERE r.semester = ?
        `;

        params.push(semester);

    }

    sql += `
    GROUP BY u.id,r.semester
    `;

    db.all(sql,params,(err,rows)=>{

        if(err){

            console.log(err);

            return res.json([]);

        }

        res.json(rows);

    });

});
app.get("/student-results-summary",(req,res)=>{

    if(!req.session.user){

        return res.json({});

    }

    const semester =
    req.query.semester;

    db.get(

        `
        SELECT

        SUM(credits)
        AS totalCredits,

        ROUND(

            AVG(
                gpa_points
            ),

            2

        ) AS gpa

        FROM results

        WHERE student_id=?

        AND semester=?

        `,

        [

            req.session.user.id,
            semester

        ],

        (err,row)=>{

            res.json({

                totalCredits:
                row?.totalCredits || 0,

                gpa:
                row?.gpa || 0

            });

        }

    );

});
app.get("/student-results-data", (req,res)=>{

    if(!req.session.user){

        return res.json({
            results: [],
            sgpa: 0,
            cgpa: 0,
            totalSubjects: 0,
            totalCredits: 0,
            status: "Not Logged In"
        });

    }

    const semester = req.query.semester;
    const studentId = req.session.user.id;

    db.all(

        `
        SELECT *
        FROM results
        WHERE student_id = ?
        AND semester = ?
        `,

        [studentId, semester],

        (err, rows) => {

            if(err){

                console.log(err);

                return res.json({
                    results: [],
                    sgpa: 0,
                    cgpa: 0,
                    totalSubjects: 0,
                    totalCredits: 0,
                    status: "Error"
                });

            }

            let totalCredits = 0;
            let totalPoints = 0;

            rows.forEach(r => {

                totalCredits += Number(r.credits);

                totalPoints +=
                    Number(r.gpa_points || 0) *
                    Number(r.credits);

            });

            const sgpa =
                totalCredits > 0
                ? (totalPoints / totalCredits).toFixed(2)
                : "0.00";

            res.json({

                results: rows,
                sgpa: sgpa,
                cgpa: sgpa,
                totalSubjects: rows.length,
                totalCredits: totalCredits,
                status: Number(sgpa) >= 2 ? "Pass" : "Fail"

            });

        }

    );

});
app.get("/admin-dashboard-stats",(req,res)=>{

    db.get(
        `
        SELECT COUNT(*) AS totalStudents
        FROM users
        WHERE role='Student'
        `,
        (err,studentRow)=>{

            db.get(
                `
                SELECT COUNT(*) AS totalNotices
                FROM notices
                `,
                (err,noticeRow)=>{

                    db.get(
                        `
                        SELECT ROUND(
                            AVG(gpa_points),
                            2
                        ) AS avgGpa
                        FROM results
                        `,
                        (err,gpaRow)=>{

                            db.get(
                                `
                                SELECT COUNT(*) AS totalAttendance
                                FROM attendance
                                WHERE status='Present'
                                `,
                                (err,attendanceRow)=>{

                                    res.json({

                                        totalStudents:
                                        studentRow?.totalStudents || 0,

                                        totalNotices:
                                        noticeRow?.totalNotices || 0,

                                        avgGpa:
                                        gpaRow?.avgGpa || 0,

                                        attendance:
                                        attendanceRow?.totalAttendance || 0

                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});
app.get("/student-dashboard-stats",(req,res)=>{

    if(!req.session.user){

        return res.json({});
    }

    const studentId =
    req.session.user.id;

    db.get(

        `
        SELECT

        COUNT(*) AS totalSubjects,

        ROUND(
            AVG(gpa_points),
            2
        ) AS cgpa

        FROM results

        WHERE student_id = ?

        `,

        [studentId],

        (err,resultRow)=>{

            db.get(

                `
                SELECT

                COUNT(*) AS total,

                SUM(
                    CASE
                    WHEN status='Present'
                    THEN 1
                    ELSE 0
                    END
                ) AS present

                FROM attendance

                WHERE student_id=?

                `,

                [studentId],

                (err,attendanceRow)=>{

                    db.get(

                        `
                        SELECT COUNT(*) AS notices
                        FROM notices
                        `,

                        (err,noticeRow)=>{

                            const total =
                            attendanceRow?.total || 0;

                            const present =
                            attendanceRow?.present || 0;

                            const attendanceRate =
                            total > 0
                            ? (
                                present * 100 /
                                total
                              ).toFixed(1)
                            : 0;

                            res.json({

                                attendance:
                                attendanceRate,

                                cgpa:
                                resultRow?.cgpa || 0,

                                subjects:
                                resultRow?.totalSubjects || 0,

                                notices:
                                noticeRow?.notices || 0

                            });

                        }

                    );

                }

            );

        }

    );

});
/* =========================
   SERVER
========================= */

const PORT = 3000;

app.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});