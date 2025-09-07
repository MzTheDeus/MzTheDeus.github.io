const calculator = {
    displayValue: "0",
    firstOperand: null,
    operator: null,
    waitingForSecondOperand: false,
    overwrite: true,
    lastRightOperand: null,
}

console.log()
let isDark = true;

const body = document.querySelector("body");
const miniDisplay = document.querySelector(".miniDisplay");
const display = document.getElementById("display");
const buttons = document.querySelector(".buttons");
const dark = document.querySelector(".dark-light");
const practise = document.getElementById("practise");

buttons.addEventListener("click", function(e) {
    //gets the clicked button
    const button = e.target;

        //NUMBER
    if (button.dataset.digit) {
        if(calculator.overwrite || calculator.displayValue === "0") {
            calculator.displayValue = button.dataset.digit;
            calculator.overwrite = false;
        } else {
            calculator.displayValue += button.dataset.digit;
        }

        calculator.waitingForSecondOperand = false;
        updateDisplay();


        //OPERATOR
    } else if (button.dataset.operator) {
        const newOp = button.dataset.operator;

        if(calculator.firstOperand === null) {
            calculator.firstOperand = Number(calculator.displayValue);
            calculator.operator = newOp;
            calculator.waitingForSecondOperand = true;
            calculator.overwrite = true;
            miniDisplay.textContent = `${calculator.firstOperand} ${calculator.operator}`;
            updateDisplay();
            return
        }
        if(calculator.waitingForSecondOperand === true) {
            calculator.operator = newOp;
            miniDisplay.textContent = `${calculator.firstOperand} ${calculator.operator}`;
            return;
        }

        const right = Number(calculator.displayValue);
        const result = apply(Number(calculator.firstOperand), calculator.operator, right)

        calculator.displayValue = String(result);
        calculator.firstOperand = result;
        calculator.operator = newOp;
        calculator.waitingForSecondOperand = true;
        calculator.overwrite = true;

        miniDisplay.textContent = `${calculator.firstOperand} ${calculator.operator}`;
        updateDisplay();
        return;



        //EQUALS
    } else if (button.dataset.equals !== undefined) {
        if(calculator.firstOperand === null || calculator.operator === null) return;

        const left = Number(calculator.firstOperand);
        const right = Number(calculator.displayValue);
        const result = apply(left, calculator.operator, right);

        miniDisplay.textContent = `${left} ${calculator.operator} ${right} =`;

        let rounded = Math.round((result + Number.EPSILON) * 1e9) / 1e9;
        calculator.displayValue = String(rounded);
        if (calculator.displayValue === "-0") calculator.displayValue = "0"; // optional
        calculator.firstOperand = rounded;
        calculator.lastRightOperand = right;
        calculator.overwrite = true;
        calculator.waitingForSecondOperand = true;

        updateDisplay();
        return;


        //RESET
    } else if (button.dataset.action === "ac") {
        resetDisplay();
        updateDisplay();
        return;
    }

});









function updateDisplay() {
    display.textContent = calculator.displayValue;
}
function resetDisplay() {
    calculator.displayValue = "0",
    calculator.firstOperand = null,
    calculator.operator = null,
    calculator.waitingForSecondOperand = false,
    calculator.overwrite = true,
    calculator.lastRightOperand = null
    display.textContent = calculator.displayValue;
    miniDisplay.textContent = "";
};

function apply(a, op, b) {

    if(op === "+") {
       return a + b;
    } else if (op === "-") {
        return a - b;
    } else if (op === "*") {
        return a * b;
    } else if (op === "/") {
        return a / b;
    }
}




practise.addEventListener("click", function(e) {
    let color = e.target.dataset.num
    if(color === "1") {
        display.style.color = "#fcb2ffff";
    } else if (color === "2") {
        display.style.color = "#b2ffc3ff";
    } else if (color === "3") {
        display.style.color = "#b2fff5ff";
    }
});


dark.addEventListener("click", () => {
    if(isDark) {
        isDark = false;
        dark.style.backgroundColor = "#202020";
        body.style.backgroundColor = "#202020"
        dark.textContent = "☀️"
    } else {
        isDark = true;
        dark.style.backgroundColor = "white";
        body.style.backgroundColor = "white"
        dark.textContent = "🌙"
    }
});

