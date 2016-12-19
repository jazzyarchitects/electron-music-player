"use strict";

const id3 = require('id3-parser');

module.exports = function(filePath) {
  return new Promise((resolve, reject)=>{
    let file = fs.readFileSync(filePath);
    id3.parse(file)
      .then((tag)=>{
        tag.imageURL = 'data:' + tag.image.mime + ';base64,' + tag.image.data.toString('base64');
        delete tag.image;
        resolve(tag);
      });
  });
}
