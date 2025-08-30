


let clicks = 0;

const button = document.getElementById("btn");
const counter = document.getElementById("count");

button.addEventListener("click", () => {
    clicks += 1;
    counter.textContent = clicks;
});

const message = document.getElementById("message");
const toggle = document.getElementById("toggleBtn");

toggle.addEventListener("click", () => {
    message.classList.toggle("hidden");

    if(message.classList.contains("hidden")) {
        toggle.textContent = "Show more";
    } else {
        toggle.textContent = "Show less"
    }
});


const input_1 = document.getElementById("input-1");
const input_2 = document.getElementById("input-2");
const input_3 = document.getElementById("input-3");

const addBtn = document.getElementById("addBtn");
const subBtn = document.getElementById("subBtn");
const oddBtn = document.getElementById("oddBtn");
const nameCard = document.getElementById("nameCard");


const output = document.getElementById("output");

addBtn.addEventListener("click", () => {
    const result = Number(input_1.value) + Number(input_2.value);
    output.textContent = "Result: " + result;
});

subBtn.addEventListener("click", () => {
    const result = Number(input_1.value) - Number(input_2.value);
    output.textContent = "Result: " + result;
});

oddBtn.addEventListener("click", () => {
    if (Number(input_3.value) % 2 === 0) {
        output.textContent = "Even";
    } else {
        output.textContent = "Odd";
    }
    
});


const fruits = ["apple", "banana", "orange"];
const numbers = [1, 2, 3, 4, 5];
const names = ["Alice", "Bob", "Charlie"];



for (const num of numbers) {
    console.log(num * 2)
}

fruits.push("Pear");
console.log(fruits)




const randomFruit = fruits[Math.floor(Math.random() * fruits.length)];
console.log("You got:", randomFruit);






const person = {
    name: "Patric",
    age: 28,
    job: "Student"
};


const people = [
    { name: "Alice", age: 20, hobby: "Horse riding" },
    { name: "Bob", age: 25, hobby: "MotoCross" },
    { name: "Charlie", age: 30, hobby: "Fishing" },
]



for (const person of people) {

    const divi = document.createElement("div");
    
    for (const key in person) {

        const label = key.charAt(0).toUpperCase() + key.slice(1);
        const p = document.createElement("p");
        
        p.textContent = label + ": " + person[key];
        divi.appendChild(p);


            if (key === "name") {
            p.style.fontWeight = "bold";
        }
    }

    divi.classList.add("styled-box");
    nameCard.appendChild(divi);
}
