var net = require('net');
var sys = require('sys');

function mpdSocket(host,port) {
	if (!host) this.host = "localhost";
	if (!port) this.port = 6600;

	this.open(host,port);
}

mpdSocket.prototype = {
	callbacks: [],
	isOpen: false,
	socket: null,
	version: "0",

	handleData: function(data) {
		var response = new Object;
		var lines = data.split("\n");
		for (var l in lines) {
			if (lines[l].match(/^ACK/)) {
				response.error = data;
				this.callbacks.shift()(response)
				return;
			} else if (lines[l].match(/^OK MPD/)) {
				this.version = lines[l].split(' ')[2];
				return;
			} else if (lines[l].match(/^OK/)) {
				this.callbacks.shift()(response);
				return;
			} else {
				response[lines[l].substr(0,lines[l].indexOf(":"))] = lines[l].substr((lines[l].indexOf(":"))+2);
			}
		}
	},
			
	open: function(host,port) {
		var self = this;
		if (!(this.isOpen)) {
			this.socket = net.createConnection(port,host);
			this.socket.setEncoding('UTF-8');
			this.socket.addListener('connect',function() { self.isOpen = true; });
			this.socket.addListener('data',function(data) { self.handleData.call(self,data); });
			this.socket.addListener('end',function() { self.isOpen = false; });
		}
	},

	send: function(req,callback) {
		if (this.isOpen) {
			this.callbacks.push(callback);
			this.socket.write(req + "\n");
		} else {
			throw "mpdNotOpenException";
		}
	}
}

module.exports = mpdSocket;
