"use strict";

const electron = require('electron');
const ipcMain = electron.ipcMain;

/* Declaring keyboard shortcuts */

const EVENT_KEY = "Shortcut";

module.exports = function (window) {

  return [
  {
    key: "CmdOrCtrl+Up",
    cb: ()=> { window.webContents.send(EVENT_KEY, 'VolumeUp'); }
  },
  {
    key: "CmdOrCtrl+Down",
    cb: ()=> { window.webContents.send(EVENT_KEY, 'VolumeDown'); }
  },
  {
    key: "CmdOrCtrl+Left",
    cb: ()=> { window.webContents.send(EVENT_KEY, 'SeekShortBackward'); }
  },
  {
    key: "CmdOrCtrl+Right",
    cb: ()=> { window.webContents.send(EVENT_KEY, 'SeekShortForward'); }
  },
  {
    key: "CmdOrCtrl+Shift+Left",
    cb: ()=> { window.webContents.send(EVENT_KEY, 'SeekLongBackward'); }
  },
  {
    key: "CmdOrCtrl+Shift+Right",
    cb: ()=> { window.webContents.send(EVENT_KEY, 'SeekLongForward'); }
  },
  // {  //TO Hide developer tools
  //   key: "CmdOrCtrl+Shift+I",
  //   cb: ()=>{ }
  // },
  {
    key: "MediaNextTrack",
    cb: ()=> { window.webContents.send(EVENT_KEY, 'NextSong'); }
  },
  {
    key: "MediaPreviousTrack",
    cb: ()=> { window.webContents.send(EVENT_KEY, 'PreviousSong'); }
  },
  {
    key: "MediaPlayPause",
    cb: ()=> { window.webContents.send(EVENT_KEY, 'Play'); }
  },
  {
    key: "MediaStop",
    cb: ()=> { window.webContents.send(EVENT_KEY, 'Stop'); }
  }]
};
