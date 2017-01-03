"use strict";

let app = angular.module('MusicPlayer', ['ngMaterial']);

const path = require('path');
const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

const MusicLibrary = require(path.join(__dirname, '..', 'node', 'music-libraries'));

app.controller('SettingsController', ($scope)=>{
  $scope.musicLibraries = [];
  $scope.excludedLibraries = [];
  $scope.currentDirectory = -1;
  $scope.currentExcludedDirectory = -1;

  $scope.init = function() {
    $scope.musicLibraries = [];
    $scope.excludedLibraries = [];
    $scope.musicLibraries = MusicLibrary.getAll();
    $scope.excludedLibraries = MusicLibrary.getExcluded();
  };

  $scope.addLibrary = function() {
    ipcRenderer.send('Dialog', 'LibrarySelect');
  }

  $scope.addExcludedLibrary = function(){
    ipcRenderer.send('Dialog', 'ExcludedLibrarySelect');
  }

  ipcRenderer.on('LibrarySelect-filePaths', (event, arg)=>{
    $scope.$apply(()=>{
      arg.forEach((a)=>{
        if($scope.musicLibraries===undefined) {
          $scope.musicLibraries = [];
        }
        if($scope.musicLibraries.indexOf(a)===-1) {
          $scope.musicLibraries.push(a);
        }
      });
    });
  });

  ipcRenderer.on('ExcludedLibrarySelect-filePaths', (event, arg)=>{
    $scope.$apply(()=>{
      arg.forEach((a)=>{
        if($scope.excludedLibraries===undefined) {
          $scope.excludedLibraries = [];
        }
        if($scope.excludedLibraries.indexOf(a)===-1) {
          $scope.excludedLibraries.push(a);
        }
      });
    });
  });

  $scope.setCurrent = function(index) {
    if($scope.currentDirectory!==index) {
      $scope.currentDirectory = index;
    }else{
      $scope.currentDirectory = -1;
    }
  }

  $scope.setCurrentExcluded = function(index){
    if($scope.currentExcludedDirectory!==index) {
      $scope.currentExcludedDirectory = index
    }else{
      $scope.currentExcludedDirectory = -1;
    }
  }

  $scope.removeDirectory = function() {
    if($scope.currentDirectory===-1) {
      return;
    }
    let index = $scope.currentDirectory;
    $scope.musicLibraries.splice(index, 1);
    $scope.currentDirectory = -1;
  }

  $scope.removeExcludedDirectory = function() {
    if($scope.currentExcludedDirectory===-1) {
      return;
    }
    let index = $scope.currentExcludedDirectory;
    $scope.excludedLibraries.splice(index, 1);
    $scope.currentEcludedDirectory = -1;
  }

  $scope.close = function() {
    MusicLibrary.save($scope.musicLibraries);
    MusicLibrary.saveExcluded($scope.excludedLibraries);
    ipcRenderer.send('Change', {type: 'MusicLibrary', data: $scope.musicLibraries});
    closeWindow();
  }
});
