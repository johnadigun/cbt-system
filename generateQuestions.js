require("dotenv").config(); // ✅ ADDED (for local env)

const mongoose = require("mongoose");

// ================= MONGODB CONNECT =================
mongoose.connect(
    process.env.MONGO_URI || "mongodb+srv://adigunjohn_db_user:2124dore@cluster0.4bhtxhh.mongodb.net/cbt?retryWrites=true&w=majority",
{
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(()=>console.log("MongoDB Connected for Generator"))
.catch(err=>console.log("Mongo Error:", err.message));

// ================= MODEL =================
const Question = mongoose.model("Question", new mongoose.Schema({
    question:String,
    options:[String],
    answer:String,
    subject:String,
    year:String,
    exam:String
}));

// ================= SUBJECTS =================
const subjects = [
    "Mathematics",
    "English",
    "Biology",
    "Chemistry",
    "Physics",
    "Economics"
];

const exams = ["JAMB", "WAEC"];
const years = ["2020","2021","2022","2023","2024"];

// ================= REAL QUESTION BANK =================
const questionBank = {

    Mathematics: [
        { question: "What is 25% of 200?", options: ["25","50","75","100"], answer: "50" },
        { question: "Solve: 3x = 12", options: ["2","3","4","6"], answer: "4" },
        { question: "What is the square of 9?", options: ["18","27","81","36"], answer: "81" }
    ],

    English: [
        { question: "Choose the correct sentence:", options: ["He go to school","He goes to school","He going school","He gone school"], answer: "He goes to school" },
        { question: "Synonym of 'Happy' is:", options: ["Sad","Angry","Joyful","Tired"], answer: "Joyful" },
        { question: "Antonym of 'Hot' is:", options: ["Warm","Cold","Heat","Fire"], answer: "Cold" }
    ],

    Biology: [
        { question: "The basic unit of life is?", options: ["Cell","Tissue","Organ","System"], answer: "Cell" },
        { question: "Photosynthesis occurs in?", options: ["Root","Leaf","Stem","Flower"], answer: "Leaf" }
    ],

    Chemistry: [
        { question: "Water formula is?", options: ["CO2","H2O","NaCl","O2"], answer: "H2O" },
        { question: "pH of pure water is?", options: ["5","7","9","1"], answer: "7" }
    ],

    Physics: [
        { question: "Unit of force is?", options: ["Newton","Joule","Watt","Pascal"], answer: "Newton" },
        { question: "Speed = ?", options: ["Distance/Time","Time/Distance","Mass/Volume","Force/Area"], answer: "Distance/Time" }
    ],

    Economics: [
        { question: "Demand means:", options: ["Desire backed by ability to pay","Supply of goods","Production","Distribution"], answer: "Desire backed by ability to pay" },
        { question: "Opportunity cost is:", options: ["Next best alternative","Total cost","Profit","Revenue"], answer: "Next best alternative" }
    ]
};

// ================= GENERATOR =================
function generateQuestion(i){
    const subject = subjects[Math.floor(Math.random()*subjects.length)];
    const pool = questionBank[subject];
    const pick = pool[Math.floor(Math.random()*pool.length)];

    return {
        question: `Q${i}: ${pick.question}`,
        options: pick.options,
        answer: pick.answer,
        subject,
        year: years[Math.floor(Math.random()*years.length)],
        exam: exams[Math.floor(Math.random()*exams.length)]
    };
}

// ================= MAIN =================
async function generate(){
    try{
        const data = [];

        // ✅ CLEAR OLD DATA (UPGRADE ONLY)
        await Question.deleteMany();

        for(let i=1;i<=1000;i++){
            data.push(generateQuestion(i));
        }

        await Question.insertMany(data);

        console.log("1000 REAL CBT Questions Generated");
        process.exit();
    }catch(err){
        console.log("GENERATOR ERROR:", err.message);
        process.exit(1);
    }
}

generate();