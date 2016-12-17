"use strict";

const fs = require('fs');

module.exports = function(directory){
  let files = [];
  fs.readdirSync(MUSIC_LIB).forEach((fileName)=>{
    if(/(.*)\.(mp3)$/.test(fileName))
      files.push(fileName);
  });
  return files;
}
