
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
		
		if (prop != null) {
			console.log("Grabbed prop " + vec3.str(prop.getPosition()));
			this.graboffset = vec3.create(prop.getPosition());
			vec3.subtract(this.graboffset, pos);
		}
	}
}

/** @param pos canvas position of the cursor */
PropEditTool.prototype.onMouseUp = function(pos) {
	
	this.mousedown = false;

}

PropEditTool.prototype.onUpdate = function() {

	if (this.mousedown && MapEditor.grabbed) { // drag the grabbed prop around

		var pos = MapCamera.canvasVec3ToWorld(g_mousePosition);
		
		vec3.add(pos, this.graboffset);
		MapEditor.grabbed.setPosition(pos);
		MapEditor.grabrect.position = pos;
		
	}
}






