/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var path = require('path');
var https = require('https');

//var client_id = 'bd76c2b5922c4ed2a056be4c03573873'; // Your client id
//var client_secret = '974cd486596d4528840c9ab32470e70c'; // Your secret

//var redirect_uri ='https://8080-04cd1205-e25c-4458-81ad-1812fe958657.europe-west1.cloudshell.dev/callback'; // debugging
//var redirect_uri = 'https://kinder-musik.ey.r.appspot.com/callback'; //production

//var redirect_uri = 'http://Diskstation:8888/callback'; // running on Diskstation
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri: mainly used localhost
//var redirect_uri = 'http://192.168.0.130:8888/callback'; // Your redirect uri: diskstation MH
//var redirect_uri = 'http://192.168.0.147:8888/callback'; // Your redirect uri: diskstation MS
//var redirect_uri = 'http://192.168.0.94:8888/callback'; // Your redirect uri: PC MH

/*
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */

/*
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';
*/
var app = express();

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

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser())

/*
app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-top-read playlist-read-collaborative playlist-modify-private user-read-private user-read-birthdate user-read-email playlist-read-private streaming user-modify-playback-state user-read-playback-state user-read-currently-playing';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;
        
        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };
        

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});
*/

// include CGP Bucket as storage
// Imports the Google Cloud client library
const {Storage} = require('@google-cloud/storage');

// Creates a client
const storage = new Storage();

/*
async function listBuckets() {
  // Lists all buckets in the current project

  const [buckets] = await storage.getBuckets();
  console.log('Buckets:');
  buckets.forEach(bucket => {
    console.log(bucket.name);
  });
}
listBuckets().catch(console.error);
*/

 const bucketName = 'kinder-musik.appspot.com'

  async function listFiles() {
    // Lists files in the bucket
    const [files] = await storage.bucket(bucketName).getFiles();

    //console.log('Files:');
    //files.forEach(file => {
    //  console.log(file.name);
    //});
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
      console.log("this album: ", album);      
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
        let image = "",
            description="";
        for (const file of files) {            
            if (file.name.search(album) > -1){
                if(tracksPath==""){
                    tracksPath = file.publicUrl().split(encodeURI(album +"/"));
                }
                if (file.name.search(".mp3") > -1){
                    tracks.names.push(file.name.split(album  + "/")[1]);
                    tracks.url.push(encodeURI(file.publicUrl()));
                } else if (file.name.search(".jpg") > -1){
                    image = encodeURI(file.publicUrl());
                    imgComplete = true
                } else if (file.name.search(".json") > -1){
                    console.log("found json file");
                    console.log(file.id);
                    console.log(file.publicUrl());
                    let descriptionRaw = await fetchJSON(encodeURI(file.publicUrl()));
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

/*
app.get('/fetch_local_playlists', function(req,res){
  var localLists = {
    items:[]
  };
      emptyItem = {
        name: "",
        local: true,
        tracks: []
      }
  //var directoryPath = path.join(__dirname, 'public/music');
  var directoryPath = 'https://console.cloud.google.com/storage/browser/kinder-musik.appspot.com';
  fs.readdir(directoryPath, function (err, folders) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    console.log(folders);
    ii = 0;
    kk = 0;
    let invalidFolders = 0;
    folders.forEach(function (folder) {
        // Do whatever you want to do with the file      
      if (folder[0] == '.'){
        invalidFolders++;
      }else {
        console.log(folder);        
        var tracksPath = path.join(directoryPath, folder);
        fs.readdir(tracksPath, function (err, tracks) {
          if (err) {
            return console.log('Unable to scan directory: ' + err);
          }
          for (ii=0; ii < tracks.length; ii++){
            if (tracks[ii].search(".json")>0){
              var descriptionIndex = ii;
              tracks.splice(descriptionIndex,1);
              //console.log(tracks);
            }
          }
          for (ii=0; ii < tracks.length; ii++){
            if (tracks[ii].search(".jpg")>0){
              var imageIndex = ii;
            }            
          }
          var image = tracks.splice(imageIndex,1)[0],
              imageUri = directoryPath + folder + '/' + image,
              description;             

          //fs.readFile('public/music/' + folder + '/description.json', 'utf8', (err, jsonString) => {
            fs.readFile(directoryPath + folder + '/description.json', 'utf8', (err, jsonString) => {
                if (err) {
                    console.log("File read failed:", err)
                    return
                }
                console.log('File data:', jsonString)
                description = JSON.parse(jsonString);
          var playList = {
            name: folder,
            imageUri: imageUri,
            image: image,
            tracks: tracks,
            tracksPath: directoryPath + folder + '/',
            local: true,
            description: description
        };
        localLists.items.push(playList);
        if (localLists.items.length==folders.length-invalidFolders){
          res.send(
          localLists  
          );}
            })
          //console.log(tracks);

        });
      } 
    });
  });
});
*/

console.log('Listening on 8888');
app.listen(8888);