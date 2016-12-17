"use strict";

const fs = require('fs');
const path = require('path');
const id3 = require('id3-parser');
const jsmediatags = require('jsmediatags');

const readFileFromDirectory = require('./node/read-file-from-directory');
const readMediaTags = require('./node/mediatags-get-tags.js');

const MUSIC_LIB = "/home/jibin/Music";

let app = angular.module('MusicPlayer', ['ngMaterial']);
var audio = null;

const PLAY_CLASS = "fa-play-circle";
const PAUSE_CLASS = "fa-pause-circle";

app.controller('MainController', ($scope)=>{

  /* Basic environment setup */
  $scope.songs = [];
  $scope.currentSong = {
    name: "",
    imageURL: "img/footer_lodyas.png"
  };
  $scope.isPlaying = false;
  $scope.playListSize = 0;
  $scope.player = {
    playClass: PLAY_CLASS,
    shuffle: "Off",
    repeat: "Current",
    currentTime: 0,
    endTime: 0,
    duration: 0,
    volume: 100,
    playedIndices: []
  };


  /* Initial loading from the music directory */
  $scope.init = ()=>{
    $scope.songs = readFileFromDirectory(MUSIC_LIB);
    $scope.playListSize = $scope.songs.length;
  };

  /* Function to play a selected audio file, or the previously paused*/
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
      readMediaTags(path.join(MUSIC_LIB, $scope.currentSong.name))
      .then((tag)=>{
        $scope.currentSong.album = tag.album;
        $scope.currentSong.artist = tag.artist;
        $scope.currentSong.genre = tag.genre;
        $scope.currentSong.title = tag.title;
        $scope.currentSong.year = tag.year;
        $scope.currentSong.publisher = tag.publisher;
        $scope.currentSong.imageURL = tag.imageURL;
      });

      /* Get current audio properties */
      audio.addEventListener('loadedmetadata', function() {
        $scope.$apply(()=>{
          $scope.player.duration = audio.duration;
          $scope.player.currentTime = audio.currentTime;
          $scope.player.endTime = audio.duration;
          audio.volume = $scope.player.volume/100;
          audio.play();
        });
      });

      /* Update seekbar as the song is progressing */
      audio.addEventListener('timeupdate', ()=>{
        $scope.$apply(()=>{
          $scope.player.currentTime = audio.currentTime;
        });
      });

      /* Listener for when a song has finished */
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

  /* To pause the audio file.  */
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

  /* Function to change functionality of play/pause button */
  $scope.togglePlay = function(){
    if($scope.isPlaying){
      $scope.pause();
    }else{
      $scope.play();
    }
  }

  /* Toggling shuffle on or off */
  $scope.toggleShuffle = function(){
    if($scope.player.shuffle.toLowerCase()==="off"){
      $scope.player.shuffle = "On";
    }else{
      $scope.player.shuffle = "Off";
    }
    $scope.player.playedIndices = [];
  };

  /* Toggling repeat off, current or all */
  $scope.toggleRepeat = function(){
    if($scope.player.repeat.toLowerCase()==="off"){
      $scope.player.repeat = "Current";
    }else if($scope.player.repeat.toLowerCase()==="current"){
      $scope.player.repeat = "All";
    }else{
      $scope.player.repeat = "Off";
    }
  }

  /* Function to move audio to selected time when mouse leaves the seekbar */
  $scope.changePlayback = function(){
    if(audio!==null){
      audio.currentTime = $scope.player.currentTime;
    }
  }

  /* Play the next function if repeat all or off. If off, then stop if last item. If shuffle on, get random unplayed song */
  $scope.next = function(){
    if($scope.player.repeat.toLowerCase()==="off" && (($scope.currentSong.index>=$scope.playListSize-1 && $scope.player.shuffle.toLowerCase()==="off") || ($scope.player.playedIndices.length===$scope.playListSize && $scope.player.shuffle.toLowerCase()==="on"))){
      $scope.pause(true)
    }else{
      if(!$scope.isPlaying) return;
      if($scope.player.shuffle.toLowerCase()==="off") $scope.currentSong.index = getNextIndex($scope.currentSong.index, $scope.playListSize);
      else {
        $scope.currentSong.index = getRandomIndexNotIn($scope.playListSize, $scope.player.playedIndices);
        $scope.player.playedIndices.push($scope.currentSong.index);
      }
      $scope.play($scope.currentSong.index);
    }
  }

  /* PLay previous song from the list */
  $scope.prev = function(){
    if(!$scope.isPlaying) return;
    $scope.currentSong.index = getPrevIndex($scope.currentSong.index, $scope.playListSize);
    $scope.play($scope.currentSong.index);
  }

  /* Change the volume with slider */
  $scope.changeVolume = function(){
    if(audio!==null){
      audio.volume = $scope.player.volume/100;
    }
  }

  /* Increase volume with volume up button */
  $scope.increaseVolume = function(){
    $scope.player.volume = $scope.player.volume<95?$scope.player.volume+5:100;
    $scope.changeVolume();
  }

  /* Decrease volume with volume down button */
  $scope.decreaseVolume = function(){
    $scope.player.volume = $scope.player.volume>5?$scope.player.volume-5:0;
    $scope.changeVolume();
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

function getRandomIndexNotIn(arrayLength, usedList){
  let a = Math.floor(Math.random()*arrayLength);
  if(usedList.indexOf(a)===-1){
    return a;
  }else{
    return getRandomIndexNotIn(arrayLength, usedList);
  }
}
