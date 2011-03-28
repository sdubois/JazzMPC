$(function(){
	$( "#sortable" ).sortable();
        $( "#sortable" ).disableSelection();

	function _mpd_cmd(cmd) {
		return function() {
			$.ajax('/mpd/' + cmd,{ type: 'POST', success: function(data) {
				var resp = JSON.parse(data);
				if (resp._OK == false) document.alert("Something went wrong!");
 			}});
		}
	}

        $.ajax('/mpd/playlistinfo',{ type: 'POST', success: function(data) {
		var playlist = JSON.parse(data);
                for (var s in playlist) {
			if (typeof playlist[s] == 'object') {
        	                var liText = playlist[s].Artist + ' - ' + playlist[s].Title + ' (' + playlist[s].Album + ') / ' + Math.floor(playlist[s].Time / 60) + ':' + (playlist[s].Time % 60);
                	        $("#sortable").append('<li id="playlist_entry_' + s + '" class="ui-state-default"><span id="playlist_text" class="ui-icon ui-icon-arrowthick-2-n-s"></span>' + liText + '</li>');
			}
                }
        }});

	$("#play").click(_mpd_cmd('play'));
	$("#pause").click(_mpd_cmd('pause'));
	$("#next").click(_mpd_cmd('next'));
	$("#prev").click(_mpd_cmd('previous'));
	$("#stop").click(_mpd_cmd('stop'));

	function update_status() {
		$.ajax('/mpd/status',{ type: 'POST', success: function(data) {
			var status = JSON.parse(data);
			$("#status").html('MPD is ' + status.state);
		}});
	}

	update_status();

	var idleSocket = new io.Socket("the-mu.student.rit.edu");
	idleSocket.connect();
	idleSocket.on('message',function(data) {
		console.log(data);
		if (data.match(/^OK IDLESOCKET/)) { // nothing
		} else {
			update_status();
		}
	});

/*	$("#playlist_text").SetScroller({   velocity: '60',
	                                    direction: 'horizontal',
	                                    onmouseover: 'play',
	                                    onmouseout: 'pause',
	                                    onstartup: 'play' });
*/
});
