const parser = new DOMParser();
const editor = document.querySelector("#editor");
const preview = document.querySelector("#preview");
const marked = require("marked");


let currentContent = "";
editor.addEventListener("keyup", (event)=>{
  if(currentContent!==event.target.value){
    preview.innerHTML= marked(event.target.value);
    currentContent = event.target.value;
  }
});

