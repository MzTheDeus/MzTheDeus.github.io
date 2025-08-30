
let tasks = [];

const STORAGE_KEY = "todo-tasks";


const input = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("todo-list");



function addItem() {
    const raw = input.value;
    const title = raw.trim();
    if(!title) return;

    const id = Date.now().toString();

    const task = {
        id: id,
        title: title,
        completed: false
    };

    tasks.push(task);

    saveTasks();
    render();

    input.value = "";
    input.focus();
}

function render() {
    list.innerHTML = "";

    for (const task of tasks) {
        const li = document.createElement("li");
        li.dataset.id = task.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        checkbox.addEventListener("change", () => {
            task.completed = checkbox.checked;
            saveTasks();
        })

        const text = document.createElement("span");
        text.textContent = task.title;

        const delBtn = document.createElement("button");
        delBtn.textContent = "X";
        delBtn.addEventListener("click", () => {
        tasks = tasks.filter(t => t.id !== task.id); // remove from array
        saveTasks(); // save
        render();    // redraw without it
        });

        
        li.appendChild(checkbox);
        li.appendChild(text);
        li.appendChild(delBtn);
        list.appendChild(li);
    }

}







//Calls addItem when pressing "Enter"
input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addItem();
    }
});
//Calls addItem when clicking addBtn
addBtn.addEventListener("click", addItem);

function saveTasks() {
    const text = JSON.stringify(tasks);
    localStorage.setItem(STORAGE_KEY, text);
};

function loadTasks() {
    const text = localStorage.getItem(STORAGE_KEY);
    if(!text) {
        tasks = [];
        return;
    }
    tasks = JSON.parse(text);
}


/*
const li = document.createElement("li");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    const delBtn = document.createElement("button");
    delBtn.textContent = "Ta Bort";

    const text = document.createElement("span");
    text.textContent = title;


    checkbox.addEventListener("change", () => {
        li.classList.toggle("done", checkbox.checked);
    });

    delBtn.addEventListener("click", () => {
        list.removeChild(li)
    });




    li.appendChild(checkbox);
    li.appendChild(text);
    list.appendChild(li);
    li.appendChild(delBtn);
*/