/*******************************
**   index.js :: Javascript for the playlist page of JazzMPC
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

var mpdstatus,currentsong,currentTime,endTime,intervalId;

$(function(){
        mpd.send('playlistinfo',null,null,function(data) {
		var playlist = JSON.parse(data);
                for (var s in playlist) {
			if (typeof playlist[s] == 'object') {
        	                var liText = playlist[s].Artist + ' - ' + playlist[s].Title + ' (' + playlist[s].Album + ') / ' + Math.floor(playlist[s].Time / 60) + ':' + (playlist[s].Time % 60);
                	        $("#sortable").append('<li id="' + playlist[s].Id + '" class="ui-state-default playlist-entry"><button class="playsong ui-button ui-widget ui-state-default ui-corner-all" role="button" aria-disabled="false"><div class="ui-icon ui-icon-play" onclick=\'mpd.send("playid",["' + playlist[s].Id + '"])\' /></button>&nbsp;' + liText + '&nbsp;<div class="dragger ui-button ui-widget ui-state-default ui-corner-all" role="button" aria-disabled="false"><div class="ui-icon ui-icon-arrowthick-2-n-s" /></div></li>');
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
        });

//	$(window).scroll(function() {
//		$("#current-song-block").css("margin-bottom",($(document).height() - $(window).scrollTop() - $(window).height()) + "px");
//	});

	$("#play").click(mpd._send('play'));
	$("#pause").click(mpd._send('pause'));
	$("#next").click(mpd._send('next'));
	$("#prev").click(mpd._send('previous'));
	$("#stop").click(mpd._send('stop'));
	update_status();
	if (mpdstatus.state != "stop") {
		current_song_start_animation();
	}


	function update_current_song() {
		mpd.send('currentsong',null,{ async: false },function(data) {
			currentsong = JSON.parse(data);
		});
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
		$(".current-song-time").css('display','block');
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
		current_song_suspend_animation();
		$("#current-song-block").animate({'height': '0'},{duration: 600});
		$(".current-song-progress").progressbar("destroy");
		$(".current-song-time").css('display','none');
	}

	function update_status() {
		mpd.send('status',null,{ async: false },function(data) {
			mpdstatus = JSON.parse(data);

			if (mpdstatus.state == "play") {
				current_song_start_animation();
			} else if (mpdstatus.state == "pause") {
				current_song_suspend_animation();
			} else if (mpdstatus.state == "stop") {
				current_song_stop_animation();
			}
		});
	}

	var idleSocket = new io.Socket();
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

	idleSocket.on('disconnect',function() { idleSocket.connect(); });

/*
	$("#playlist_text").SetScroller({   velocity: '60',
	                                    direction: 'horizontal',
	                                    onmouseover: 'play',
	                                    onmouseout: 'pause',
	                                    onstartup: 'play' });
*/
});
