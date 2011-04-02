var routes = new require('routes').Router();
var http = require('http');
var fs = require('fs');
var mpdSocket = require('mpdsocket');
var qs = require('querystring');
var io = require("socket.io");
var net = require('net');
var settings = require('./settings');
var mime = require('mime');

var mpd = new mpdSocket(settings.MPD.host,settings.MPD.port);

mpd.on('connect',function() {
	//batch establish functions
	var simpleFuncList = ['clearerror','currentsong','playlist','stats','status',
	                      'play','pause','replay_gain_status','next','previous','stop',
	                      'clear','playlistinfo','shuffle','listplaylists','listall',
	                      'listallinfo','lsinfo','update','rescan','disableoutput',
	                      'enableoutput','outputs','commands','notcommands',
	                      'tagtypes','urlhandlers','command_list_end','channels','readmessages',
	                      'consume','crossfade','mixrampdb','mixrampdelay',
	                      'random','repeat','setvol','single','replay_gain_mode',
	                      'pause','play','playid','password','add','delete','deleteid',
	                      'playlistinfo','playlistid','plchanges','plchangesposid',
	                      'shuffle','listplaylist','listplaylistinfo','load',
	                      'playlistclear','rm','save','listall','listallinfo',
	                      'lsinfo','subscribe','unsubscribe','command_list_begin',
	                      'seek','seekid','addid','swap','swapid','playlistid',
	                      'playlistdelete','playlistmove','rename','count','find',
	                      'findadd','list','search','sendmessage'];

	for (var i in simpleFuncList) {
		mpdfn(simpleFuncList[i]);
	}

	function sendFile(path) {
		var res = this;
		fs.readFile(__dirname + "/static" + path,function(err,data) {
			if (err) {
				res.writeHead(404);
				res.end("Not found\n");
			} else {
				res.write(data,'utf-8');
				res.end();
			}
		});
	}

	function _simpleWrite(req) {
	    return function(param) {
		var res = this;
		if (!(param)) {
			var query = req;
		} else {
			var query = req + " ";
			for (var i in param) {
				query += decodeURI(param[i]) + " ";
			}
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
	
	function mpdfn(req) {
		var evalString = "var mpd_" + req + ' = _simpleWrite';
		evalString += '("' + req + '");';
		eval(evalString);
	
		var route = "/mpd/" + req;
		routes.addRoute(route,eval("mpd_" + req));
	}
	
	routes.addRoute('^/*$',sendFile);

	//initialize server
	var jazzmpc = http.createServer(function(req,res) {
		console.log('[' + req.connection.remoteAddress  + '] ' +req.url);
		var routed = routes.match(req.url);
		if (routed) {
			//acceptable request
			res.writeHead(200, {'Content-Type': mime.lookup(req.url)});
			if (req.method == "POST") {
				//we have parameters we need to pass
				var postData = "";
				req.on('data',function(data) {
					postData += data;
				});
				req.on('end',function() {
					var postParams = qs.parse(postData);
					routed.fn.call(res,postParams);
//					res.end();
				});
			} else {
				routed.fn.call(res,req.url);
//				res.end();
			}
		} else {
			//unacceptable request
			res.writeHead(404);
			res.end("Not found");
		}
	});
	
	settings.JazzMPC.host ? jazzmpc.listen(settings.JazzMPC.port,settings.JazzMPC.host) : jazzmpc.listen(settings.JazzMPC.port);

	//initialize IdleSocket
	var mpd2 = net.createConnection(settings.MPD.port,settings.MPD.host);
	mpd2.setEncoding('UTF-8');

	var idlesocket = io.listen(jazzmpc);

	function idleLoop() {
		console.log("In idle loop");
		mpd2.write("idle\n");
	}
	
	mpd2.on('connect',idleLoop);
	mpd2.on('disconnect',function() { mpd2 = net.createConnection(settings.MPD.port,settings.MPD.host); });

	idlesocket.on("connection",function(connection) {
	   connection.send("OK IDLESOCKET");
	   mpd2.removeAllListeners('data');
	   mpd2.on('data',function(data) {
		var r = { '_OK': false };
		var lines = data.split("\n");
		for (var i in lines) {
			if (lines[i].match(/^changed/)) {
				r.changed = lines[i].substr((lines[i].indexOf(":"))+2);
				r._OK = true;
			}
		}
		mpd2.write("idle\n");
		console.log(r);
		connection.broadcast(JSON.stringify(r));
	   });
	});

});
