let questions = [];
let index = 0;
let answers = {};
let TIME = 60 * 60;

let email = localStorage.getItem("email") || "test@test.com";

// ================= LOAD =================
async function loadExam(){
    let res = await fetch("/api/exam?email="+email);
    questions = await res.json();

    if(!Array.isArray(questions)){
        alert("Cannot load exam");
        return;
    }

    showQuestion();
    startTimer();
    startAntiCheat();
}

// ================= SHOW =================
function showQuestion(){

    let q = questions[index];

    document.getElementById("questionBox").innerHTML =
        `<h3>Question ${index+1}</h3><p>${q.question}</p>`;

    let html = "";

    q.options.forEach(opt=>{
        html += `
        <label class="option">
            <input type="radio"
                   name="opt"
                   value="${opt}"
                   ${answers[index] === opt ? "checked":""}
                   onchange="save('${opt}')">
            ${opt}
        </label>
        `;
    });

    document.getElementById("optionsBox").innerHTML = html;
}

// ================= SAVE =================
function save(val){
    answers[index] = val;
}

// ================= NAV =================
function next(){
    if(index < questions.length-1){
        index++;
        showQuestion();
    }
}

function prev(){
    if(index > 0){
        index--;
        showQuestion();
    }
}

// ================= TIMER =================
function startTimer(){

    setInterval(()=>{
        TIME--;

        let m = Math.floor(TIME/60);
        let s = TIME%60;

        document.getElementById("timer").innerHTML =
            m+":"+ (s<10?"0"+s:s);

        if(TIME <= 0){
            submitExam();
        }

    },1000);
}

// ================= SUBMIT =================
async function submitExam(){

    await fetch("/api/submit",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            email,
            answers,
            questions
        })
    });

    alert("Exam Submitted!");

    window.location.href="/result.html";
}

// ================= ANTI-CHEAT =================
function startAntiCheat(){

    // TAB SWITCH
    document.addEventListener("visibilitychange",()=>{
        if(document.hidden){
            warn("⚠ Do not switch tabs!");
        }
    });

    // COPY PASTE BLOCK
    document.addEventListener("keydown",e=>{
        if(e.ctrlKey && ["c","v","u"].includes(e.key)){
            e.preventDefault();
            warn("Action blocked");
        }
    });

    // RIGHT CLICK BLOCK
    document.addEventListener("contextmenu",e=>e.preventDefault());

    // FULLSCREEN
    document.documentElement.requestFullscreen?.();
}

// ================= WARNING =================
function warn(msg){
    let w = document.getElementById("warning");
    w.innerText = msg;

    setTimeout(()=>w.innerText="",3000);
}

loadExam();