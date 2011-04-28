/*******************************
**   mpd.js :: an abstraction layer for MPD function calls
**
**   This file is part of JazzMPC.
**
**   JazzMPC is free software: you can redistribute it and/or modify
**   it under the terms of the GNU General Public License as published by
**   the Free Software Foundation, either version 3 of the License, or
**   (at your option) any later version.
**
**   JazzMPC is distributed in the hope that it will be useful,
**   but WITHOUT ANY WARRANTY; without even the implied warranty of
**   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
**   GNU General Public License for more details.
**
**   You should have received a copy of the GNU General Public License
**   along with JazzMPC.  If not, see <http://www.gnu.org/licenses/>.
**
*******************************/

var mpd = {
	send: function(cmd, opts, ajaxOptsExtra, cb) { // send raw functions to MPD
		var ajaxOpts = { type: 'POST', success: cb, error: function(a,b,error) {
				$("#errdialog").html('<p><span class="ui-icon ui-icon-alert"></span> <strong>Warning</strong>: The server returned bad status:</p><p style="font-family:monospace;">' + error + '</p><p>You may want to restart JazzMPC.</p>');
				$("#errdialog").css("display","block");
				$("#errdialog").dialog({
					modal: true,
					title: 'JazzMPC Error',
					buttons: {
						OK: function() {
							$(this).dialog("close");
						}
					}
				});
			}
		};

		if (opts) {
			var data = new Object;
			for (var i in opts) {
				data[i] = opts[i];
			}
			ajaxOpts.data = data;
		}

		if (ajaxOptsExtra) { for (var attr in ajaxOptsExtra) { ajaxOpts[attr] = ajaxOptsExtra[attr]; } }

		$.ajax('/mpd/' + cmd,ajaxOpts);
	},

	_send: function(cmd, opts, ajaxOptsExtra, cb) { // shorthand for anonymizing the send() function
		return function() {
			mpd.send(cmd,opts,ajaxOptsExtra,cb);
		}
	},
};
