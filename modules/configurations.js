"use strict";

const path = require('path');

function getUserFolder(){
  return process.env[(process.platform==="win32")?'USERPROFILE': 'HOME'];
}

const nconf = require('nconf').file({file: path.join(getUserFolder, '.music-player-ja.json')});

let saveValue = function(key, value){
  nconf.set(key, value);
  nconf.save();
}

let getValue = function(key){
  nconf.load();
  return nconf.get(key);
}

module.exports = {
  save: saveValue,
  get: getValue
}
