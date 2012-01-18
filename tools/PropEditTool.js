

var COLLISION_MIN_THICKNESS = 20;

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
		case 81: { // Q - add test map prop
			var pos = MapCamera.canvasVec3ToWorld(g_mousePosition);
		
			prop = new MapProp("./test.png", 128, 128);
			MapEditor.addProp(prop);
			prop.setPosition(pos);
			prop.renderable.useSrcAlpha = true;
			//prop.renderable.rotation = 0.45;
			break;
		}
		case 46: { // del - delete prop
			MapEditor.deleteGrabbedEntity();
			break;
		}	
		case 82: { // R - reset scale/rotation of prop
			MapEditor.resetGrabbedEntity();
			break;
		}	
		case 67: { // C - add collision prop
		
			var pos = MapCamera.canvasVec3ToWorld(g_mousePosition);
		
			prop = new MapCollision(128, 128);
			MapEditor.addCollision(prop);
			prop.setPosition(pos);
			break;
		}
		case 33: { // Page Up - pull map prop z order
			
			MapEditor.pullGrabbed();
			break;
		}
		case 34: { // Page Down - push map prop z order
			
			MapEditor.pushGrabbed();
			break;
		}
		case 70: { // F - flip map prop
			
			if (MapEditor.grabbed instanceof MapProp) {
				MapEditor.grabbed.renderable.flipHorizontal();
			}
			break;
		}
	}
}

PropEditTool.prototype.onKeyUp = function(keycode) {
	
}

/** @param pos canvas position of the cursor */
PropEditTool.prototype.onMouseDown = function(pos) {

	this.mousedown = true;

	if (g_pressedKeys[16]) { // shift + click
	
		pos = MapCamera.canvasVec3ToWorld(pos);
		
		var prop = MapEditor.pickEntity(pos, true);
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
			case PropEditAction.TRANSLATE: {
			
				pos = MapCamera.canvasVec3ToWorld(g_mousePosition);
		
				vec3.add(pos, this.grabOffset);
				MapEditor.grabbed.setPosition(pos);
				MapEditor.grabrect.position = pos;
				
				break;
			}
			case PropEditAction.ROTATE: {

				// Get the new position of the cursor relative to the objects origin
				pos = MapCamera.canvasVec3ToWorld(g_mousePosition); // world pos of mouse
				vec3.subtract(pos, MapEditor.grabbed.getPosition()); // relative pos of mouse to object
				vec3.normalize(pos);

				// @todo stop jerky behavior when this.rotationStart isn't directly above
				// the getCenter() of our prop
				
				//	Calculate the angle between the vectors made by both points
				var dot = vec3.dot(this.rotationStart, pos);
				if (dot >= -1 && dot <= 1) {
					
					var theta = Math.acos(dot);

					// apply adjustments for OpenGL quirks
					if (pos[0] < 0)
						theta *= -1;
								
					if (pos[1] < this.rotationStart[1])
						theta *= -1;
						
					MapEditor.setGrabbedRotation(this.oldRotation + theta);
				}
			
				break;
			}
			case PropEditAction.SCALE: {

				pos = MapCamera.canvasVec3ToWorld(g_mousePosition);
				
				if (MapEditor.grabbed instanceof MapProp) {
					
					// convert to distance from center of object
					vec3.subtract(pos, MapEditor.grabbed.renderable.getCenter());

					MapEditor.grabbed.renderable.localizePoint(pos);

					var d = vec3.length(pos) * 2;

					if (d != 0) {
						var s = MapEditor.grabbed.renderable.scale;
						var w = MapEditor.grabbed.renderable.width * s;
						var h = MapEditor.grabbed.renderable.height * s;
						
						var d0 = Math.sqrt(w*w + h*h);
						MapEditor.setGrabbedScale(d / d0);
					}
					
				} else {

					vec3.subtract(pos, MapEditor.grabbed.renderable.getCenter());
					//MapEditor.grabbed.renderable.localizePoint(pos);

					// figure out which axis to manipulate and do so
					var tl = MapEditor.grabbed.renderable.getTopLeft();
					var br = MapEditor.grabbed.renderable.getBottomRight();
					
					var w, h;
					
					// bound it to bottom right quadrant
					if (pos[0] > COLLISION_MIN_THICKNESS)
						w = pos[0] * 2;
					else
						w = COLLISION_MIN_THICKNESS;

					if (pos[1] < -COLLISION_MIN_THICKNESS)
						h = -pos[1]*2;
					else
						h = COLLISION_MIN_THICKNESS;

					MapEditor.resizeGrabbed(w, h);
				}
				
				break;
			}
		}
	
	}
}







