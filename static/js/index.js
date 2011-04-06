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

var mpdstatus,currentsong,currentTime,endTime,intervalId;

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
	update_status();
	if (mpdstatus.state != "stop") {
		current_song_start_animation();
	}


	function update_current_song() {
		$.ajax('/mpd/currentsong',{ async: false, type: 'POST', success: function(data) {
			currentsong = JSON.parse(data);
		}});
	}

	function update_current_time() {
		currentTime++;
		$(".current-song-progress").progressbar("option","value",(currentTime/endTime)*100);
		$(".current-song-time").html(format_time(currentTime) + " / " + format_time(endTime));
	}

	function format_time(time) {
		var timeString = Math.floor(time / 60).toString() + ":";
		timeString += ((time % 60) >= 10) ? (time % 60).toString() : "0" + (time % 60).toString();
		return timeString;
	}

	function current_song_start_animation() {
		update_current_song();
		$(".current-song-name").html(currentsong.Artist + " - " + currentsong.Title + " (" + currentsong.Album + ")");

		clearInterval(intervalId);
		$("#current-song-block").animate({'height': '4em'},{duration: 600});
		currentTime = mpdstatus.time.split(":")[0];
		endTime = mpdstatus.time.split(":")[1];
		$(".current-song-progress").progressbar({ value: ((currentTime/endTime)*100) });
		intervalId = setInterval(update_current_time,1000);
	}

	function current_song_suspend_animation() {
		clearInterval(intervalId);
	}

	function current_song_stop_animation() {
		$("#current-song-block").animate({'height': '0'},{duration: 600});
		$(".current-song-progress").progressbar("destroy");
	}

	function update_status() {
		$.ajax('/mpd/status',{ async: false, type: 'POST', success: function(data) {
			mpdstatus = JSON.parse(data);

			if (mpdstatus.state == "play") {
				current_song_start_animation();
			} else if (mpdstatus.state == "pause") {
				current_song_suspend_animation();
			} else if (mpdstatus.state == "stop") {
				current_song_stop_animation();
			}
		}});
	}

	var idleSocket = new io.Socket("the-mu.student.rit.edu");
	idleSocket.connect();
	idleSocket.on('message',function(data) {
		console.log(data);
		if (data.match(/^OK IDLESOCKET/)) { // nothing
		} else {
			var dataObj = JSON.parse(data);
			if (dataObj.changed == "player") {
				update_status();
			}
		}
	});

/*
	$("#playlist_text").SetScroller({   velocity: '60',
	                                    direction: 'horizontal',
	                                    onmouseover: 'play',
	                                    onmouseout: 'pause',
	                                    onstartup: 'play' });
*/
});
