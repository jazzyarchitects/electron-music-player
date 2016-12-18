"use strict";
const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipc;

let mainWindow = null;

app.on('ready', ()=>{
  mainWindow = new BrowserWindow({
    frame: false,
    resizable: false,
    height: 606,
    width: 806
  });

  mainWindow.loadURL('file://' + __dirname + "/app/index.html");

  mainWindow.on('closed', ()=>{
    mainWindow = null;
  });
})

app.on('window-all-closed', ()=> {
  if (process.platform != 'darwin') {
    app.quit();
  }
});
