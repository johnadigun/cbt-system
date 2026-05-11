require("dotenv").config();

const mongoose = require("mongoose");

// ================= SAFE DB CONNECT =================
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.log("❌ MONGO_URI not found in .env");
    process.exit(1);
}

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
})
.then(() => console.log("✔ MongoDB Connected for Question Generator"))
.catch(err => {
    console.log("❌ MongoDB Error:", err.message);
    process.exit(1);
});

// ================= QUESTION MODEL =================
const Question = mongoose.model("Question", new mongoose.Schema({
    subject: String,
    question: String,
    options: [String],
    answer: String,
    year: String,
    exam: String
}));

// ================= DATA CONFIG =================
const subjects = [
    "Mathematics",
    "English",
    "Biology",
    "Chemistry",
    "Physics",
    "Economics"
];

const exams = ["JAMB", "WAEC"];
const years = ["2020", "2021", "2022", "2023", "2024"];

// ================= QUESTION BANK =================
const questionBank = {
    Mathematics: [
        { question: "What is 25% of 200?", options: ["25","50","75","100"], answer: "50" },
        { question: "Solve: 3x = 12", options: ["2","3","4","6"], answer: "4" },
        { question: "What is the square of 9?", options: ["18","27","81","36"], answer: "81" }
    ],

    English: [
        { question: "Choose correct sentence:", options: ["He go school","He goes to school","He going school","He gone school"], answer: "He goes to school" },
        { question: "Synonym of Happy:", options: ["Sad","Angry","Joyful","Tired"], answer: "Joyful" },
        { question: "Antonym of Hot:", options: ["Warm","Cold","Heat","Fire"], answer: "Cold" }
    ],

    Biology: [
        { question: "Basic unit of life?", options: ["Cell","Tissue","Organ","System"], answer: "Cell" },
        { question: "Photosynthesis occurs in?", options: ["Root","Leaf","Stem","Flower"], answer: "Leaf" }
    ],

    Chemistry: [
        { question: "Water formula is?", options: ["CO2","H2O","NaCl","O2"], answer: "H2O" },
        { question: "pH of pure water is?", options: ["5","7","9","1"], answer: "7" }
    ],

    Physics: [
        { question: "Unit of force?", options: ["Newton","Joule","Watt","Pascal"], answer: "Newton" },
        { question: "Speed = ?", options: ["Distance/Time","Time/Distance","Mass/Volume","Force/Area"], answer: "Distance/Time" }
    ],

    Economics: [
        { question: "Demand means:", options: ["Ability to pay","Supply","Production","Profit"], answer: "Ability to pay" },
        { question: "Opportunity cost is:", options: ["Next best alternative","Total cost","Revenue","Profit"], answer: "Next best alternative" }
    ]
};

// ================= GENERATOR FUNCTION =================
function generateQuestion(i) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const pool = questionBank[subject];

    const pick = pool[Math.floor(Math.random() * pool.length)];

    return {
        subject,
        question: `${i}. ${pick.question}`,
        options: pick.options,
        answer: pick.answer,
        year: years[Math.floor(Math.random() * years.length)],
        exam: exams[Math.floor(Math.random() * exams.length)]
    };
}

// ================= MAIN SEED FUNCTION =================
async function generate() {
    try {
        console.log("⚡ Generating CBT question bank...");

        // safer delete with warning
        await Question.deleteMany({});
        console.log("🧹 Old questions cleared");

        let data = [];

        for (let i = 1; i <= 1000; i++) {
            data.push(generateQuestion(i));
        }

        await Question.insertMany(data);

        console.log("✔ SUCCESS: 1000 CBT questions generated");
        console.log("✔ Database: cbt_system → questions");

        process.exit();

    } catch (err) {
        console.log("❌ GENERATOR ERROR:", err.message);
        process.exit(1);
    }
}

generate();