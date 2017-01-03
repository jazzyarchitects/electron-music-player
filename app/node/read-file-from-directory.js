"use strict";

const fs = require('fs');
const path = require('path');
const MusicLibrary = require(path.join(__dirname, 'music-libraries'));


module.exports = function(directory) {
  let excluded = MusicLibrary.getExcluded() || [];
  if(!directory) {
    directory = MusicLibrary.getAll();
  }
  let files = [];
  if(typeof(directory)==="string") {
    fs.readdirSync(MUSIC_LIB).forEach((fileName)=>{
      if(/(.*)\.(mp3)$/.test(fileName))
        files.push({directory: directory, song: fileName});
    });
  }else{
    directory.forEach((d)=>{
      files = files.concat(readDir(d, excluded));
    });
  }

  return files;
}

function readDir(dirname, excluded) {
  let files = [];
  if(!fs.existsSync(dirname) || excluded.indexOf(dirname)!==-1) {
    return [];
  }
  fs.readdirSync(dirname).forEach((file)=>{
    let filePath = path.join(dirname, file);
    if(excluded.indexOf(filePath)===-1){
      let stat = fs.lstatSync(filePath);

      if(stat.isDirectory()) {
      // files.push(readDir(filePath));
      files = files.concat(readDir(filePath, excluded));
    }
    else{
      if(/(.*)\.(mp3)$/.test(file)) {
        files.push({directory: dirname, song: file});
      }
    }
  }
});
  return files;
}
