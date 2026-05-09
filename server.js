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

// ================= DB =================
mongoose.connect(process.env.MONGO_URI);

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

    const { email, subject, loginToken } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.loginToken !== loginToken)
        return res.json({ error: "Invalid session" });

    if (!user.paid)
        return res.json({ error: "Payment required" });

    if (new Date() > user.expiresAt)
        return res.json({ error: "Access expired" });

    // ❌ prevent multiple active exams
    const existing = await ExamSession.findOne({
        email,
        active: true
    });

    if (existing)
        return res.json({ error: "Active exam already running" });

    const sessionId = generateSessionId();

    await ExamSession.create({
        email,
        subject,
        sessionId,
        startTime: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour exam
        active: true
    });

    res.json({ success: true, sessionId });
});

// ================= QUESTIONS =================
app.get("/questions", async (req, res) => {

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
        { $sample: { size: 200 } } // commercial package size
    ]);

    res.json(questions);
});

// ================= SAVE RESULT (STRICT ONE TIME) =================
app.post("/save-result", async (req, res) => {

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
});

// ================= ADMIN PANEL =================
app.get("/admin", async (req, res) => {

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
});

// ================= SERVER =================
app.listen(PORT, () => {
    console.log("CBT Commercial System running on port " + PORT);
});