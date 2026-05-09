require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// ================= MIDDLEWARE =================
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ================= SAFETY CHECK =================
if (!process.env.MONGO_URI) {
    console.log("❌ MONGO_URI is missing in environment variables");
}

// ================= DATABASE CONNECTION =================
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000
})
.then(() => {
    console.log("MongoDB Connected Successfully");

    // ================= START SERVER ONLY AFTER DB CONNECT =================
    app.listen(PORT, () => {
        console.log("CBT Commercial System running on port " + PORT);
    });

})
.catch(err => {
    console.log("MongoDB Connection Error:", err.message);
});

// ================= MODELS =================
const User = mongoose.model("User", new mongoose.Schema({
    email: String,
    password: String,
    paid: Boolean,
    expiresAt: Date,
    loginToken: String
}));

const ExamSession = mongoose.model("ExamSession", new mongoose.Schema({
    email: String,
    subject: String,
    sessionId: String,
    startTime: Date,
    expiresAt: Date,
    active: Boolean
}));

const Result = mongoose.model("Result", new mongoose.Schema({
    email: String,
    score: Number,
    total: Number,
    percent: Number,
    subject: String,
    createdAt: { type: Date, default: Date.now }
}));

const Question = mongoose.model("Question", new mongoose.Schema({
    question: String,
    options: [String],
    answer: String,
    subject: String
}));

// ================= HELPERS =================
function generateSessionId() {
    return crypto.randomBytes(16).toString("hex");
}

// ================= START EXAM =================
app.post("/start-exam", async (req, res) => {
    try {

        const { email, subject, loginToken } = req.body;

        const user = await User.findOne({ email });

        if (!user || user.loginToken !== loginToken)
            return res.json({ error: "Invalid session" });

        if (!user.paid)
            return res.json({ error: "Payment required" });

        if (new Date() > user.expiresAt)
            return res.json({ error: "Access expired" });

        const existing = await ExamSession.findOne({ email, active: true });

        if (existing)
            return res.json({ error: "Active exam already running" });

        const sessionId = generateSessionId();

        await ExamSession.create({
            email,
            subject,
            sessionId,
            startTime: new Date(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            active: true
        });

        res.json({ success: true, sessionId });

    } catch (err) {
        console.log("START EXAM ERROR:", err.message);
        res.json({ error: "Server error" });
    }
});

// ================= QUESTIONS =================
app.get("/questions", async (req, res) => {
    try {

        const { email, subject, sessionId } = req.query;

        const session = await ExamSession.findOne({
            email,
            sessionId,
            active: true
        });

        if (!session)
            return res.json({ error: "Invalid or expired session" });

        if (new Date() > session.expiresAt) {
            session.active = false;
            await session.save();
            return res.json({ error: "Exam time ended" });
        }

        const questions = await Question.aggregate([
            { $match: { subject } },
            { $sample: { size: 200 } }
        ]);

        res.json(questions);

    } catch (err) {
        console.log("QUESTION ERROR:", err.message);
        res.json({ error: "Server error" });
    }
});

// ================= SAVE RESULT =================
app.post("/save-result", async (req, res) => {
    try {

        const { email, subject } = req.body;

        const existing = await Result.findOne({ email, subject });

        if (existing)
            return res.json({ error: "Result already submitted" });

        await Result.create(req.body);

        await ExamSession.updateMany(
            { email, active: true },
            { active: false }
        );

        res.json({ success: true });

    } catch (err) {
        console.log("RESULT ERROR:", err.message);
        res.json({ error: "Server error" });
    }
});

// ================= ADMIN =================
app.get("/admin", async (req, res) => {
    try {

        const users = await User.find();
        const sessions = await ExamSession.find({ active: true });
        const results = await Result.find();

        res.json({
            totalUsers: users.length,
            activeExams: sessions.length,
            totalResults: results.length,
            users,
            sessions,
            results
        });

    } catch (err) {
        console.log("ADMIN ERROR:", err.message);
        res.json({ error: "Server error" });
    }
});