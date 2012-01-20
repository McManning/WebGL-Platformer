

// jQuery-facing hooks

$(document).ready(function() {
	
	$("input[name='SetMapEditorMode']").change(function() {
		MapEditor.setEditMode( parseInt($(this).val()) );
	});
	
	$('.prop').click(function() {
		MapEditor.addPropByName( $(this).attr('src') );
	});
});
