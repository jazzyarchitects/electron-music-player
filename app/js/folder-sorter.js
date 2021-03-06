self.addEventListener('message', (e)=>{
  let list = e.data;
  let foldersList = [];
  let folders = {};

  for(let i=0; i<list.length; i++) {
    let song = list[i];
    if(foldersList.indexOf(song.directory)===-1) {
      foldersList.push(song.directory);
      folders[song.directory] = [];
    }
    folders[song.directory].push({directory: song.directory, song: song.song});
  }
  let f = [];
  for(let folder of Object.keys(folders)) {
    f.push({
      directory: folder,
      songs: folders[folder]
    });
  }
  self.postMessage(f);
});
