"use strict";

const fs = require('fs');
const jsmediatags = require('jsmediatags');

const MUSIC_LIB = "/home/jibin/Music";

let app = angular.module('MusicPlayer', ['ngMaterial']);
var audio = null;

const PLAY_CLASS = "fa-play-circle";
const PAUSE_CLASS = "fa-pause-circle";

app.controller('MainController', ($scope)=>{
  $scope.songs = [];
  $scope.currentSong = {};
  $scope.isPlaying = false;
  $scope.playListSize = 0;
  $scope.player = {
    playClass: PLAY_CLASS,
    shuffle: "Off",
    repeat: "Current"
  };


  $scope.init = ()=>{
    fs.readdirSync(MUSIC_LIB).forEach((fileNames)=>{
      $scope.songs.push(fileNames);
    });
    $scope.playListSize = $scope.songs.length;
  };

  $scope.play = function (index) {
    if($scope.isPlaying){
      $scope.pause();
    }
    let songPath = undefined;
    if(index!==undefined){
      $scope.currentSong.index = index;
      $scope.currentSong.name = $scope.songs[index];
      songPath = "file://"+MUSIC_LIB+"/"+$scope.currentSong.name;
    }else{
      if(audio===null){
        $scope.currentSong.name = $scope.songs[0];
        $scope.currentSong.index = 0;
        songPath = "file://"+MUSIC_LIB+"/"+$scope.songs[0];
      }
    }

    if(songPath===undefined){
      return;   /*  Error assigning file  */
    }

    audio = new Audio(songPath);
    if(audio!==null) {
      audio.play();
      audio.addEventListener("ended", ()=>{
          $scope.next();
      });
    }
    $scope.player.playClass = PAUSE_CLASS;
    $scope.isPlaying = true;
  }

  $scope.pause = function(){
    $scope.player.playClass = PLAY_CLASS;
    if(audio!==null) audio.pause();
    audio = null;
    $scope.isPlaying = false;
  }

  $scope.togglePlay = function(){
    if($scope.isPlaying){
      $scope.pause();
    }else{
      $scope.play();
    }
  }

  $scope.next = function(){
    $scope.currentSong.index = getNextIndex($scope.currentSong.index, $scope.playListSize);
    $scope.play($scope.currentSong.index);
  }

  $scope.prev = function(){
    $scope.currentSong.index = getPrevIndex($scope.currentSong.index, $scope.playListSize);
    $scope.play($scope.currentSong.index);
  }

});


function getNextIndex(i, arrayLength){
  i++;
  return i%arrayLength;
}

function getPrevIndex(i, arrayLength){
  i--;
  if(i<0){
    i = arrayLength-1;
  }
  return i;
}
