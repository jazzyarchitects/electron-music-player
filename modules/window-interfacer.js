"use strict";

let electron = null;
module.exports = function(mainWindow){

  const electron = require('electron');
  const path = require('path');
  const dialog = electron.dialog;
  const ipcMain = electron.ipcMain;

  let settingsWindow = null;

  ipcMain.on('ButtonEvent', (event, arg)=>{
    switch(arg){
      case 'ShowSettings':
      settingsWindow = require(path.join(__dirname, '..', 'windows', 'settings'))(mainWindow);
      break;
      default:
      break;
    }
  });

  ipcMain.on('Dialog', (event, arg)=>{
    switch(arg){
      case 'LibrarySelect':
        dialog.showOpenDialog(settingsWindow, {
          properties: ['openDirectory', 'multiSelections']
        }, (filePaths)=>{
          event.sender.send('LibrarySelect-filePaths', filePaths);
        });
      default:
      break;
    }
  });
};
