"use strict";

let electron = require('electron');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;

function minimize() {
  let w = remote.getCurrentWindow();
  w.minimize();
}

function closeWindow() {
  let w = remote.getCurrentWindow();
  w.close();
}

function showSettings() {
  ipcRenderer.send('ButtonEvent', 'ShowSettings');
}
