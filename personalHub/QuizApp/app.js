const questions = [
    {
        question: "What year was YungLean born?",
        choices: ["1995", "1996", "1997"],
        correctIndex: 1,
    },
    {
        question: "What is YungLean's real name?",
        choices: ["Kristoffer", "Jonatan", "Benjamin"],
        correctIndex: 1,
    },
    {
        question: "Where is YungLean from?",
        choices: ["Stockholm", "Göteborg", "Malmö"],
        correctIndex: 0,
    },
]

const result = document.createElement("h2");

const btnContainer = document.getElementsByClassName("btn-container")
const container = document.getElementById("container");
const reset = document.getElementById("reset");
const start = document.getElementById("start");
let currentIndex = 0;
let score = 0;
let info = [];





function render() {
    container.innerHTML = "";
    const currentQ = questions[currentIndex];
    const currentCorrect = questions[currentIndex].correctIndex;
    const qText = document.createElement("h2");
    qText.textContent = currentQ.question;
    container.appendChild(qText);



    for(const [i, q] of currentQ.choices.entries()) {

        const answer = document.createElement("button");
        answer.textContent = q;
        container.appendChild(answer)  


        answer.addEventListener("click", () => {
            if(i === currentCorrect) {
                    currentIndex++;
                    score++;
                    info.push(q)
            } else {
                info.push(q)
                currentIndex++;
            };

            if(currentIndex < questions.length) {
                render();
            } else {
                console.log(info)
                winCon()
            }



        });

    }



};





function winCon() {
    container.innerHTML = ""
    result.textContent = `You got ${score} of 3`
    container.appendChild(result);
    container.appendChild(reset);
    reset.hidden = false;
}





start.addEventListener("click", () => {
    render();
})

/*
function resetQuiz() {
    reset.hidden = true;
    score = 0;
    currentIndex = 0;
    render();
}

reset.addEventListener("click", () => {
    resetQuiz();
});
*/





