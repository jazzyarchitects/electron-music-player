"use strict";

const electron = require('electron');
const remote = electron.remote;

function minimize() {
  let w = remote.getCurrentWindow();
  w.minimize();
}

function closeWindow() {
  let w = remote.getCurrentWindow();
  w.close();
}
