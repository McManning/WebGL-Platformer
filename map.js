

/*
	Following styling guidelines:
	http://javascript.crockford.com/code.html
*/

/**
 * Create a new visible prop on the map
 * @todo this could be an override of RenderableImage, but I need to figure
 * out how to provide constructor arguments to the parent object
 */
function MapProp(url, width, height) {

	this.renderable = new RenderableImage(url, width, height);
}

MapProp.prototype.render = function() {
	this.renderable.render();
}

MapProp.prototype.setPosition = function(position) {
	this.renderable.position = position;
}

MapProp.prototype.getPosition = function() {
	return this.renderable.position;
}

/**
 * @param pos vec3 position in world coordinate space
 */
MapProp.prototype.intersects = function(pos) {
	
	return this.renderable.intersectsBoundingBox(pos);
}

function MapCollision(width, height) {
	
	this.renderable = new RenderableBox(width, height, 5, [0, 0, 0]);
}

MapCollision.prototype.render = function() {
	this.renderable.render();
}

MapCollision.prototype.setPosition = function(position) {
	this.renderable.position = position;
}

MapCollision.prototype.getPosition = function() {
	return this.renderable.position;
}

MapCollision.prototype.intersects = function(pos) {
	return this.renderable.intersectsBoundingBox(pos);
}

MapEditorMode = {
	EDIT_PROPS : 0,
	EDIT_COLLISIONS : 1,
	EDIT_LIGHTS : 2
}

