

// jQuery-facing hooks

$(document).ready(function() {
	
	$("input[name='SetMapEditorMode']").change(function() {
		MapEditor.setEditMode( parseInt($(this).val()) );
	});
	
});
