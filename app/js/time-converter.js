"use strict";

app.filter('timeConverter', ()=>{
  return function(seconds) {
    let mm = Math.floor(seconds/60);
    let ss = Math.floor(seconds%60);
    if(ss<10) {
      ss = "0"+ss;
    }
    if(mm<0) {
      mm = "0"+mm;
    }
    return mm+":"+ss;
  };
});
