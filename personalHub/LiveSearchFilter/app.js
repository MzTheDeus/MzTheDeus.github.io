const list = document.getElementById("list");
const search = document.getElementById("search");

const taskList = document.getElementById("taskList");
const allBtn = document.getElementById("allBtn");
const doneBtn = document.getElementById("doneBtn");
const notDoneBtn = document.getElementById("notDoneBtn");



const fruits = ["Apple", "Banana", "Orange", "Mango", "Grapes", "Blueberry"];








const tasks = [
    { text: "Learn JavaScript", done: true },
    { text: "Build a project", done: false },
    { text: "Drink coffee", done: true },
    { text: "Take a walk", done: false },
];
const cart = [
    { name: "Apple", price: 5 },
    { name: "Banana", price: 3 },
    { name: "Coffee", price: 25 },
];
const displayItems = cart.map(item => `${item.name} - $${item.price}`);
console.log(displayItems);






function render(items) {
    list .innerHTML = "";
    for (const item of items) {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
    }
}
render(fruits);


search.addEventListener("input", () => {
    const query = search.value.toLowerCase();
    const matches = fruits.filter(fruit =>
        fruit.toLowerCase().includes(query)
    );
    render(matches);
});




function rendertask(items) {
    taskList.innerHTML = "";
    for (const task of items) {
        const li = document.createElement("li");
        li.textContent = task.text + (task.done ? " yes" : " no");
        taskList.appendChild(li);
    }
}

rendertask(tasks);

allBtn.addEventListener("click", () => rendertask(tasks));
doneBtn.addEventListener("click", () => {
    const matches = tasks.filter(task => task.done === true);
    rendertask(matches);
});
notDoneBtn.addEventListener("click", () => {
    const matches = tasks.filter(task => task.done === false); 
    rendertask(matches);
})



function renderCart(items) {
  list.innerHTML = "";
  for (const line of items) {
    const li = document.createElement("li");
    li.textContent = line;
    list.appendChild(li);
  }
}
renderCart(displayItems);

const total = cart.reduce((sum, item) => sum + item.price, 0);
console.log("Total:", total);

