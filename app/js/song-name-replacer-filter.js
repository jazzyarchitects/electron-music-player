"use strict";

app.filter('extentionFixer', ()=>{
  return (filename)=>{
    if(!filename) return "";
    let index = filename.lastIndexOf(".");
    if(index===-1) {
      return filename;
    }
    return filename.substring(0, index);
  };
});
