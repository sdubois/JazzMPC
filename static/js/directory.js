$(function() {
	var allsongs = [];

	$.ajax('/mpd/listall',{ type: 'POST', success: function(data) {
		var list = JSON.parse(data);
		for (var i in list) {
			if (list[i].file) {
				allsongs.push(list[i].file);
			}
		}

		for (var i in allsongs) {
			$("body").append('<p>' + allsongs[i] + '</p>');
			console.log(allsongs[i]);
		}
	}});
	
	console.log("Done!");
});
