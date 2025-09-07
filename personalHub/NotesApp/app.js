const formArea = document.querySelector(".formArea");
const title = document.getElementById("title");
const body = document.getElementById("body");
const addBtn = document.getElementById("addBtn");
const notesOutput = document.getElementById("notes");

let notes = [];
console.log(formArea)
console.log(body)

/*
{
  id: Date.now(),                 // unique number
  title: "string",                // from input
  body: "string",                 // from textarea
  createdAt: new Date().toISOString() // ISO date string
}
*/


const SAVED_KEY = "notes";


const saved = localStorage.getItem(SAVED_KEY);
if(saved) {
    notes = JSON.parse(saved);
};



addBtn.addEventListener("click", () => {
    const newNote = {
        id: Date.now(),
        title: title.ariaValueMax.trim(),
        body: body.value.trim(),
        createdAt: new Date().toISOString()
    };
    
    notes.unshift(newNotes);
    localStorage.setItem(SAVED_KEY, JSON.stringify(notes));
    render(notes);
});






















console.log(notes)
console.log("re")