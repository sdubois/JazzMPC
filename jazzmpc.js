var routes = new require('routes').Router();
var http = require('http');
var fs = require('fs');
var mpdSocket = require('mpdsocket');
var qs = require('querystring');
var io = require("socket.io");

var mpd = new mpdSocket('192.168.189.130',6600);

mpd.on('connect',function() {
	//batch establish functions
	var simpleFuncList = ['clearerror','currentsong','playlist','stats','status',
	                      'play','pause','replay_gain_status','next','previous','stop',
	                      'clear','playlistinfo','shuffle','listplaylists','listall',
	                      'listallinfo','lsinfo','update','rescan','disableoutput',
	                      'enableoutput','outputs','commands','notcommands',
	                      'tagtypes','urlhandlers','decoders','channels','readmessages',
	                      'consume','crossfade','mixrampdb','mixrampdelay',
	                      'random','repeat','setvol','single','replay_gain_mode',
	                      'pause','play','playid','password','add','delete','deleteid',
	                      'playlistinfo','playlistid','plchanges','plchangesposid',
	                      'shuffle','listplaylist','listplaylistinfo','load',
	                      'playlistclear','rm','save','listall','listallinfo',
	                      'lsinfo','update','rescan','subscribe','unsubscribe',
	                      'seek','seekid','addid','swap','swapid','playlistid',
	                      'playlistdelete','playlistmove','rename','count','find',
	                      'findadd','list','search','sendmessage'];

	for (var i in simpleFuncList) {
		mpdfn(simpleFuncList[i]);
	}

	function sendFile(path) {
		var res = this;
		fs.readFile(__dirname + path,function(err,data) {
			if (err) {
				res.writeHead(404);
				res.end("Not found\n");
			} else {
				res.writeHead(200, { 'Content-Type': 'text/html' });
				res.write(data,'utf-8');
				res.end();
			}
		});
	}

	function _simpleWrite(req) {
	    return function(param) {
		var res = this;
		if (!(param)) {
		        mpd.send(req,function(r) {
			   if (typeof(r) == 'object') {
			      res.end(JSON.stringify(r) + "\n");
			   } else {
			      res.end(r + "\n");
			   }
			});
		} else {
			var query = req + " ";
			for (var i in param) {
				query += decodeURI(param[i]) + " ";
			}
	
			mpd.send(query,function(r) {
			   if (typeof(r) == 'object') {
			      res.end(JSON.stringify(r) + "\n");
			   } else {
			      res.end(r + "\n");
			   }
			});
		}
	    }
	}
	
	function mpdfn(req) {
		var evalString = "var mpd_" + req + ' = _simpleWrite';
		evalString += '("' + req + '");';
		eval(evalString);
	
		var route = "/mpd/" + req;
		routes.addRoute(route,eval("mpd_" + req));
	}
	
	//initialize server
	var jazzmpc = http.createServer(function(req,res) {
		console.log(req.url);
		var routed = routes.match(req.url);
		if (routed) {
			//acceptable request
			res.writeHead(200, {'Content-Type': 'text/plain'});
			if (req.method == "POST") {
				//we have parameters we need to pass
				var postData = "";
				req.on('data',function(data) {
					postData += data;
				});
				req.on('end',function() {
					var postParams = qs.parse(postData);
					routed.fn.call(res,postParams);
				});
			}
		} else if (req.url == "/index.html") {
			sendFile.call(res,"/index.html");
		} else {
			//unacceptable request
			res.writeHead(404);
			res.end("Not found");
		}
	});
	
	jazzmpc.listen(80);
/*
	//initialize IdleSocket
	var mpd2 = new mpdSocket('192.168.189.130','6600');
	var idlesocket = io.listen(jazzmpc);
	var broadcast = function(){ };	

	function idleLoop() {
		console.log("In idle loop");
		mpd2.send("idle",function idleMsgHandler(r) {
			broadcast(r);
			console.log(r);
			mpd2.send("idle",idleMsgHandler);
		});
	}
	
	mpd2.on('connect',idleLoop);
	
	idlesocket.on("connection",function(connection) {
	   connection.send("OK IDLESOCKET");
	   broadcast = function(msg) {
	   	connection.broadcast(msg);
	   }
	});
*/
});