MapEditor = {
	
	/**
	 * Create a new blank map, ready to accept editing
	 */
	initialize : function() {
	
		this.props = new Array();
		this.collisions = new Array();
		// this.lights = [];
		// this.triggers = [];
		
		this.grabbed = null;
		this.hovered = null;
		this.oldmouse = vec3.create();
		
		this.hoverrect = new RenderableBox(10, 10, 2, [0.6, 0.6, 0.6]);
		this.grabrect = new RenderableBox(10, 10, 5, [0, 1, 0]);
		
		this.renderableDebug = new RenderableDebugger();
		
		this.editMode = MapEditorMode.EDIT_PROPS;
	},
	
	addProp : function(ent) {
		this.props.push(ent);
	},
	
	addCollision : function(ent) {
		this.collisions.push(ent);
	},
	
	/** 
	 * Locates and returns the topmost entity at the specified position
	 * @param pos vec3 location in world coordinates
	 * @param ignoreCurrent bool if true, will skip over this.grabbed
	 */
	pickEntity : function(pos, ignoreCurrent) {
		
		var ent;
		
		switch (this.editMode) {
			case MapEditorMode.EDIT_PROPS:
				ent = this.pickEntityFromList(this.props, pos, ignoreCurrent);
				break;
			case MapEditorMode.EDIT_COLLISIONS:
				ent = this.pickEntityFromList(this.collisions, pos, ignoreCurrent);
				break;
			default:
				break;
		}
		
		return ent;
	},
	
	pickEntityFromList : function(list, pos, ignoreCurrent) {
		var len = list.length;
		
		// most forward props are at the end of the array, reverse iterate
		for (var iter = len - 1; iter >= 0; iter--) {
			if (list[iter].intersects(pos) 
				&& (!ignoreCurrent || list[iter] != this.grabbed)) {
				return list[iter];
			}
		}
		
		return null;
	},
	
	/**
	 * Readjusts the position of the grabbed prop to the proper (x, y)
	 * @param x coordinate on the canvas
	 * @param y coordinate on the canvas
	 */
	moveGrabbedEntity : function(x, y) {

		if (this.grabbed != null) {
			this.grabbed.setPosition(MapCamera.canvasToWorld(x, y));
		}
	},
	
	setGrabbedEntity : function(ent) {
		this.grabbed = ent;

		// Create a rectangle around the entity to indicate that it's grabbed
		if (ent != null) {
			console.log("Grabbed prop at " + vec3.str(ent.getPosition()));
		
			// match the parent entities position with our rectangle
			vec3.set(ent.getPosition(), this.grabrect.position);
			this.grabrect.resize(ent.renderable.width, ent.renderable.height);
			this.grabrect.rotation = ent.renderable.rotation;
			this.grabrect.setScale(ent.renderable.scale);
		}
	},
	
	/** 
	 * Ungrab the currently grabbed entity and delete it from the map entirely
	 */
	deleteGrabbedEntity : function() {
		
		var ent;
		
		if (this.grabbed) {
			ent = this.grabbed;
			this.setGrabbedEntity(null);
			
			if (ent instanceof MapProp)
				this.deleteEntityFromList(this.props, ent);
			else
				this.deleteEntityFromList(this.collisions, ent);
		}
	},
	
	/** 
	 * @return true if the entity was found and erased, false otherwise 
	 */
	deleteEntityFromList : function(list, ent) {
	
		var len = list.length;
		for (var iter = 0; iter < len; iter++) {
			if (list[iter] == ent) {
				list.splice(iter, 1);
				return true;
			}
		}
		
		return false;
	},
	
	/**
	 * Resets properties of the grabbed entity to defaults
	 */
	resetGrabbedEntity : function() {
		this.setGrabbedScale(1.0);
		this.setGrabbedRotation(0.0);
		this.grabbed.renderable.HSVShift = vec3.create();
	},
	
	setGrabbedRotation : function(theta) {
		this.grabbed.renderable.rotation = theta;
		this.grabrect.rotation = theta;
	},
	
	setGrabbedScale : function(val) { 
		this.grabbed.renderable.setScale(val);
		this.grabrect.setScale(val);
	},
	
	resizeGrabbed : function(w, h) {
		this.grabbed.renderable.resize(w, h);
		this.grabrect.resize(w, h);
	},
	
	/**
	 * Pulls the grabbed entity up in Z-order
	 */
	pullGrabbed : function() {
		
		if (this.grabbed instanceof MapProp) {
			
			var len = this.props.length-1;
			
			for (var iter = 0; iter < len; iter++) {
				if (this.props[iter] == this.grabbed) {
					this.props[iter] = this.props[iter+1];
					this.props[iter+1] = this.grabbed;
					break;
				}
			}
		}
	},
	
	/**
	 * Pushes the grabbed entity down in Z-order
	 */
	pushGrabbed : function() {
		
		if (this.grabbed instanceof MapProp) {
			
			var len = this.props.length;
			
			for (var iter = 1; iter < len; iter++) {
				if (this.props[iter] == this.grabbed) {
					this.props[iter] = this.props[iter-1];
					this.props[iter-1] = this.grabbed;
					break;
				}
			}
		}
	},
	
	/**
	 * Goes through all props and renders them to the canvas
	 */
	render : function() {
	
		this.renderList(this.props, this.editMode == MapEditorMode.EDIT_PROPS);
		
		if (this.editMode == MapEditorMode.EDIT_COLLISIONS) {
			this.renderList(this.collisions, true);
		}

		if (this.hovered) {
			this.hoverrect.render();
		}
				
		if (this.grabbed) {
			this.grabrect.render();
		}
	},
	
	renderList : function(list, showDebug) {
	
		var len = list.length;
		for (var iter = 0; iter < len; iter++) {
			list[iter].render();
			if (showDebug)
				this.renderableDebug.render(list[iter].renderable);
		}
	},

	onUpdate : function() {
	
		// @todo relocate this to a proper timer that isn't so active
		if (this.oldmouse[0] != g_mousePosition[0] 
			|| this.oldmouse[1] != g_mousePosition[1]) {

			vec3.set(g_mousePosition, this.oldmouse);
			
			var ent = this.pickEntity(MapCamera.canvasVec3ToWorld(g_mousePosition), true);
			
			if (this.hovered != ent) {
				this.hovered = ent;
				
				if (ent) {
					vec3.set(ent.getPosition(), this.hoverrect.position);
					this.hoverrect.resize(ent.renderable.width, ent.renderable.height);
					this.hoverrect.rotation = ent.renderable.rotation;
					this.hoverrect.setScale(ent.renderable.scale);
				}
			}
		}
	},
	
	setEditMode : function(mode) {
		this.editMode = mode;
		this.setGrabbedEntity(null);
	}
};







