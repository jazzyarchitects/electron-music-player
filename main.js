"use strict";
const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut;


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


  const shortcuts = require('./globalShortcuts.js')(mainWindow);
  shortcuts.forEach((ob)=>{
    globalShortcut.register(ob.key, ob.cb);
  });
})

app.on('window-all-closed', ()=> {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  globalShortcut.unregisterAll();
});

app.on('will-quit', ()=>{
  globalShortcut.unregisterAll();
});
