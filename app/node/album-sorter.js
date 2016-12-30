"use strict";

const async = require('async');
const id3 = require('id3-parser');
const path = require('path');
const fs = require('fs');

let albumRetreiver = function(song) {
  let songPath = path.join(song.directory, song.song);
  return new Promise((resolve)=>{
    fs.readFile(songPath, (err, buf)=>{
      if(err) console.log("ID3-PARSER Error: album-sorter.js: "+JSON.stringify(err));
      id3.parse(buf)
      .then((tag)=>{
        resolve({directory: song.directory, song: song.song, album: tag.album});
      });
    });
  });
};

let decode = function(songs) {
  return new Promise((resolve)=>{
    let a = [];
    async.forEachLimit(songs, 6, (song, _cb)=>{
      albumRetreiver(song)
      .then((obj)=>{
        a.push(obj);
        _cb();
      });
    }, ()=>{
      resolve(a);
    });
  });
};

let sort = function(albumData) {
  let albums = [];
  let albumSongs = {};
  for(let i=0; i<albumData.length; i++) {
    let obj = albumData[i];
    if(albums.indexOf(obj.album)===-1) {
      albums.push(obj.album);
      albumSongs[obj.album] = [];
    }
    albumSongs[obj.album].push({directory: obj.directory, song: obj.song});
  }

  let a = [];
  for(let album of Object.keys(albumSongs)) {
    a.push({album: album, songs: albumSongs[album]});
  }
  return a;
}

let getAlbumImage = function(albumSorted) {
  return new Promise((resolve, reject)=>{
    async.forEachLimit(albumSorted, 1, (album, _cb)=>{
      let song = album.songs[0];
      let filePath = path.join(song.directory, song.song);
      let buf = fs.readFileSync(filePath);
      id3.parse(buf)
      .then((tag)=>{
        if(!tag.image) {
          return _cb();
        }
        tag.image.mime = tag.image.mime.replace(/jpeg/g, 'jpg');
        album.imageURL = 'data:' + tag.image.mime + ';base64,' + tag.image.data.toString('base64')
        _cb();
      });
    }, ()=>{
      resolve(albumSorted);
    });
  });
}

let main = function(songs) {
  return new Promise((resolve)=>{
    decode(songs)
    .then((albumData)=>{
      getAlbumImage(sort(albumData))
      .then((a)=>{
        resolve(a);
      });
    });
  });
}

module.exports = main;
