"use strict";

const fs = require('fs');
const path = require('path');
const id3 = require('id3-parser');
// const jsmediatags = require('jsmediatags');
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}


const MUSIC_LIB = "/home/jibin/Music";

let app = angular.module('MusicPlayer', ['ngMaterial']);
var audio = null;

const PLAY_CLASS = "fa-play-circle";
const PAUSE_CLASS = "fa-pause-circle";

app.controller('MainController', ($scope)=>{
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

      /* Get current audio metadata */
      // let fileBuffer = fs.readFileSync(path.join(MUSIC_LIB, $scope.currentSong.name));
      // id3.parse(fileBuffer)
      // .then(tag=>{
      //   $scope.currentSong.album = tag.album;
      //   $scope.currentSong.artist = tag.artist;
      //   $scope.currentSong.genre = tag.genre;
      //   $scope.currentSong.title = tag.title;
      //   $scope.currentSong.year = tag.year;
      //   $scope.currentSong.publisher = tag.publisher;
      //   $scope.currentSong.image = tag.image;
      //   // $scope.currentSong.imageURL = 'data:' + tag.image.mime + ';base64,' + Base64.decode(tag.image.data.toString());
      //   // console.log(tag.image.data.toString());
      //   console.log(tag);
      // });
      jsmediatags.read(path.join(MUSIC_LIB, $scope.currentSong.name), {
        onSuccess: (tag)=>{
          console.log(tag);
        },
        onError: (error)=>{
          console.log(error);
        }
      })
      /* Get current audio properties */
      audio.addEventListener('loadedmetadata', function() {
        $scope.$apply(()=>{
          $scope.player.duration = audio.duration;
          $scope.player.currentTime = audio.currentTime;
          $scope.player.endTime = audio.duration;
          audio.volume = $scope.player.volume/100;
          console.log(audio);
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
    $scope.player.playedIndices = [];
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

  $scope.prev = function(){
    if(!$scope.isPlaying) return;
    $scope.currentSong.index = getPrevIndex($scope.currentSong.index, $scope.playListSize);
    $scope.play($scope.currentSong.index);
  }

  $scope.changeVolume = function(){
    if(audio!==null){
      audio.volume = $scope.player.volume/100;
    }
  }

  $scope.increaseVolume = function(){
    $scope.player.volume = $scope.player.volume<95?$scope.player.volume+5:100;
    $scope.changeVolume();
  }

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
