function _mpd_cmd(cmd) {
	var command = cmd.shift();
	var arg = new Object;
	var i = 0;

	while (cmd.length > 0) {
		arg[++i] = cmd.shift();
	}

	$.ajax('/mpd/' + command,{ type: 'POST', data: arg, success: function(data) {
		var resp = JSON.parse(data);
		if (!(resp._OK)) window.alert("Something went wrong!");
 	}});
}

function _mpd_cmd_fn(cmd) {
	var command = cmd.shift();
	var arg = new Object;
	var i = 0;

	while (cmd.length > 0) {
		arg[++i] = cmd.shift();
	}

	return function() {
		$.ajax('/mpd/' + command,{ type: 'POST', data: arg, success: function(data) {
			var resp = JSON.parse(data);
			if (!(resp._OK)) window.alert("Something went wrong!");
 		}});
	}
}

var mpdstatus;

$(function(){

        $.ajax('/mpd/playlistinfo',{ type: 'POST', success: function(data) {
		var playlist = JSON.parse(data);
                for (var s in playlist) {
			if (typeof playlist[s] == 'object') {
        	                var liText = playlist[s].Artist + ' - ' + playlist[s].Title + ' (' + playlist[s].Album + ') / ' + Math.floor(playlist[s].Time / 60) + ':' + (playlist[s].Time % 60);
                	        $("#sortable").append('<li id="' + playlist[s].Id + '" class="ui-state-default playlist-entry"><button class="playsong ui-button ui-widget ui-state-default ui-corner-all" role="button" aria-disabled="false"><div class="ui-icon ui-icon-play" onclick=\'_mpd_cmd(["playid","' + playlist[s].Id + '"])\' /></button>&nbsp;' + liText + '&nbsp;<div class="dragger ui-button ui-widget ui-state-default ui-corner-all" role="button" aria-disabled="false"><div class="ui-icon ui-icon-arrowthick-2-n-s" /></div></li>');
			}
                }

		var playlistEntries = new Array;
		$("#sortable").sortable({ handle: '.dragger', start: function(evt) {
			for (var i in evt.target.childNodes) {
				if (evt.target.childNodes[i].id) { playlistEntries.push(evt.target.childNodes[i].id) } else { continue }
			}
		},

		update: function(evt,ui) {
			var i=0,j=0,moved,movedTo;
			var newPlaylistEntries = new Array;

			for (var k in evt.target.childNodes) {
				if (evt.target.childNodes[k].id) { newPlaylistEntries.push(evt.target.childNodes[k].id) } else { continue; }
			}

			while (newPlaylistEntries[i] == playlistEntries[j]) { i++; j++; }

			if (newPlaylistEntries[i] == playlistEntries[j+1]) {
				movedTo = newPlaylistEntries.indexOf(playlistEntries[j]);
				moved = newPlaylistEntries[movedTo];
			} else {
				movedTo = newPlaylistEntries.indexOf(newPlaylistEntries[i]);
				moved = newPlaylistEntries[movedTo];
			}

			$.ajax('/mpd/moveid',{ type: 'POST', data: { a: moved, b: movedTo } });
		}});
	        $("#sortable").disableSelection();
        }});

	$("#play").click(_mpd_cmd_fn(['play']));
	$("#pause").click(_mpd_cmd_fn(['pause']));
	$("#next").click(_mpd_cmd_fn(['next']));
	$("#prev").click(_mpd_cmd_fn(['previous']));
	$("#stop").click(_mpd_cmd_fn(['stop']));
	$("#current-song-progress").progressbar({
		value: 0
	});

	function update_status() {
		$.ajax('/mpd/status',{ type: 'POST', success: function(data) {
			mpdstatus = JSON.parse(data);
			$("#status").html('MPD is ' + mpdstatus.state);
		}});
	}

//	update_status();

/*	var idleSocket = new io.Socket("the-mu.student.rit.edu");
	idleSocket.connect();
	idleSocket.on('message',function(data) {
		console.log(data);
		if (data.match(/^OK IDLESOCKET/)) { // nothing
		} else {
			update_status();
		}
	});

	$("#playlist_text").SetScroller({   velocity: '60',
	                                    direction: 'horizontal',
	                                    onmouseover: 'play',
	                                    onmouseout: 'pause',
	                                    onstartup: 'play' });
*/
});
