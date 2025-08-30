const paper = document.getElementById("paper");
const rock = document.getElementById("rock");
const scissors = document.getElementById("scissors");
const reset = document.getElementById("reset");

const result = document.getElementById("result");
const score = document.getElementById("score");
const right = document.getElementById("right-result");
const left = document.getElementById("left-result");


let playerScore = 0;
let computerScore = 0;

console.log(right);
console.log(paper);

let emojiChange = {
    rock: "✊",
    paper: "✋",
    scissors: "✌️"
}





function computerPlay() {
    const choices = ["rock", "paper", "scissors"];
    const index = Math.floor(Math.random() * choices.length);
    return choices[index];
}

const beats = { rock: "scissors", paper: "rock", scissors: "paper" };

 

function playRound(playerChoice) {
    const compChoice = computerPlay();
    console.log(compChoice);
    right.textContent = emojiChange[compChoice];
    left.textContent = emojiChange[playerChoice];

    if (playerChoice === compChoice) {
        result.textContent = `Tie! You both picked ${playerChoice}.`;
        return;
    };

    if (beats[playerChoice] === compChoice) {
        playerScore++;
        result.textContent = `You win! ${playerChoice} beats ${compChoice}.`;
    } else {
        computerScore++;
        result.textContent = `You lose! ${compChoice} beats ${playerChoice}.`;
    };
    if(playerScore === 5 || computerScore === 5) {
        paper.classList.add("disable");
        rock.classList.add("disable");
        scissors.classList.add("disable");
        paper.disabled = true;
        rock.disabled = true;
        scissors.disabled = true;
    };
    
    score.textContent = `Player: ${playerScore} | Computer: ${computerScore}`;
};

function resetGame() {
    playerScore = 0;
    computerScore = 0;
    result.textContent = "Make your move!";
    score.textContent = "Player: 0 | Computer: 0";
        paper.disabled = false;
        rock.disabled = false;
        scissors.disabled = false;
        paper.classList.remove("disable");
        rock.classList.remove("disable");
        scissors.classList.remove("disable");
        right.textContent = "?";
        left.textContent = "?";
};






rock.addEventListener("click",     () => playRound("rock"));
paper.addEventListener("click",    () => playRound("paper"));
scissors.addEventListener("click", () => playRound("scissors"));
reset.addEventListener("click",    () => resetGame());





















// Old logic
/*

const choices = [
    "rock",
    "paper",
    "scissors"
];

paper.addEventListener("click", () => {

    let randomChoice = choices[Math.floor(Math.random() * choices.length)];
    console.log(randomChoice);
    let playerChoice = "paper";

    if(playerChoice === randomChoice) {
        console.log("tie");
    } else if (randomChoice === "rock") {
        console.log("you win");
    } else {
        console.log("you lose");
    }
});

rock.addEventListener("click", () => {

    let randomChoice = choices[Math.floor(Math.random() * choices.length)];
    console.log(randomChoice);
    let playerChoice = "rock";

    if(playerChoice === randomChoice) {
        console.log("tie");
    } else if (randomChoice === "scissors") {
        playerScore++;
        console.log("you win");
    } else {
        console.log("you lose");
    }
});

scissors.addEventListener("click", () => {

    let randomChoice = choices[Math.floor(Math.random() * choices.length)];
    console.log(randomChoice);
    let playerChoice = "scissors";

    if(playerChoice === randomChoice) {
        console.log("tie");
    } else if (randomChoice === "paper") {
        console.log("you win");
    } else {
        console.log("you lose");
    }
});

*/



