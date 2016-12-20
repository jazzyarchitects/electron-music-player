"use strict";

module.exports = function(mainWindow){

  const electron = require('electron');
  const path = require('path');
  const dialog = electron.dialog;
  const ipcMain = electron.ipcMain;


  ipcMain.on('ButtonEvent', (event, arg)=>{
    switch(arg){
      case 'ShowSettings':
      // dialog.showOpenDialog(mainWindow, {
        // properties: ['openDirectory', 'multiSelections']
      // }, (filePaths)=>{
        // console.log(filePaths);
      // });
      const settingsWindow = require(path.join(__dirname, '..', 'windows', 'settings'))(mainWindow);
      // settingsWindow.show();
      console.log("Showing settings");
      break;
      default:
      break;
    }
  });
};
