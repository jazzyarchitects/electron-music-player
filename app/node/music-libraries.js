"use strict";

const path = require('path');
const config = require(path.join(__dirname, '..', '..', 'modules', 'configurations'));

exports.getAll = function() {
  return config.get('library');
}

exports.getExcluded = function(){
  return config.get('excluded');
}

exports.save = function(libraries) {
  config.save('library', libraries);
}

exports.saveExcluded = function(libraries){
  config.save('excluded', libraries);
}
