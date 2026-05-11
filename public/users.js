const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ================= USER MODEL =================
// NOTE: We use safe reuse model to prevent overwrite crash
const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
    email: String,
    password: String,
    paid: { type: Boolean, default: false },
    paidAt: Date,
    expiresAt: Date,
    loginToken: String
}));

// ================= REGISTER =================
router.post("/register", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ error: "Email and password required" });
        }

        const existing = await User.findOne({ email });

        if (existing) {
            return res.json({ error: "User already exists" });
        }

        await User.create({
            email,
            password,
            paid: false,
            loginToken: ""
        });

        res.json({
            success: true,
            message: "Registration successful"
        });

    } catch (err) {
        console.log("REGISTER ERROR:", err);
        res.json({ error: "Server error" });
    }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: "Missing fields" });
        }

        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // ================= SESSION TOKEN =================
        const token = Date.now() + "_" + Math.random();

        user.loginToken = token;
        await user.save();

        res.json({
            success: true,
            email: user.email,
            paid: user.paid,
            loginToken: token
        });

    } catch (err) {
        console.log("LOGIN ERROR:", err);
        res.json({ success: false, message: "Server error" });
    }
});

module.exports = router;