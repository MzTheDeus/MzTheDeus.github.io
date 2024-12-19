const content = document.querySelector(".main");
btnReset = document.querySelector(".resetButton");






function newGrid(){
  const userInput = prompt("Enter a number - if you type over 100 you will brick your pc");
  const size = 100 / userInput;
  

  for (let i = 1; i <= userInput * userInput; i++){

    const newDiv = document.createElement("div");
  
    newDiv.classList.add("box");
    newDiv.style.width = `${size}px`;
    newDiv.style.height = `${size}px`;
    newDiv.textContent = "";
    newDiv.classList.add("draw");
    content.appendChild(newDiv);
  }

  
  content.addEventListener("mouseover", function(e){
    if (e.target.classList.contains("box")){
      let newColor = Math.floor(Math.random() * 256);
      let newColor2 = Math.floor(Math.random() * 256);
      let newColor3 = Math.floor(Math.random() * (256 - 100) + 100);
      e.target.style.backgroundColor = `rgb(${newColor}, ${newColor2}, ${newColor3})`;
    }
  });
  

  btnReset.textContent = "Reset"
}



const removeFunction = function(){
  const childDivs = content.querySelectorAll("div")
  childDivs.forEach(div => {
    div.remove()
  })
  newGrid();
}




btnReset.addEventListener("click", removeFunction)



