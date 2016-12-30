"use strict";


const SHORT_SKIP = 5;
const LONG_SKIP = 30;

module.exports = function($scope) {
  let electron = require('electron');
  let ipc = electron.ipcRenderer;

  ipcRenderer.on('Change', (event, arg)=>{
    switch(arg.type) {
      case 'MusicLibrary':
        $scope.$apply(()=>{
          $scope.init();
        });
        break;
      default:
        break
    }
  });

  ipc.on('Shortcut', (event, action)=>{
    console.log(action);
    switch(action) {
      case "VolumeUp":
      $scope.$apply(()=>{
        $scope.increaseVolume();
      });
      break;
      case "VolumeDown":
      $scope.$apply(()=>{
        $scope.decreaseVolume();
      });
      break;
      case "SeekShortBackward":
      $scope.seekMedia(-SHORT_SKIP);
      break;
      case "SeekShortForward":
      $scope.seekMedia(SHORT_SKIP);
      break;
      case "SeekLongBackward":
      $scope.seekMedia(-LONG_SKIP);
      break;
      case "SeekLongForward":
      $scope.seekMedia(LONG_SKIP);
      break;
      case "NextSong":
      $scope.next();
      break;
      case "PreviousSong":
      $scope.prev();
      break;
      case "Play":
      $scope.togglePlay();
      break;
      case "Stop":
      $scope.pause(true);
      break;
      default:
      console.log("No Shortcut registered");
      break;
    }
  });
};
