let randomNum = Math.floor(Math.random() * 100) + 1;

let tries = 0;



let lowAnswers = [
    "You are low",
    "Try again! Too low",
    "Too low.. You got this!"
]
let highAnswers = [
    "You are high",
    "Almost, but you are high",
    "Try again! You are high"
]








const guessBtn = document.getElementById("guessBtn");
const resetBtn = document.getElementById("resetBtn");
const guessInput = document.getElementById("guess");
const message = document.getElementById("message");

guessBtn.addEventListener("click", () => {
    guessGame()
});
guessInput.addEventListener("keydown", (event) => {
    if(event.key === "Enter") {
        guessGame()
    }
});

resetBtn.addEventListener("click", () => {
    randomNum = Math.floor(Math.random() * 100) + 1;
    message.textContent = "Enter a number 1 - 100";
    guessInput.value = "";
    guessBtn.hidden = false;
    guessInput.disabled = false;
    guessInput.focus();
    tries = 0;
});

function guessGame() {
    console.log(randomNum);
    tries++;
    console.log(tries);
    let lowAnswer = lowAnswers[Math.floor(Math.random() * lowAnswers.length)];
    let highAnswer = highAnswers[Math.floor(Math.random() * highAnswers.length)];
    const guess = Number(guessInput.value);

    if(isNaN(guess) || guess < 1 || guess > 100) {
        alert("Input 1-100");
        return;
    } else if(guess < randomNum) {
        message.textContent = lowAnswer;
    } else if(guess === randomNum) {
        message.textContent = "Correct Guess " + guessInput.value + "." + " Total Tries: " + tries;
        guessBtn.hidden = true;
        guessInput.disabled = true;
    } else if(guess > randomNum) {
        message.textContent = highAnswer;
    }
    guessInput.value = "";
};







console.log(randomNum);

