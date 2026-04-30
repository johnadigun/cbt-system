const mongoose = require("mongoose");

const uri = "mongodb+srv://adigunjohn_db_user:212405Adigunjohn@cluster0.4bhtxhh.mongodb.net/cbt?retryWrites=true&w=majority";

// ================= SCHEMA =================
const QuestionSchema = new mongoose.Schema({
    question: String,
    options: [String],
    answer: String
});

const Question = mongoose.model("Question", QuestionSchema);

// ================= SEED FUNCTION =================
async function seed() {
    try {
        console.log("Connecting to MongoDB...");

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log("MongoDB Connected");

        // 🔥 Clear existing
        await Question.deleteMany({});
        console.log("Old questions cleared");

        let questions = [];

        for (let i = 1; i <= 500; i++) {
            let a = Math.floor(Math.random() * 50) + 1;
            let b = Math.floor(Math.random() * 50) + 1;
            let correct = a + b;

            let options = [
                correct,
                correct + 1,
                correct - 1,
                correct + 2
            ].map(String);

            // shuffle
            options.sort(() => Math.random() - 0.5);

            questions.push({
                question: `Question ${i}: What is ${a} + ${b}?`,
                options: options,
                answer: String(correct)
            });
        }

        await Question.insertMany(questions);

        console.log("✅ 500 questions inserted successfully");

        mongoose.connection.close();

    } catch (err) {
        console.log("❌ Error:", err);
    }
}

// ================= RUN =================
seed();