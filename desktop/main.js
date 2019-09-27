const {app,BrowserWindow,dialog} = require("electron");
const fs = require("fs");

let win;

app.on("ready",()=>{
  win = new BrowserWindow({show:false, backgroundColor:'gray'});
  win.loadURL(`file://${__dirname}/index.html`);
  win.once("ready-to-show", ()=>{
    win.show();
  });
  win.on("closed", ()=>{ 
    win = null;
  });
});
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');

const openFile = exports.openFile = ()=>{
  const files = dialog.showOpenDialog({
    properties: ['openFile']
  });
  if(!files || !files[0]) return "";
  const content = fs.readFileSync(files[0]).toString();
  return content;
}

const filePutContent = exports.filePutContent = (path, content)=>{

}

