"use strict";

let electron = null;
module.exports = function(mainWindow) {
  const electron = require('electron');
  const path = require('path');
  const dialog = electron.dialog;
  const ipcMain = electron.ipcMain;

  let settingsWindow = null;

  ipcMain.on('ButtonEvent', (event, arg)=>{
    switch(arg) {
      case 'ShowSettings':
      settingsWindow = require(path.join(__dirname, '..', 'windows', 'settings'))(mainWindow);
      break;
      default:
      break;
    }
  });

  ipcMain.on('Dialog', (event, arg)=>{
    switch(arg) {
      case 'LibrarySelect':
      case 'ExcludedLibrarySelect':
        dialog.showOpenDialog(settingsWindow, {
          properties: ['openDirectory', 'multiSelections']
        }, (filePaths)=>{
          event.sender.send(arg+'-filePaths', filePaths);
        });
        break;
      default:
      break;
    }
  });

  ipcMain.on('Change', (event, arg)=>{
    switch(arg.type) {
      case 'MusicLibrary':
        mainWindow.webContents.send('Change', arg);
      default:
        break;
    }
  });
};
