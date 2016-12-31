"use strict";
const electron = require('electron');
const path = require('path');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut;
const config = require('./modules/config-setup');
config.setup();


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


  const shortcuts = require(path.join(__dirname, 'modules', 'globalShortcuts'))(mainWindow);
  shortcuts.forEach((ob)=>{
    globalShortcut.register(ob.key, ob.cb);
  });

  require(path.join(__dirname, 'modules', 'window-interfacer'))(mainWindow);
});

app.on('window-all-closed', ()=> {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  globalShortcut.unregisterAll();
});

app.on('will-quit', ()=>{
  globalShortcut.unregisterAll();
});
