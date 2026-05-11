require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

// ================= MIDDLEWARE =================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

// ================= PORT =================
const PORT = process.env.PORT || 3000;

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("DB ERROR:", err.message));

// ================= USER MODEL =================
const User = mongoose.model("User", new mongoose.Schema({
    surname: String,
    middlename: String,
    firstname: String,
    phone: String,
    email: String,
    password: String,
    paid: { type: Boolean, default: false },
    loginToken: String,
    createdAt: { type: Date, default: Date.now }
}));

// ================= HOME ROUTE =================
app.get("/", (req, res) => {
    res.send("CBT System Running...");
});

// ================= REGISTER =================
app.post("/register", async (req, res) => {
    try {
        const {
            surname,
            middlename,
            firstname,
            phone,
            email,
            password
        } = req.body;

        const exists = await User.findOne({ email });

        if (exists) {
            return res.json({
                success: false,
                message: "User already exists"
            });
        }

        await User.create({
            surname,
            middlename,
            firstname,
            phone,
            email,
            password
        });

        return res.json({
            success: true,
            message: "Registration successful"
        });

    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Server error"
        });
    }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            return res.json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = Date.now() + "_" + Math.random();

        user.loginToken = token;
        await user.save();

        return res.json({
            success: true,
            email: user.email,
            loginToken: token
        });

    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Server error"
        });
    }
});

// ================= SERVER START =================
app.listen(PORT, () => {
    console.log("CBT Server running on port " + PORT);
});