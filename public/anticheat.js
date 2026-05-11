let warningCount = 0;

// ================= FULLSCREEN LOCK =================
function enterFullScreen() {

    let doc = document.documentElement;

    if (doc.requestFullscreen) {
        doc.requestFullscreen();
    }
}

// Force re-lock if user exits fullscreen
document.addEventListener("fullscreenchange", function () {
    if (!document.fullscreenElement) {
        enterFullScreen();
    }
});

// ================= TAB SWITCH =================
document.addEventListener("visibilitychange", function () {

    if (document.hidden) {
        warningCount++;

        alert("WARNING " + warningCount + ": Do not leave exam tab");

        if (warningCount >= 3) {
            forceSubmit("Multiple tab switches detected");
        }
    }
});

// ================= BLOCK ACTIONS =================
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("copy", e => e.preventDefault());
document.addEventListener("paste", e => e.preventDefault());

document.addEventListener("keydown", function (e) {

    if (e.keyCode === 123) e.preventDefault(); // F12

    if (e.ctrlKey && e.shiftKey) e.preventDefault();

    if (e.ctrlKey && e.keyCode === 85) e.preventDefault(); // Ctrl+U
});

// ================= FORCE SUBMIT =================
function forceSubmit(reason) {

    alert("EXAM TERMINATED: " + reason);

    if (typeof submitExam === "function") {
        submitExam();
    }
}