"use strict";

const electron = require('electron');
const path = require('path');
const BrowserWindow = electron.BrowserWindow;


module.exports = function(parentWindow){
    let settingsWindow =new BrowserWindow({
    parent: parentWindow,
    height: 406,
    width: 606,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true
  });

  let url = 'file://' + path.join(__dirname, '..', 'app', 'pages', 'settings.html');
  settingsWindow.loadURL(url);

  return settingsWindow;
}
