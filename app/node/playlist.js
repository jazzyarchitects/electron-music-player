"use strict";

const fs = require('fs');
const path = require('path');
const config = require(path.join(__dirname, '..', '..', 'modules', 'config-setup'));

exports.read = function(playlistName){
  let playlistPath = path.join(config.configFolder, playlistName+".playlist");
  return JSON.parse(fs.readFileSync(playlistPath).toString());
};

exports.save = exports.create = function(playlistName, songs){
  let pl = {};
  pl.createdAt = (new Date()).getTime();
  pl.modifiedAt = (new Date()).getTime();
  pl.name = playlistName;
  pl.songs = songs;
  pl.length = songs.length;
  let filePath = path.join(config.configFolder, playlistName+".playlist");
  fs.writeFileSync(filePath, JSON.stringify(pl, null, 2));
  return pl;
}

exports.getAll = function(){
  let pls = [];
  return new Promise((resolve, reject)=>{
    fs.readdir(config.configFolder, (err, filenames)=>{
      if(filenames===undefined || filenames.length<=0){
        return resolve();
      }
      filenames.forEach((filename)=>{
        if(/(.*)\.(playlist)$/.test(filename)){
          pls.push(JSON.parse(fs.readFileSync(path.join(config.configFolder, filename)).toString()));
        }
        resolve(pls)
      });
    });
  });
}
