const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const https = require("https");

const app = express();

// ================= PORT (CORRECTED FOR DEPLOY) =================
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ================= MONGODB =================
console.log("Trying to connect to MongoDB...");

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://adigunjohn_db_user:Olayinka212405@cluster0.4bhtxhh.mongodb.net/cbt?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("MongoDB Error:", err.message));

// ================= MODELS =================
const User = mongoose.model("User", new mongoose.Schema({
    firstname:String,
    middlename:String,
    surname:String,
    phone:String,
    email:{type:String,unique:true},
    password:String,
    paid:{type:Boolean,default:false}
}));

const Result = mongoose.model("Result", new mongoose.Schema({
    email:String,
    score:Number,
    total:Number,
    percent:Number,
    date:{type:Date,default:Date.now}
}));

const Question = mongoose.model("Question", new mongoose.Schema({
    question:String,
    options:[String],
    answer:String,
    subject:String,
    year:String,
    exam:String
}));

const Answer = mongoose.model("Answer", new mongoose.Schema({
    email:String,
    question:Number,
    answer:String,
    updated:{type:Date,default:Date.now}
}));

// ================= REGISTER =================
app.post("/register", async (req,res)=>{
    try{
        await new User(req.body).save();
        res.json({success:true});
    }catch{
        res.json({success:false});
    }
});

// ================= LOGIN =================
app.post("/login", async (req,res)=>{
    const {email,password}=req.body;

    const user = await User.findOne({email});

    if(!user || user.password !== password){
        return res.json({success:false,message:"Invalid login"});
    }

    res.json({success:true,email:user.email,paid:user.paid});
});

// ================= ADMIN =================
app.post("/admin/add-question", async (req,res)=>{
    try{
        await new Question(req.body).save();
        res.json({success:true});
    }catch{
        res.json({success:false});
    }
});

app.get("/admin/questions", async (req,res)=>{
    try{
        res.json(await Question.find());
    }catch{
        res.json([]);
    }
});

app.post("/admin/delete-question", async (req,res)=>{
    try{
        await Question.deleteOne({_id:req.body.id});
        res.json({success:true});
    }catch{
        res.json({success:false});
    }
});

// ================= QUESTIONS =================
app.get("/questions", async (req,res)=>{
    const subject = req.query.subject;

    try{
        let q;

        if(subject && subject !== "null" && subject !== "undefined"){
            q = await Question.aggregate([
                { $match: { subject: subject } },
                { $sample: { size: 50 } }
            ]);
        }else{
            q = await Question.aggregate([
                { $sample: { size: 50 } }
            ]);
        }

        res.json(q);
    }catch{
        res.json([]);
    }
});

// ================= SAVE ANSWER =================
app.post("/save-answer", async (req,res)=>{
    const {email,question,answer} = req.body;

    try{
        await Answer.updateOne(
            {email,question},
            {answer,updated:new Date()},
            {upsert:true}
        );
        res.json({success:true});
    }catch{
        res.json({success:false});
    }
});

// ================= SAVE RESULT =================
app.post("/save-result", async (req,res)=>{
    try{
        await new Result(req.body).save();
        await Answer.deleteMany({email:req.body.email});
        res.json({success:true});
    }catch{
        res.json({success:false});
    }
});

// ================= CHECK RESULT =================
app.post("/check-result", async (req,res)=>{
    const r = await Result.findOne({email:req.body.email});
    res.json({taken:!!r});
});

// ================= START =================
app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
});