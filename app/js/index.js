"use strict";

const path = require('path');

const readFileFromDirectory = require('./node/read-file-from-directory');
const readMediaTags = require('./node/mediatags-get-tags.js');
const assignInterfacer = require('./node/main-interfacer');
const albumSorter = require('./node/album-sorter');

// const MUSIC_LIB = "/home/jibin/Music";

let app = angular.module('MusicPlayer', ['ngMaterial']);
let audio = null;

const PLAY_CLASS = "fa-play-circle";
const PAUSE_CLASS = "fa-pause-circle";

const PLAYLIST_VIEW = 0;
const ALBUM_VIEW = 1;
const ALL_VIEW = 2;
const FOLDER_VIEW = 3;

app.controller('MainController', ($scope)=>{

  /* Basic environment setup */
  $scope.currentView = 2;

  $scope.songs = [];
  $scope.folderSorted = [];
  $scope.albumSorted = [];
  $scope.currentSongs = [];
  $scope.currentPlaylist = [];
  $scope.currentSong = {
    name: "",
    index: 0,
    imageURL: "img/footer_lodyas.png"
  };
  $scope.temp = {};
  $scope.searchQuery = "";
  $scope.isPlaying = false;
  $scope.playListSize = 0;
  $scope.player = {
    playClass: PLAY_CLASS,
    shuffle: "Off",
    repeat: "All",
    currentTime: 0,
    endTime: 0,
    duration: 0,
    volume: 100,
    playedIndices: []
  };

  // Watching currentSongs list (changes with search Query) to change playListSize required in next() and prev() functions
  $scope.$watch('currentSongs', ()=>{
    $scope.playListSize = $scope.currentSongs.length;
  });

  $scope.$watch('searchQuery', ()=>{
    $scope.currentSongs = $scope.songs.filter(liveSearchFilter($scope.searchQuery));
    if($scope.searchQuery==="" && $scope.temp.currentView!==undefined){
      $scope.changeView($scope.temp.currentView);
    }else if($scope.searchQuery!==""){
      if($scope.temp.currentView===undefined) $scope.temp.currentView = $scope.currentView;
      $scope.changeView(ALL_VIEW, true);
    }
  });

  /* Initial loading from the music directory */
  $scope.init = ()=>{
    $scope.songs = readFileFromDirectory();
    $scope.currentSongs = JSON.parse(JSON.stringify($scope.songs));
    $scope.currentPlaylist = $scope.currentSongs;
    $scope.playListSize = $scope.currentPlaylist.length;
    /*
    *  Sorting songs according to album and folder in different threads so that main thread in not blocked
    */

    // Sorting folder wise in a different worker thread
    let folderSorterWorker = new Worker(path.join(__dirname, 'js', 'folder-sorter.js'));
    folderSorterWorker.addEventListener('message', (e)=>{
      // console.log("Folder Sorted");
      // console.log(e.data);
      $scope.$apply(()=>{
        $scope.folderSorted = e.data;
      })
    });
    folderSorterWorker.postMessage($scope.songs);

    //Album Sorter cannot work in Worker. Instead using setTimeout to access node folder and run async
    setTimeout(()=>{
      albumSorter($scope.songs)
      .then((f)=>{
        // console.log("Album Sorted");
        // console.log(f);
        $scope.$apply(()=>{
          $scope.albumSorted = f;
        });
      });
    },0);

  };

  /* Function to play a selected audio file, or the previously paused*/
  $scope.play = function(parentIndex, index) {
    if(index===undefined){
      index = parentIndex;
      parentIndex = undefined;
    }
    $scope.temp.currentView = undefined;
    if($scope.isPlaying && parentIndex===undefined && index===undefined) {
      $scope.pause();
      return;
    }
    let songPath = undefined;

    // If index undefined i.e. Directly clicking play button without selecting song, then play first song else play selected song
    // For All songs list
    if(index!==undefined && parentIndex===undefined) {
      audio = null;
      $scope.currentSong.index = index;
      $scope.currentSong.name = $scope.currentPlaylist[index].file || $scope.currentPlaylist[index].song;
      $scope.currentSong.directory = $scope.currentPlaylist[index].directory;
      songPath = "file://"+$scope.currentPlaylist[index].directory + '/' + $scope.currentSong.name;
    }else if(index!==undefined && parentIndex!==undefined){
      switch($scope.currentView){
        case ALBUM_VIEW:
          $scope.play(getActualIndex(parentIndex, index, $scope.albumSorted));
        break;
        case FOLDER_VIEW:
          $scope.play(getActualIndex(parentIndex, index, $scope.folderSorted));
        break;
        default:
        break;
      }
    }else{
      if(audio===null) {
        $scope.currentSong.name = $scope.currentPlaylist[0].file;
        $scope.currentSong.index = 0;
        $scope.currentSong.directory = $scope.currentPlaylist[0].directory;
        songPath = "file://"+$scope.currentPlaylist[0].directory + '/' + $scope.currentPlaylist[0].file;
      }
    }

    if(songPath===undefined && audio===null) {
      return;   /*  Error assigning file  */
    }else if(audio===null) {
      // No audio has been paused. Either audio is never assigned or has been stopped.
      audio = new Audio(songPath);
      readMediaTags(path.join($scope.currentSong.directory, $scope.currentSong.name))
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
          if($scope.player.repeat.toLowerCase()==="current") {
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
  $scope.pause = function(stop) {
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
  $scope.togglePlay = function() {
    if($scope.isPlaying) {
      $scope.pause();
    }else{
      $scope.play();
    }
  }

  /* Toggling shuffle on or off */
  $scope.toggleShuffle = function() {
    if($scope.player.shuffle.toLowerCase()==="off") {
      $scope.player.shuffle = "On";
    }else{
      $scope.player.shuffle = "Off";
    }
    $scope.player.playedIndices = [];
  };

  /* Toggling repeat off, current or all */
  $scope.toggleRepeat = function() {
    if($scope.player.repeat.toLowerCase()==="off") {
      $scope.player.repeat = "Current";
    }else if($scope.player.repeat.toLowerCase()==="current") {
      $scope.player.repeat = "All";
    }else{
      $scope.player.repeat = "Off";
    }
  }

  /* Function to move audio to selected time when mouse leaves the seekbar */
  $scope.changePlayback = function() {
    if(audio!==null) {
      audio.currentTime = $scope.player.currentTime;
    }
  }

  /* Play the next function if repeat all or off. If off, then stop if last item. If shuffle on, get random unplayed song */
  $scope.next = function() {
    if($scope.player.repeat.toLowerCase()==="off" && (($scope.currentSong.index>=$scope.playListSize-1 && $scope.player.shuffle.toLowerCase()==="off") || ($scope.player.playedIndices.length===$scope.playListSize && $scope.player.shuffle.toLowerCase()==="on"))) {
      $scope.pause(true)
    }else{
      if($scope.player.shuffle.toLowerCase()==="off") $scope.currentSong.index = getNextIndex($scope.currentSong.index, $scope.playListSize);
      else {
        $scope.currentSong.index = getRandomIndexNotIn($scope.playListSize, $scope.player.playedIndices);
        $scope.player.playedIndices.push($scope.currentSong.index);
      }
      $scope.play($scope.currentSong.index);
    }
  }

  /* PLay previous song from the list */
  $scope.prev = function() {
    $scope.currentSong.index = getPrevIndex($scope.currentSong.index, $scope.playListSize);
    $scope.play($scope.currentSong.index);
  }

  /* Change the volume with slider */
  $scope.changeVolume = function() {
    if(audio!==null) {
      audio.volume = $scope.player.volume/100;
    }
  }

  /* Increase volume with volume up button */
  $scope.increaseVolume = function() {
    $scope.player.volume = $scope.player.volume<95?$scope.player.volume+5:100;
    $scope.changeVolume();
  }

  /* Decrease volume with volume down button */
  $scope.decreaseVolume = function() {
    $scope.player.volume = $scope.player.volume>5?$scope.player.volume-5:0;
    $scope.changeVolume();
  }

  // To seek the current media by seekTime amount. Checking the audio timing constraints
  $scope.seekMedia = function(seekTime) {
    if(audio!==null) {
      let a = audio.currentTime + seekTime;
      if(a<0) {
        a = 0;
      }else if(a>audio.duration) {
        a = audio.duration;
      }
      audio.currentTime = a;
      $scope.player.currentTime = audio.currentTime;
    }
  }

  // Selecting different views (Playlist, Album, All or Folders)
  $scope.changeView = function(view, preventReset){

    if(preventReset!==true){
      $scope.temp.currentView = undefined;
    }

    // Prevent unnecessary functions if current button is pressed again
    if(view === $scope.currentView){
      return;
    }

    $scope.currentView = view;
    let parentList = $scope.currentSongs;
    switch(view){
      case ALBUM_VIEW:
      parentList = $scope.albumSorted;
      break;
      case FOLDER_VIEW:
      parentList = $scope.folderSorted;
      break;
      case ALL_VIEW:
      $scope.currentPlaylist = $scope.currentSongs;
      default:
      return;
    }
    $scope.currentPlaylist = [];
    for(let i=0;i<parentList.length;i++){
      for(let j=0;j<parentList[i].songs.length;j++){
        $scope.currentPlaylist.push(parentList[i].songs[j]);
      }
    }
    // console.log($scope.currentPlaylist);
  }

  assignInterfacer($scope);
});


function getNextIndex(i, arrayLength) {
  i++;
  if(arrayLength<=0) {
    return -1;
  }
  return i%arrayLength;
}

function getPrevIndex(i, arrayLength) {
  i--;
  if(i<0) {
    i = arrayLength-1;
  }
  return i;
}

// Get a random index which has not been played yet
function getRandomIndexNotIn(arrayLength, usedList) {
  let a = Math.floor(Math.random()*arrayLength);
  if(usedList.indexOf(a)===-1) {
    return a;
  }else{
    return getRandomIndexNotIn(arrayLength, usedList);
  }
}

// Filter function to filter the array items by search query
function liveSearchFilter(query) {
  return function(el) {
    let regex = new RegExp(query.toLowerCase(), 'g');
    return regex.test(el.file.toLowerCase()) || regex.test(el.directory.toLowerCase());
  }
}

// In arrays like album sorted and folder sorted (those with nested objects), function to get the actual index of the songs from the list
function getActualIndex(parentIndex, index, list){
  let actualIndex = 0;
  for(let i=0;i<list.length;i++){
    if(i<parentIndex){
      actualIndex += list[i].songs.length;
    }else if(i===parentIndex){
      actualIndex += index;
      return actualIndex;
    }else{
      return actualIndex;
    }
  }
  return actualIndex;
}
