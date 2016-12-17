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
    height: 600,
    width: 800
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
