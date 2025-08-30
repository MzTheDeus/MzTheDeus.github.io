const quotes = [
    "You are gay",
    "Jordan is a fgt",
    "MJ touched kids",
    "rip ozzy",
]

const randomIndex = Math.floor(Math.random() * quotes.length);
const quote = quotes[randomIndex];

console.log(quote);
console.log(randomIndex);

const btn = document.getElementById("btn");
const output = document.getElementById("output");

btn.addEventListener("click", () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    output.textContent = quotes[randomIndex];
});