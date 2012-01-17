
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
	
	switch (keycode) {
		case 81: // Q
			var pos = MapCamera.canvasVec3ToWorld(g_mousePosition);
		
			prop = new MapProp("./test.png", 128, 128);
			MapEditor.addProp(prop);
			prop.setPosition(pos);
			prop.renderable.useSrcAlpha = true;
			//prop.renderable.rotation = 0.45;
			break;
			
		case 46: // del
			MapEditor.deleteGrabbedEntity();
			break;
			
		case 82: // R
			MapEditor.resetGrabbedEntity();
			break;
			
		case 67: // C
		
			var pos = MapCamera.canvasVec3ToWorld(g_mousePosition);
		
			prop = new MapCollision(128, 128);
			MapEditor.addProp(prop); // @todo different array for collisions!
			prop.setPosition(pos);
			break;
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
					//console.log("Dot: " + dot + "Delta Theta: " + theta + " start " + vec3.str(this.rotationStart)
					//			+ " end: " + vec3.str(pos));

					// apply adjustments for OpenGL quirks
					if (pos[0] < 0)
						theta *= -1;
								
					if (pos[1] < this.rotationStart[1])
						theta *= -1;
						
					MapEditor.setGrabbedRotation(this.oldRotation + theta);
				}
					
				break;
				
			case PropEditAction.SCALE:
			
				/* 	@todo: Proper (working) implementation. Since I haven't written in 
					scale code anyway for the renderables, I'm in no hurry. 
				*/
			
				
				pos = MapCamera.canvasVec3ToWorld(g_mousePosition); // world pos of mouse
				
				if (MapEditor.grabbed instanceof MapProp) {
					
					// convert to distance from origin of object
					vec3.subtract(pos, MapEditor.grabbed.getPosition());
				
					var d = vec3.length(pos) - this.initialDistance;
					
					MapEditor.setGrabbedScale(1.0 + d * SCALE_FACTOR);
					console.log("New Scale: " + MapEditor.grabbed.renderable.scale);
					
				} else {
					console.log(vec3.str(pos));
					
					// calculate new bounds, width/height is Math.abs(pos)
					// readjust origin 
					var p = vec3.create(MapEditor.grabbed.getPosition());
				/*	if (pos[1] < 0)
						p[1] += pos[1];
					
					if (pos[0] < 0)
						p[0] += pos[0];
					*/
					
					/*
						point 2 is pos. Point p. Calculate new rect */
					var np = vec3.create();
					np[0] = Math.min(pos[0], p[0]);
					np[1] = Math.min(pos[1], p[1]);
					
					var w = Math.abs(pos[0] - p[0]);
					var h = Math.abs(pos[1] - p[1]);
					
					if (w < 10) w = 10;
					if (h < 10) h = 10;
					
					console.log("NP: " + vec3.str(np) + " w " + w + " h " + h);

					MapEditor.grabbed.setPosition(np);
					MapEditor.grabbed.renderable.resize(w, h);
				}
				
				break;
		}
	
	}
}







