var routes = new require('routes').Router();
var http = require('http');
var MPD = require('./node-mpd');
var pw;

var mpd = new MPD('192.168.189.130',6600);

//establish functions

var currentsong = _simpleWrite('currentsong');

var play = _simpleWrite('play');

var pause = _simpleWrite('pause');

var next = _simpleWrite('next');

var prev = _simpleWrite('previous');

var stop = _simpleWrite('stop');

var playlist = _simpleWrite('playlistinfo');

var password = _simpleWriteArg('stop',pw);

function _simpleWrite(req) {
    return function() {
	var res = this;
        mpd.send(req,function(r) {
	   if (typeof(r) == 'object') {
	      res.end(JSON.stringify(r));
	   } else {
	      res.end(r);
	   }
	});
    }
}

function _simpleWriteArg(req,arg,param) {
    return function(param) {
	mpd.send(req + " " + arg,function(r) {
	   return JSON.stringify(r);
	});
    }
}

//establish routing table
routes.addRoute("/mpd/currentsong",currentsong);
routes.addRoute("/mpd/play",play);
routes.addRoute("/mpd/pause",pause);
routes.addRoute("/mpd/next",next);
routes.addRoute("/mpd/prev",prev);
routes.addRoute("/mpd/stop",stop);
routes.addRoute("/mpd/password/:pw",password);
routes.addRoute("/mpd/playlist",playlist);

//initialize server
var jazzmpc = http.createServer(function(req,res) {
	console.log(req.url);
	var routed = routes.match(req.url);
	if (routed) {
		//acceptable request
		res.writeHead(200, {'Content-Type': 'text/plain'});
		if (JSON.stringify(routed.params) != "{}") {
			//we have parameters we need to pass
			routed.fn.apply(res,routed.params);
		} else {
			routed.fn.apply(res);
		}
	} else {
		//unacceptable request
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end("No.");
	}
});

jazzmpc.listen(80);
