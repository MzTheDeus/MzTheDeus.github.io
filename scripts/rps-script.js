let humanScore = 0;
let computerScore = 0;

let results = document.querySelector(".results");
let counterResults = document.querySelector(".counter");
let mainContainer = document.querySelector(".main-container");

const resultPara = document.createElement("p");
const resultScore = document.createElement("h1");
const resultScorePc = document.createElement("h1");
const resetButton = document.createElement("button")

results.appendChild(resultPara);

resetButton.textContent = "Reset"
mainContainer.appendChild(resetButton);


resultScore.textContent = `RPS`;
resultScorePc.textContent = `FIRST TO - 5`;
counterResults.appendChild(resultScore);
counterResults.appendChild(resultScorePc);
resultPara.classList.add("stylePara");



 function getComputerChoice() {
    let x = (Math.floor(Math.random() * 9 + 1));
    if(x <= 3) {
        return ("paper");
    } else if (x >= 7) {
        return ("scissors");
    } else {
        return ("rock");
    }
}


function getHumanChoice() {
    let y = prompt("type rock, paper or scissors (Default is scissors)").toLowerCase();
    if (y == "rock") {
        return "rock";
    } else if (y == "paper"){
        return "paper";
    } else {
        return "scissors";
    }
}


function playRound(human, computer) {
    console.log("You picked: " + human);
    console.log("Computer picked: " + computer);

    if (human == computer) {
        console.log("Tie");
        resultPara.textContent = "Tie";

    } else if (human == "rock" && computer == "paper") {
        ++computerScore;
        resultPara.textContent = "You lose, paper beats rock";

    } else if (human == "paper" && computer == "scissors") {
        ++computerScore;
        resultPara.textContent = "You lose, scissors beats paper";

    } else if (human == "scissors" && computer == "rock") {
        ++computerScore;
        resultPara.textContent = "You lose, rock beats scissors";

        

    } else if (computer == "rock" && human == "paper") {
        ++humanScore;
        resultPara.textContent = "You win, paper beats rock";

    } else if (computer == "paper" && human == "scissors") {
        ++humanScore; 
        resultPara.textContent = "You win, scissors beats paper";

    } else if (computer == "scissors" && human == "rock") {
        ++humanScore;
        resultPara.textContent = "You win, rock beats scissors";
   
    }
    resultScore.textContent = `Human ${humanScore}`;
    resultScorePc.textContent = `Computer ${computerScore}`;  
    if(humanScore === 5){
        resultScore.textContent = `You Win`;
        resultScorePc.textContent = `${humanScore} - ${computerScore}`;
        resultPara.textContent = "";
        rock.disabled = true;
        paper.disabled = true;
        scissors.disabled = true;
    }
    if(computerScore === 5){
        resultScore.textContent = `You Lose`;
        resultScorePc.textContent = `${humanScore} - ${computerScore}`;
        resultPara.textContent = "";
        rock.disabled = true;
        paper.disabled = true;
        scissors.disabled = true;
    }

}




function playGame() {

        const humanSelection = getHumanChoice();
        const computerSelection = getComputerChoice();
        playRound(humanSelection, computerSelection);


    console.log("Final Scores:");
    console.log("Computer Score: " + computerScore);
    console.log("Your Score: " + humanScore);
}






resetButton.addEventListener("click", function(){
    humanScore = 0;
    computerScore = 0;
    resultScore.textContent = `RPS GAME`;
    resultScorePc.textContent = `FIRST TO 5`;
    resultPara.textContent = "";
    rock.disabled = false;
    paper.disabled = false;
    scissors.disabled = false;

});


let rock = document.querySelector("#rock");
rock.addEventListener("click", function(){
    playRound("rock", getComputerChoice());
});

let paper = document.querySelector("#paper");
paper.addEventListener("click", function(){
    playRound("paper", getComputerChoice());
});

let scissors = document.querySelector("#scissors");
scissors.addEventListener("click", function(){
    playRound("scissors", getComputerChoice());
});
