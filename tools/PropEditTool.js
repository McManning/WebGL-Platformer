
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
		
		var prop = MapEditor.pickProp(pos, true);
		MapEditor.setGrabbedEntity(prop);

	} else if (MapEditor.grabbed != null) {
		
		pos = MapCamera.canvasVec3ToWorld(pos);
	
		// if we clicked inside the selected prop, move it around
		if (MapEditor.grabbed.intersects(pos)) {
			this.movegrabbed = true;
			this.rotategrabbed = false;
			
			this.graboffset = vec3.create(MapEditor.grabbed.getPosition());
			vec3.subtract(this.graboffset, pos);
		} else {
			this.movegrabbed = false;
			this.rotategrabbed = true;
			this.oldRotation = MapEditor.grabbed.renderable.rotation;
			
			// Save the position of the cursor relative to the objects origin
			this.rotationStart = MapCamera.canvasVec3ToWorld(g_mousePosition); // world pos of mouse
			vec3.subtract(this.rotationStart, MapEditor.grabbed.getPosition()); // relative pos of mouse to object
			vec3.normalize(this.rotationStart);
		}
		
	}
}

/** @param pos canvas position of the cursor */
PropEditTool.prototype.onMouseUp = function(pos) {
	
	this.mousedown = false;
	this.movegrabbed = false;
	this.rotategrabbed = false;
	
	//MapEditor.grabbed.renderable.rotation = this.oldRotation;
}

PropEditTool.prototype.onUpdate = function() {

	if (this.movegrabbed && MapEditor.grabbed) { // drag the grabbed prop around

		var pos = MapCamera.canvasVec3ToWorld(g_mousePosition);
		
		vec3.add(pos, this.graboffset);
		MapEditor.grabbed.setPosition(pos);
		MapEditor.grabrect.position = pos;
		
	} else if (this.rotategrabbed && MapEditor.grabbed) {
		
		// Get the new position of the cursor relative to the objects origin
		var rotEnd = MapCamera.canvasVec3ToWorld(g_mousePosition); // world pos of mouse
		vec3.subtract(rotEnd, MapEditor.grabbed.getPosition()); // relative pos of mouse to object
		vec3.normalize(rotEnd);
		
		/*
			Calculate the angle between the vectors made by both points
			theta = acos(a dot b)
		*/
		var dot = vec3.dot(this.rotationStart, rotEnd);
		var theta = Math.acos(dot);

		// apply adjustments for OpenGL quirks

		if (isNaN(theta)) {
			console.log("NAN");
		} else {
			console.log("Dot: " + dot + "Delta Theta: " + theta + " start " + vec3.str(this.rotationStart)
						+ " end: " + vec3.str(rotEnd));

			if (rotEnd[0] < 0)
				theta *= -1;
						
			if (rotEnd[1] < this.rotationStart[1])
				MapEditor.grabbed.renderable.rotation = this.oldRotation - theta;
			else
				MapEditor.grabbed.renderable.rotation = this.oldRotation + theta;
		}
	}
}






