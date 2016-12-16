"use strict";

app.filter('extentionFixer', ()=>{
  return (filename)=>{
    let index = filename.lastIndexOf(".");
    console.log(index);
    return filename.substring(0, index);
  };
});
