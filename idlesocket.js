var io = require("socket.io");
var mpdObj = require('./node-mpd');
var json = require('json');

var mpd = new mpdObj('192.168.189.130',6600);

var options = { debug:       true,
                version:     "auto",
                origin:      "*",
                subprotocol: null }

var idlesocket = new io.Socket();
var port = 10001;
var host = "192.168.189.128";

function sendInfo(r,info) {
   var f = function(info) {
      var infoJSON = json.parse(info);
      infoJSON.changed = r.changed;
      idlesocket.broadcast(json.stringify(infoJSON));
   }

   return f;
}

idlesocket.addListener("listening",function() {
   console.log("IdleServer is listening on port " + port);

   mpd.send("idle",function idleMsgHandler(r) {
      //check for what has changed
      switch(r.changed) {
      case "database":
         //TODO
         //optionally update the database
         break;
      case "update":
         //nothing to do, really
         break;
      case "stored_playlist":
         //TODO
         //update playlists
         break;
      case "playlist":
         //update the playlist info
         mpd.send("playlistinfo",sendInfo(r,info));
         break;
      case "player":
         //update the status of the player
         mpd.send("status",sendInfo(r,info));
         break;
      case "mixer":
         //update status
         mpd.send("status",sendInfo(r,info));
         break;
      case "output":
         //TODO
         //check outputs
         break;
      case "options":
         //update the status again
         mpd.send("status",sendInfo(r,info));
         break;
      }
      
      mpd.send("idle",idleMsgHandler(r));
   });
});

idlesocket.addListener("connection",function(connection) {
   console.log("Got a connection");
   connection.send("OK IDLESOCKET");
});



idlesocket.listen(port,host);
