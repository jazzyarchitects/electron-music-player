"use strict";

const fs = require('fs');
const path = require('path');
const config = require('./configurations');

module.exports = function(){
  let configFolder = path.join(config.getUserFolder(), '.music-player');
  if(!fs.existsSync(configFolder)){
    fs.mkdirSync(configFolder);
  }
}
