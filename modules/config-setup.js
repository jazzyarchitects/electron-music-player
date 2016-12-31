"use strict";

const fs = require('fs');
const path = require('path');
const config = require('./configurations');

exports.setup = function() {
  let configFolder = path.join(config.getUserFolder(), '.music-player');
  if(!fs.existsSync(configFolder)) {
    fs.mkdirSync(configFolder);
  }
}

exports.configFolder = path.join(config.getUserFolder(), '.music-player');
