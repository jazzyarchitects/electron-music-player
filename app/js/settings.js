"use strict";

let app = angular.module('MusicPlayer', ['ngMaterial']);

const path = require('path');
const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

const MusicLibrary = require(path.join(__dirname, '..', 'node', 'music-libraries'));

app.controller('SettingsController', ($scope)=>{
  $scope.musicLibraries = [];

  $scope.init = function(){
    $scope.musicLibraries = MusicLibrary.getAll();
  };

  $scope.addLibrary = function(){
    ipcRenderer.send('Dialog', 'LibrarySelect');
  }

  ipcRenderer.on('LibrarySelect-filePaths', (event, arg)=>{
    $scope.$apply(()=>{
      console.log(arg);
      arg.forEach((a)=>{
        if($scope.musicLibraries===undefined){
          $scope.musicLibraries = [];
        }
        if($scope.musicLibraries.indexOf(a)===-1){
          $scope.musicLibraries.push(a);
        }
      });
    });
  });

  $scope.close = function(){
    MusicLibrary.save($scope.musicLibraries);
    closeWindow();
  }

});
