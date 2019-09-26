const {app,BrowserWindow,dialog} = require("electron");

let win;

app.on("ready",()=>{
  win = new BrowserWindow({show:false});
  win.loadURL(`file://${__dirname}/index.html`);
 console.log('dd');
  win.once("ready-to-show", ()=>{
debugger;
    win.show();
debugger;

    const files = dialog.showOpenDialog({
      properties: ['openFile']
    });
  });

  win.on("closed", ()=>{ 
    win = null;
  });
});


