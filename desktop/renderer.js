const parser = new DOMParser();
const marked = require("marked");
const mainProcess = require("electron").remote.require("./main");
const {
  desktopCapturer
} = require('electron')

const editor = document.querySelector("#editor");
const preview = document.querySelector("#preview");
const openFileBtn = document.querySelector("#open_file");
const recScreenBtn = document.querySelector("#rec_screen");
const video = document.querySelector("#video");

let currentContent = "";

editor.addEventListener("keyup", (event) => {
  if (currentContent !== event.target.value) {
    preview.innerHTML = marked(event.target.value);
    currentContent = event.target.value;
  }
});

openFileBtn.addEventListener("click", () => {
  const content = mainProcess.openFile();
  editor.value = content;
  preview.innerHTML = marked(content);
});

recScreenBtn.addEventListener("click",captureScreen);

function captureScreen(){
  desktopCapturer.getSources({types: ['screen']}, (error, sources) => {
    if(error){
      alert(error.message);
      return;
    }
     const source = sources.filter(s=>s.name==='Entire Screen')
  });
}

function handleStream (stream) {
  video.srcObject = stream
  video.onloadedmetadata = (e) => video.play()
}

function handleError (e) {
  console.log(e)
}