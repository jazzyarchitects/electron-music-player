"use strict";

app.filter('extentionFixer', ()=>{
  return (filename)=>{
    let index = filename.lastIndexOf(".");
    return filename.substring(0, index);
  };
});
