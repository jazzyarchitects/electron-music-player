"use strict";

const path = require('path');

const readFileFromDirectory = require('./node/read-file-from-directory');
const readMediaTags = require('./node/mediatags-get-tags.js');
const assignInterfacer = require('./node/main-interfacer');
const albumSorter = require('./node/album-sorter');
const Playlist = require('./node/playlist');

// const MUSIC_LIB = "/home/jibin/Music";

let app = angular.module('MusicPlayer', ['ngMaterial']);
let audio = null;

const PLAY_CLASS = "fa-play-circle";
const PAUSE_CLASS = "fa-pause-circle";

const PLAYLIST_VIEW = 0;
const ALBUM_VIEW = 1;
const ALL_VIEW = 2;
const FOLDER_VIEW = 3;
app.config(['$compileProvider', function($compileProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension|file):/);
}]);

app.controller('MainController', ($scope, $mdDialog, $timeout)=>{
  /* Basic environment setup */
  $scope.currentView = 2;

  $scope.songs = [];
  $scope.folderSorted = [];
  $scope.albumSorted = [];
  $scope.currentSongs = [];
  $scope.playlists = [];
  $scope.currentPlaylist = [];
  $scope.currentSong = {
    name: "",
    index: 0,
    imageURL: "img/footer_lodyas.png",
    next: ""
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
    songCount: 0,
    albumCount: 0,
    folderCount: 0,
    playedIndices: []
  };

  // Watching currentSongs list (changes with search Query) to change playListSize required in next() and prev() functions
  // Causing trouble as this is being called after other functions are done using the old values :(
  $scope.$watch('currentPlaylist', (newValue, oldValue)=>{
    if($scope.currentPlaylist === undefined) {
      return;
    }
    if((oldValue===undefined || oldValue.length<=0) && (newValue.length>0)){
      $scope.currentSong.next = newValue[0].song;
    }
    $scope.playListSize = $scope.currentPlaylist.length;
  }, true);

  $scope.$watch('searchQuery', ()=>{
    $scope.currentSongs = $scope.songs.filter(liveSearchFilter($scope.searchQuery));
    if($scope.searchQuery==="" && $scope.temp.currentView!==undefined) {
      $scope.changeView($scope.temp.currentView);
    }else if($scope.searchQuery!=="") {
      if($scope.temp.currentView===undefined) $scope.temp.currentView = $scope.currentView;
      $scope.changeView(ALL_VIEW, true);
    }
  });

  /* Initial loading from the music directory */
  $scope.init = ()=>{
    $scope.songs = readFileFromDirectory();
    $scope.player.songCount = $scope.songs.length;
    $scope.currentSongs = JSON.parse(JSON.stringify($scope.songs));
    $scope.currentPlaylist = JSON.parse(JSON.stringify($scope.currentSongs));
    if($scope.currentSong.next==="") {
      $scope.currentSong.next = $scope.currentSongs[0].song;
    }
    $scope.playListSize = $scope.currentPlaylist.length;
    /*
    *  Sorting songs according to album and folder in different threads so that main thread in not blocked
    */

    // Sorting folder wise in a different worker thread
    let folderSorterWorker = new Worker(path.join(__dirname, 'js', 'folder-sorter.js'));
    folderSorterWorker.addEventListener('message', (e)=>{
      $scope.player.folderCount = e.data.length;
      $scope.$apply(()=>{
        $scope.folderSorted = e.data;
      })
    });
    folderSorterWorker.postMessage($scope.songs);

    // Album Sorter cannot work in Worker. Instead using setTimeout to access node folder and run async
    setTimeout(()=>{
      albumSorter($scope.songs)
      .then((f)=>{
        $scope.player.albumCount = f.length;
        $scope.$apply(()=>{
          $scope.albumSorted = f;
        });
      });
    }, 0);

    Playlist.getAll()
    .then((playlists)=>{
      $scope.$apply(()=>{
        if(playlists===undefined){
          $scope.playlists = [];
          return;
        }
        $scope.playlists = playlists;
      })
    });
  };

  /* Function to play a selected audio file, or the previously paused*/
  $scope.play = function(parentIndex, index) {
    if(index===undefined) {
      index = parentIndex;
      parentIndex = undefined;
    }
    $scope.temp.currentView = undefined;
    if($scope.isPlaying) {
      $scope.pause();
    }
    let songPath = undefined;

    // If index undefined i.e. Directly clicking play button without selecting song, then play first song else play selected song
    // For All songs list

    if($scope.currentPlaylist === undefined || $scope.currentPlaylist.length<=0) {
      $scope.currentPlaylist = $scope.songs;
    }
    if(index!==undefined && parentIndex===undefined) {
      if(audio!==null) {
        audio.pause();
      }
      audio = null;
      $scope.currentSong.index = index;
      $scope.currentSong.name = $scope.currentPlaylist[index].song;
      $scope.currentSong.imageURL = undefined;
      $scope.currentSong.directory = $scope.currentPlaylist[index].directory;
      songPath = "file://"+$scope.currentPlaylist[index].directory + '/' + $scope.currentSong.name;
    }else if(index!==undefined && parentIndex!==undefined) {
      switch($scope.currentView) {
        case ALBUM_VIEW:
          $scope.currentPlaylist = JSON.parse(JSON.stringify($scope.albumSorted[parentIndex].songs));
          // $scope.playListSize = $scope.albumSorted[parentIndex].songs.length;
          break;
        case FOLDER_VIEW:
          $scope.currentPlaylist = JSON.parse(JSON.stringify($scope.folderSorted[parentIndex].songs));
          // $scope.playListSize = $scope.folderSorted[parentIndex].songs.length;
          break;
        case ALL_VIEW:
          if($scope.searchQuery==="" || $scope.searchQuery==='' || $scope.searchQuery===undefined || $scope.searchQuery===null) {
            $scope.currentPlaylist = JSON.parse(JSON.stringify($scope.currentSongs));
            // $scope.playListSize = $scope.currentPlaylist.length;
            break;
          }else{
            $scope.currentPlaylist = [];
            $scope.currentPlaylist.push($scope.currentSongs[index]);
            $scope.playListSize = 1;
            index = 0;
            break;
          }
        default:
          break;
      }
      return $scope.play(index);
    }else{
      if(audio===null) {
        $scope.currentSong.name = $scope.currentPlaylist[0].song;
        $scope.currentSong.index = 0;
        $scope.currentSong.directory = $scope.currentPlaylist[0].directory;
        songPath = "file://"+$scope.currentPlaylist[0].directory + '/' + $scope.currentPlaylist[0].song;
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
          if(audio!==null) {
            $scope.player.currentTime = audio.currentTime;
          }
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

    if($scope.player.shuffle.toLowerCase()==="off") {
      $scope.playListSize = $scope.currentPlaylist.length;
      let i = getNextIndex($scope.currentSong.index, $scope.playListSize);
      if(i>=0) {
        $scope.currentSong.next = $scope.currentPlaylist[i].song;
      }else{
        $scope.currentSong.next = $scope.currentSong.name;
      }
    }else{
      $scope.currentSong.next = "Surprise Surprise :)";
    }

    if($scope.player.repeat.toLowerCase()==="current") {
      $scope.currentSong.next = $scope.currentSong.name;
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
      // First check is already in digest cycle before $apply
      if(!$scope.$$phase) {
        $scope.$apply(()=>{
          $scope.player.currentTime = 0;
          $scope.player.duration = 0;
          $scope.player.endTime = 0;
          $scope.currentSong.name = "";
          $scope.currentSong.index = -1;
          $scope.currentSong.imageURL = undefined;
          $scope.currentSong.next = $scope.songs[0].song;
        });
      }else{
        $scope.player.currentTime = 0;
        $scope.player.duration = 0;
        $scope.player.endTime = 0;
        $scope.currentSong.name = "";
        $scope.currentSong.index = -1;
        $scope.currentSong.imageURL = undefined;
        $scope.currentSong.next = $scope.songs[0].song;
      }
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
  $scope.changeView = function(view, preventReset) {
    if(preventReset!==true) {
      $scope.temp.currentView = undefined;
    }
    // Prevent unnecessary functions if current button is pressed again
    if(view === $scope.currentView) {
      return;
    }
    $scope.currentView = view;
  }

  $scope.addToCurrentPlaylist = function(parentIndex, index) {
    if(parentIndex!==undefined && index===undefined) {
      index = parentIndex;
      parentIndex = undefined;
    }

    if($scope.currentPlaylist===undefined || $scope.currentPlaylist.length<=0){
      $scope.currentPlaylist = [];
    }

    // Need to use $parent.$parent.$index for album and folder. I guess a single $parent refers to menu itme
    switch($scope.currentView) {
      case ALBUM_VIEW:
        $scope.currentPlaylist.push($scope.albumSorted[parentIndex].songs[index]);
        break;
      case ALL_VIEW:
        $scope.currentPlaylist.push($scope.currentSongs[index]);
        break;
      case FOLDER_VIEW:
        $scope.currentPlaylist.push($scope.folderSorted[parentIndex].songs[index]);
        break;
      default:
        break;
    }
    return;
  };

  $scope.playFromPlaylist = function(playlistIndex, index){
    $scope.currentPlaylist = $scope.playlists[playlistIndex].songs;
    $scope.play(index);
  };

  let parent = $scope;
  $scope.showCurrentPlayist = function($event) {
    $mdDialog.show({
      controller: ($scope, $mdDialog)=> {
        $scope.cancel= ()=>{
          $mdDialog.cancel()
        };
        $scope.player = {};
        $scope.player.playlistName = "";
        $scope.isSaving = false;
        $scope.currentSong = parent.currentSong;
        $scope.songs = parent.currentPlaylist;
        $scope.playing = parent.isPlaying;

        $scope.play = function(index) {
          if(parent.isPlaying) {
            $scope.pause();
          }
          parent.play(index);
          $scope.playing = true;
          $scope.currentSong = parent.currentSong;
        };

        $scope.pause = function(stop) {
          parent.pause(stop);
          $scope.playing = false;
          $scope.reload();
        };

        $scope.delete = function(index) {
          if(index===$scope.currentSong.index) {
            $scope.pause(true);
          }
          $scope.songs.splice(index, 1);
          if(index<$scope.currentSong.index) {
            parent.currentSong.index--;
          }
          $scope.currentSong = parent.currentSong;
          parent.playListSize = $scope.songs.length;
          $scope.currentSong.next = $scope.songs[getNextIndex($scope.currentSong.index, $scope.songs.length)].song;
        };

        $scope.reload = function() {
          $scope.currentSong = parent.currentSong;
          $scope.playing = parent.isPlaying;
          if($scope.songs===undefined || $scope.songs.length<=0) {
            $scope.songs = parent.currentPlaylist;
          }
        }

        $scope.next = function() {
          parent.next();
          $scope.reload();
        };

        $scope.prev = function() {
          parent.prev();
          $scope.reload();
        };

        $scope.togglePlay = function() {
          parent.togglePlay();
          $scope.reload();
        };

        $scope.clear = function() {
          $scope.pause(true);
          $scope.songs = [];
          parent.currentSong.name = "";
          parent.currentSong.index = -1;
          parent.currentSong.imageURL = "";
          parent.currentSong.next = undefined;
          parent.currentPlaylist = undefined;
          $scope.reload();
          $scope.cancel();
        };

        $scope.savePlaylist = function(){
          if(!$scope.isSaving){
            return $scope.isSaving = true;
          }else{
            if($scope.playlistName===''){
              return;
            }
            let pls = Playlist.save($scope.player.playlistName, $scope.songs);
            parent.playlists.push(pls);
            $scope.isSaving = false;
          }
        };
      },
      targetEvent: $event,
      controllerAs: 'Player',
      templateUrl: 'pages/playlist.html',
      clickOutsideToClose: true
    });
  };
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
    return regex.test(el.song.toLowerCase()) || regex.test(el.directory.toLowerCase());
  }
}

// In arrays like album sorted and folder sorted (those with nested objects), function to get the actual index of the songs from the list
function getActualIndex(parentIndex, index, list) {
  let actualIndex = 0;
  for(let i=0; i<list.length; i++) {
    if(i<parentIndex) {
      actualIndex += list[i].songs.length;
    }else if(i===parentIndex) {
      actualIndex += index;
      return actualIndex;
    }else{
      return actualIndex;
    }
  }
  return actualIndex;
}
