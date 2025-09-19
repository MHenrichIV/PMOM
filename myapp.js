var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var path = require('path');
var https = require('https');

//var redirect_uri ='https://8080-04cd1205-e25c-4458-81ad-1812fe958657.europe-west1.cloudshell.dev/callback'; // debugging
//var redirect_uri = 'https://kinder-musik.ey.r.appspot.com/callback'; //production

var redirect_uri = 'http://localhost:8080/callback'; // Your redirect uri: mainly used localhost
var app = express();

/*
app.use((req, res, next) => {
  const oldWriteHead = res.writeHead;
  res.writeHead = function (statusCode, reasonPhrase, headers) {
    console.log("Response headers:", res.getHeaders());
    return oldWriteHead.apply(res, arguments);
  };
  next();
});

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' https://storage.googleapis.com; img-src 'self' data:; script-src 'self'; style-src 'self';"
  );
  next();
});
*/

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser())

/*
// include CGP Bucket as storage
*/

const {Storage} = require('@google-cloud/storage');

// Creates a client
const storage = new Storage();
 const bucketName = 'kinder-musik.appspot.com'

  async function listFiles() {
    // Lists files in the bucket
    const [files] = await storage.bucket(bucketName).getFiles();
    return files;
  }

  function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(body);
        });
    });
  }  

app.get('/fetch_local_playlists', async function(req,res){
  var localLists = {
    items:[]
  };
  let files = await listFiles().catch(console.error);
  let albums = [];
  for (const file of files){
      //console.log("this track: ", file.name);
      let album = file.name.split("/")[0];
      //console.log("this album: ", album);      
      if (!(albums.includes(album))){
        albums.push(album)
      }
    }
    console.log("albums found: ", albums);

    for (const album of albums){
        console.log("browsing album ", album);
        let dscrComplete = false,
            trckComplete = false,
            imgComplete = false;
        let tracksPath = "";
        let tracks = {
            names: [],
            url: []
        }
        let image = "/playericon-512.png", // default image
            description = {
              artist: '',
              genre: ''
            }; // default description
        for (const file of files) {           
            if (file.name.search(album) > -1){
              console.log("checking file ", file.name); 
                if(tracksPath==""){
                    tracksPath = file.publicUrl().split(encodeURI(album +"/"));
                }
                if (file.name.search(".mp3") > -1){
                    tracks.names.push(file.name.split(album  + "/")[1]);
                    //tracks.url.push(encodeURI(file.publicUrl()));
                    tracks.url.push(file.publicUrl());
                    console.log("found track ", file.name);
                } else if (file.name.search(".jpg") > -1 || file.name.search(".png") > -1){
                    //image = encodeURI(file.publicUrl());
                    image = file.publicUrl();
                    imgComplete = true
                    console.log("found image file");
                } else if (file.name.search(".json") > -1){
                    console.log("found json file");
                    console.log(file.id);
                    console.log(file.publicUrl());
                    let descriptionRaw = await fetchJSON(file.publicUrl());
                    description = JSON.parse(descriptionRaw);
                }                
            }
        }

        playlist = {
            name: album,
            tracks: tracks,
            imageUri: image,
            local: true,
            description: description
        }
        localLists.items.push(playlist);
    }
    
    if (localLists.items.length==albums.length){
        res.send(localLists);
    }
});

console.log('Listening on 8080');
app.listen(8080);