const display = document.getElementById("display");
const buttons = document.getElementById("buttons");
const miniDisplay = document.getElementById("miniDisplay");
let sum = 0;
const calculator = {
    displayValue: "0",
    storedValue: 0,
    operator: null,
    waitingForNextValue: true,
};


console.log(calculator)
display.textContent = calculator.displayValue;




buttons.addEventListener("click", function(e) {
    btnDigit = e.target.dataset.num;
    btnClear = e.target.dataset.clear;
    btnOp = e.target.dataset.op;
    btnEquals = e.target.dataset.equals;

    if(btnDigit) {
        if(calculator.waitingForNextValue) {
        display.textContent = "";
        calculator.displayValue = "";
        calculator.waitingForNextValue = false;
    };
    }


    if(btnOp) {
        calculator.storedValue = calculator.displayValue
        calculator.waitingForNextValue = true;
        calculator.operator = btnOp;
        miniDisplay.textContent = `${calculator.storedValue} ${calculator.operator}`
        console.log(calculator.displayValue);
    }






    if(btnEquals) {
        if(calculator.waitingForNextValue === false) {
            miniDisplay.textContent = `${calculator.storedValue} ${calculator.operator} ${calculator.displayValue} =`
            console.log(calculator)
            operation(calculator.storedValue, calculator.operator, calculator.displayValue)
            calculator.waitingForNextValue = true;
        }


    };

    
    if(btnClear){
        display.textContent = "";
        calculator.displayValue = 0;
        calculator.waitingForNextValue = true;
        calculator.storedValue = 0;
        display.textContent = calculator.displayValue;
        miniDisplay.textContent = "";

    }

    if(btnDigit === undefined) return;

    calculator.displayValue += btnDigit
    display.textContent += btnDigit;
    console.log(calculator)
});











function operation(first, op, last) {
    if(op === "+") {
       sum = Number(first) + Number(last);
       calculator.storedValue = sum;
       display.textContent = calculator.storedValue;
    } else if (op === "-") {
       sum = Number(first) - Number(last);
       calculator.displayValue = sum;
       display.textContent = calculator.displayValue;
    } else if (op === "*") {
       sum = Number(first) * Number(last);
       calculator.displayValue = sum;
       display.textContent = calculator.displayValue;
    } else if (op === "/") {
       sum = Number(first) / Number(last);
       calculator.displayValue = sum;
       display.textContent = calculator.displayValue;
    }
}



