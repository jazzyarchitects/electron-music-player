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
    repeat: "Current",
    currentTime: 0,
    endTime: 0,
    duration: 0
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
      audio.addEventListener('loadedmetadata', function() {
        $scope.$apply(()=>{
          $scope.player.duration = audio.duration;
          $scope.player.currentTime = audio.currentTime;
          $scope.player.endTime = audio.duration;
          console.log(audio);
        });
      });
      audio.addEventListener('timeupdate', ()=>{
        $scope.$apply(()=>{
          $scope.player.currentTime = audio.currentTime;
        });
      });
      audio.addEventListener("ended", ()=>{
        setTimeout(()=>{
          if($scope.player.repeat.toLowerCase()==="current"){
            $scope.play($scope.currentSong.index);
          }else{
            $scope.next();
          }
        }, 2000);
      });
    }

    if(audio!==null) {
      audio.play();
    }
    $scope.player.playClass = PAUSE_CLASS;
    $scope.isPlaying = true;
  }

  $scope.pause = function(stop){
    $scope.player.playClass = PLAY_CLASS;
    if(audio!==null) audio.pause();
    if(stop===true) {
      audio = null;
      $scope.$apply(()=>{
        $scope.player.currentTime = 0;
        $scope.player.duration = 0;
        $scope.player.endTime = 0;
        $scope.currentSong.name = "";
      });
    }
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

  $scope.changePlayback = function(){
    if(audio!==null){
      audio.currentTime = $scope.player.currentTime;
    }
  }

  $scope.next = function(){
    if($scope.player.repeat.toLowerCase()==="off" && $scope.currentSong.index>=$scope.playListSize-1){
      $scope.pause(true)
    }else{
      if(!$scope.isPlaying) return;
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
