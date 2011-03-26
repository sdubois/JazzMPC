$(function(){
	$( "#sortable" ).sortable();
        $( "#sortable" ).disableSelection();

        $.ajax('/mpd/playlistinfo',{ type: 'POST', success: function(data) {
		var playlist = JSON.parse(data);
                for (var s in playlist) {
			if (typeof playlist[s] == 'object') {
				console.log(playlist[s]);
        	                var liText = playlist[s].Artist + ' - ' + playlist[s].Title + ' (' + playlist[s].Album + ') / ' + Math.floor(playlist[s].Time / 60) + ':' + (playlist[s].Time % 60);
                	        $("#sortable").append('<li class="ui-state-default"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>' + liText + '</li>');
			}
                }
        }});
});

