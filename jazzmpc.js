var routes = new require('routes').Router();
var http = require('http');
var mpdSocket = require('mpdsocket');
var io = require("socket.io");
var jazzmpc;

var mpd = new mpdSocket('192.168.189.130',6600);

mpd.on('connect',function() {
	//batch establish functions
	var simpleFuncList = ['clearerror','currentsong','playlist','stats','status',
	                      'play','pause','replay_gain_status','next','previous','stop',
	                      'clear','playlistinfo','shuffle','listplaylists','listall',
	                      'listallinfo','lsinfo','update','rescan','disableoutput',
	                      'enableoutput','outputs','commands','notcommands',
	                      'tagtypes','urlhandlers','decoders','channels','readmessages'];
	
	var simpleArgFuncList = ['consume','crossfade','mixrampdb','mixrampdelay',
	                         'random','repeat','setvol','single','replay_gain_mode',
	                         'pause','play','playid','password','add','delete','deleteid',
	                         'playlistinfo','playlistid','plchanges','plchangesposid',
	                         'shuffle','listplaylist','listplaylistinfo','load',
	                         'playlistclear','rm','save','listall','listallinfo',
	                         'lsinfo','update','rescan','subscribe','unsubscribe'];

	//other functions
	mpdfn('seek',true,'/mpd/seek/:a/:b');
	mpdfn('seekid',true,'/mpd/seekid/:a/:b');
	mpdfn('addid',true,'/mpd/addid/:a/:b?');
	mpdfn('swap',true,'/mpd/swap/:a/:b');
	mpdfn('swapid',true,'/mpd/swap/:a/:b');
	mpdfn('playlistid',true,'/mpd/playlistid/:a/:b');
	mpdfn('playlistdelete',true,'/mpd/playlistdelete/:a/:b');
	mpdfn('playlistmove',true,'/mpd/playlistmove/:a/:b/:c');
	mpdfn('rename',true,'/mpd/rename/:a/:b');
	mpdfn('count',true,'/mpd/count/:a/:b');
	mpdfn('find',true,'/mpd/find/:a/:b');
	mpdfn('findadd',true,'/mpd/findadd/:a/:b');
	mpdfn('list',true,'/mpd/list/:a/:b?');
	mpdfn('search',true,'/mpd/search/:a/:b');
	mpdfn('sendmessage',true,'/mpd/sendmessage/:a/:b');

	for (var i in simpleFuncList) {
		mpdfn(simpleFuncList[i],false);
	}
	
	for (var i in simpleArgFuncList) {
		mpdfn(simpleArgFuncList[i],true,'/mpd/' + simpleArgFuncList[i] + '/:option');
	}
	
	function _simpleWrite(req) {
	    return function() {
		var res = this;
	        mpd.send(req,function(r) {
		   if (typeof(r) == 'object') {
		      res.end(JSON.stringify(r) + "\n");
		   } else {
		      res.end(r + "\n");
		   }
		});
	    }
	}
	
	function _simpleWriteArg(req) {
	    return function(param) {
		var res = this;
		var query = req + " ";
		for (var i in param) {
			query += param[i] + " ";
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
	
	function mpdfn(req,arg,route) {
		var evalString = "var mpd_" + req + ' = _simpleWrite';
		if (arg) evalString += 'Arg';
		evalString += '("' + req + '");';
		eval(evalString);
	
		if (!(route)) route = "/mpd/" + req;
		routes.addRoute(route,eval("mpd_" + req));
	}
	
	//initialize server
	jazzmpc = http.createServer(function(req,res) {
		console.log(req.url);
		var routed = routes.match(req.url);
		if (routed) {
			//acceptable request
			res.writeHead(200, {'Content-Type': 'text/plain'});
			if (JSON.stringify(routed.params) != "{}") {
				//we have parameters we need to pass
				routed.fn.call(res,routed.params);
			} else {
				routed.fn.call(res);
			}
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
