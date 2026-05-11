require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.static("public"));

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

// ================= MODELS =================
const User = mongoose.model("User", {
    name:String,
    email:String,
    phone:String,
    password:String,
    paid:{type:Boolean,default:false},
    loginToken:String
});

const Question = mongoose.model("Question", {
    subject:String,
    category:String,
    question:String,
    options:Array,
    answer:String
});

const Result = mongoose.model("Result", {
    email:String,
    score:Number,
    total:Number,
    percent:Number,
    date:{type:Date,default:Date.now}
});

const ExamSession = mongoose.model("ExamSession", {
    email:String,
    active:Boolean,
    startTime:Date
});

// ================= REGISTER =================
app.post("/api/register", async (req,res)=>{
    try {
        const user = await User.create(req.body);
        res.json({success:true,user});
    } catch(e){
        res.json({error:e.message});
    }
});

// ================= LOGIN =================
app.post("/api/login", async (req,res)=>{
    const user = await User.findOne({email:req.body.email});
    if(!user) return res.json({error:"User not found"});

    const token = Date.now()+"_"+Math.random();
    user.loginToken = token;
    await user.save();

    res.json({success:true,user,token});
});

// ================= PRACTICE QUESTIONS (FREE) =================
app.get("/api/practice", async (req,res)=>{
    const {subject} = req.query;

    const q = await Question.aggregate([
        {$match:{subject}},
        {$sample:{size:20}}
    ]);

    res.json(q);
});

// ================= CBT QUESTIONS (PAID ONLY) =================
app.get("/api/exam", async (req,res)=>{
    const {email} = req.query;

    const user = await User.findOne({email});

    if(!user || !user.paid){
        return res.json({error:"Payment required"});
    }

    const q = await Question.aggregate([
        {$sample:{size:60}}
    ]);

    res.json(q);
});

// ================= PAYSTACK VERIFY =================
app.get("/verify", async (req,res)=>{
    try {
        const ref = req.query.reference;

        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${ref}`,
            {
                headers:{
                    Authorization:`Bearer ${process.env.PAYSTACK_SECRET}`
                }
            }
        );

        const email = response.data.data.customer.email;

        await User.updateOne(
            {email},
            {paid:true}
        );

        res.redirect("/dashboard.html");

    } catch(e){
        res.send("Payment failed");
    }
});

app.listen(PORT, ()=>console.log("CBT running on "+PORT));