"use strict";

let app = angular.module('MusicPlayer', ['ngMaterial']);

const path = require('path');
const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

const MusicLibrary = require(path.join(__dirname, '..', 'node', 'music-libraries'));

app.controller('SettingsController', ($scope)=>{
  $scope.musicLibraries = [];
  $scope.currentDirectory = "";

  $scope.init = function() {
    $scope.musicLibraries = [];
    let a = MusicLibrary.getAll();
    for(let p of a){
      $scope.musicLibraries.push({path: p});
    }
  };

  $scope.addLibrary = function() {
    ipcRenderer.send('Dialog', 'LibrarySelect');
  }

  ipcRenderer.on('LibrarySelect-filePaths', (event, arg)=>{
    $scope.$apply(()=>{
      console.log(arg);
      arg.forEach((a)=>{
        if($scope.musicLibraries===undefined) {
          $scope.musicLibraries = [];
        }
        if($scope.musicLibraries.indexOf(a)===-1) {
          $scope.musicLibraries.push({path: a});
        }
      });
    });
  });

  $scope.setCurrent = function(index) {
    for(let i=0;i<$scope.musicLibraries.length;i++){
        $scope.musicLibraries[i].isSelected = false;
      }
    if($scope.currentDirectory!==$scope.musicLibraries[index].path) {
      $scope.currentDirectory = $scope.musicLibraries[index];
      $scope.musicLibraries[index].isSelected = true;
    }else{
      $scope.currentDirectory = '';
      $scope.musicLibraries[index].isSelected = false;
    }
  }

  $scope.removeDirectory = function() {
    if($scope.currentDirectory==='') {
      return;
    }
    let index = $scope.musicLibraries.indexOf($scope.currentDirectory);
    $scope.musicLibraries.splice(index, 1);
    $scope.currentDirectory = '';
  }

  $scope.close = function() {
    MusicLibrary.save($scope.musicLibraries);
    ipcRenderer.send('Change', {type: 'MusicLibrary', data: $scope.musicLibraries});
    closeWindow();
  }
});
