
var SCALE_FACTOR = 0.001;

PropEditAction = {
	NONE : 0, 
	TRANSLATE : 1,
	ROTATE : 2,
	SCALE : 3
}

function PropEditTool() {
	this.inclick = false;
	this.mousedown = false;
	this.action = PropEditAction.NONE;
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

			this.action = PropEditAction.TRANSLATE;
			this.grabOffset = vec3.create(MapEditor.grabbed.getPosition());
			vec3.subtract(this.grabOffset, pos);
			
		} else { // clicked outside, check for either scale or rotate
		
			if (g_pressedKeys[17]) { // ctrl + click
			
				this.action = PropEditAction.SCALE;
			
				// get initial distance from origin
				pos = MapCamera.canvasVec3ToWorld(g_mousePosition); // world pos of mouse
				vec3.subtract(pos, MapEditor.grabbed.getPosition()); // relative pos of mouse to object
			
				this.initialDistance = vec3.length(pos);
				
			} else {
			
				this.action = PropEditAction.ROTATE;
			
				this.oldRotation = MapEditor.grabbed.renderable.rotation;
				
				// Save the position of the cursor relative to the objects origin
				this.rotationStart = MapCamera.canvasVec3ToWorld(g_mousePosition); // world pos of mouse
				vec3.subtract(this.rotationStart, MapEditor.grabbed.getPosition()); // relative pos of mouse to object
				vec3.normalize(this.rotationStart);
			}
		}
	}
}

/** @param pos canvas position of the cursor */
PropEditTool.prototype.onMouseUp = function(pos) {
	
	this.action = PropEditAction.NONE;
}

PropEditTool.prototype.onUpdate = function() {

	var pos;

	if (MapEditor.grabbed) {

		switch (this.action) {
			case PropEditAction.TRANSLATE:
			
				pos = MapCamera.canvasVec3ToWorld(g_mousePosition);
		
				vec3.add(pos, this.grabOffset);
				MapEditor.grabbed.setPosition(pos);
				MapEditor.grabrect.position = pos;
				
				break;
			
			case PropEditAction.ROTATE:

				// Get the new position of the cursor relative to the objects origin
				pos = MapCamera.canvasVec3ToWorld(g_mousePosition); // world pos of mouse
				vec3.subtract(pos, MapEditor.grabbed.getPosition()); // relative pos of mouse to object
				vec3.normalize(pos);

				//	Calculate the angle between the vectors made by both points
				var dot = vec3.dot(this.rotationStart, pos);
				var theta = Math.acos(dot);

				// @todo: clean this up, please

				if (isNaN(theta)) {
					throw "Fix this fucking NaN error";
				} else {
					console.log("Dot: " + dot + "Delta Theta: " + theta + " start " + vec3.str(this.rotationStart)
								+ " end: " + vec3.str(pos));

					// apply adjustments for OpenGL quirks
					if (pos[0] < 0)
						theta *= -1;
								
					if (pos[1] < this.rotationStart[1])
						MapEditor.grabbed.renderable.rotation = this.oldRotation - theta;
					else
						MapEditor.grabbed.renderable.rotation = this.oldRotation + theta;
				}
					
				break;
				
			case PropEditAction.SCALE:
			
				/* 	@todo: Proper (working) implementation. Since I haven't written in 
					scale code anyway for the renderables, I'm in no hurry. 
				*/
			
				// get initial distance from origin
				pos = MapCamera.canvasVec3ToWorld(g_mousePosition); // world pos of mouse
				vec3.subtract(pos, MapEditor.grabbed.getPosition()); // relative pos of mouse to object
			
				var d = vec3.length(pos) - this.initialDistance;

				MapEditor.grabbed.renderable.scale += d * SCALE_FACTOR;
				console.log("New Scale: " + MapEditor.grabbed.renderable.scale);
			
				break;
		}
	
	}
}







