
function PropEditTool() {
	this.inclick = false;
	this.mousedown = false;
}

	
PropEditTool.prototype.render = function() {

}
	
PropEditTool.prototype.onKeyDown = function(keycode) {
	
	if (keycode == 81) { // Q
		var pos = MapCamera.canvasVec3ToWorld(g_mousePosition);
	
		prop = new MapProp("./test.png", 128, 128);
		MapEditor.addProp(prop);
		prop.setPosition(pos);
		prop.renderable.useSrcAlpha = true;
		//prop.renderable.rotation = 0.45;
	}
}

PropEditTool.prototype.onKeyUp = function(keycode) {
	
}

/** @param pos canvas position of the cursor */
PropEditTool.prototype.onMouseDown = function(pos) {

	this.mousedown = true;

	if (g_pressedKeys[16]) { // shift + click
	
		pos = MapCamera.canvasVec3ToWorld(pos);
		
		prop = MapEditor.pickProp(pos, true);
		MapEditor.setGrabbedEntity(prop);

	} else if (MapEditor.grabbed != null) {
		
		pos = MapCamera.canvasVec3ToWorld(pos);
	
		// if we clicked inside the selected prop, move it around
		if (MapEditor.grabbed.intersects(pos)) {
			this.movegrabbed = true;
			this.rotategrabbed = false;
			
			this.graboffset = vec3.create(prop.getPosition());
			vec3.subtract(this.graboffset, pos);
		} else {
			this.movegrabbed = false;
			
			// rotate
			this.rotategrabbed = true;
			
			this.graboffset = vec3.create(prop.getPosition());
			vec3.subtract(this.graboffset, pos);
		}
		
	}
}

/** @param pos canvas position of the cursor */
PropEditTool.prototype.onMouseUp = function(pos) {
	
	this.mousedown = false;
	this.movegrabbed = false;
	this.rotategrabbed = false;
}

PropEditTool.prototype.onUpdate = function() {

	if (this.movegrabbed && MapEditor.grabbed) { // drag the grabbed prop around

		var pos = MapCamera.canvasVec3ToWorld(g_mousePosition);
		
		vec3.add(pos, this.graboffset);
		MapEditor.grabbed.setPosition(pos);
		MapEditor.grabrect.position = pos;
		
	} else if (this.rotategrabbed && MapEditor.grabbed) {
		
		
	}
}






