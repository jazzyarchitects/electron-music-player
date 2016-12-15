"use strict";

const fs = require('fs');

const MUSIC_LIB = "/home/jibin/Music";

let app = angular.module('MusicPlayer', ['ngMaterial']);

app.controller('MainController', ($scope)=>{
  $scope.songs = [];

  $scope.init = ()=>{
    fs.readdirSync(MUSIC_LIB).forEach((fileNames)=>{
      $scope.songs.push(fileNames);
    });
  };

});
