"use strict";

app.filter('directoryNameFixer', ()=>{
  return (filename)=>{
    let index = filename.lastIndexOf("/");
    return filename.substring(index+1, filename.length);
  };
});
