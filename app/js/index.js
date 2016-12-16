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
  $scope.currentSong = {
    name: ""
  };
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
      audio = null;
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

    if(songPath===undefined && audio===null){
      return;   /*  Error assigning file  */
    }else if(audio===null){
      audio = new Audio(songPath);
    }

    if(audio!==null) {
      audio.play();
      audio.addEventListener("ended", ()=>{
        if($scope.player.repeat.toLowerCase()==="current"){
          $scope.play($scope.currentSong.index);
        }else{
          $scope.next();
        }
      });
    }
    $scope.player.playClass = PAUSE_CLASS;
    $scope.isPlaying = true;
  }

  $scope.pause = function(stop){
    $scope.player.playClass = PLAY_CLASS;
    if(audio!==null) audio.pause();
    if(stop) audio = null;
    $scope.isPlaying = false;
  }

  $scope.togglePlay = function(){
    if($scope.isPlaying){
      $scope.pause();
    }else{
      $scope.play();
    }
  }

  $scope.toggleShuffle = function(){
    if($scope.player.shuffle.toLowerCase()==="off"){
      $scope.player.shuffle = "On";
    }else{
      $scope.player.shuffle = "Off";
    }
  };

  $scope.toggleRepeat = function(){
    if($scope.player.repeat.toLowerCase()==="off"){
      $scope.player.repeat = "Current";
    }else if($scope.player.repeat.toLowerCase()==="current"){
      $scope.player.repeat = "All";
    }else{
      $scope.player.repeat = "Off";
    }
  }

  $scope.next = function(){
    if(!$scope.isPlaying) return;
    if($scope.player.repeat.toLowerCase()==="off" && $scope.currentSong.index===$scope.playListSize-1){
      $scope.pause(true)
    }else{
      $scope.currentSong.index = getNextIndex($scope.currentSong.index, $scope.playListSize);
      $scope.play($scope.currentSong.index);
    }
  }

  $scope.prev = function(){
    if(!$scope.isPlaying) return;
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
