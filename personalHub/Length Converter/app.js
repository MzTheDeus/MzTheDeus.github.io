const amount = document.getElementById("amount");
const mode = document.getElementById("mode");
const convertBtn = document.getElementById("convertBtn");
const result = document.getElementById("result");
const reset = document.getElementById("reset");


function cToF(celsius) {
    return celsius * 0.621371192;
}
function fToC(fahrenheit) {
    return fahrenheit / 0.621371192;
}

console.log(cToF(25));
console.log(fToC(25));


function convertC() {
    const n = Number(amount.value);
    console.log(amount.value);

    let out;
        out = cToF(n);
        result.value = out.toFixed(6);
    
};

function convertF() {
    const n = Number(result.value);
    console.log(result.value);
 
    let out;
        out = fToC(n);
        amount.value = out.toFixed(6);

};

reset.addEventListener("click", () => {
    amount.value = "";
    result.value = "";
});



result.addEventListener("input", convertF)
amount.addEventListener("input", convertC)


