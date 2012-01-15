

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
	this.renderable.setOffset(RenderableOffset.CENTER);
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
	
	// @todo compare position & dimensions to coordinates
	// Also have to take in account rotation and whatnot
	// See: http://stackoverflow.com/questions/1240660/check-if-a-point-is-in-a-rotated-rectangle-c
	
	// lazy distance formula for now
	// @todo this isn't actually the center. Never calculated in offsets.
	/*var i = this.renderable.position[0] - pos[0];
	var j = this.renderable.position[1] - pos[1];

	var d = Math.sqrt(i*i + j*j);

	return d < Math.min(this.renderable.width, this.renderable.height);
	*/
	return this.renderable.intersectsBoundingBox(pos);
}

MapEditor = {
	
	/**
	 * Create a new blank map, ready to accept editing
	 */
	initialize : function() {
	
		this.props = new Array();
		// this.lights = [];
		// this.triggers = [];
		
		this.grabbed = null;
	},
	
	addProp : function(prop) {
		this.props.push(prop);
	},
	
	/** 
	 * Locates and returns the topmost prop at the specified position
	 * @param pos vec3 location in world coordinates
	 * @param ignoreCurrent bool if true, will skip over this.grabbed
	 */
	pickProp : function(pos, ignoreCurrent) {
		var iter;
	
		// Create coordinates relative to the camera
		var len = this.props.length;
		
		// most forward props are at the end of the array, reverse iterate
		for (iter = len - 1; iter >= 0; iter--) {
			if (this.props[iter].intersects(pos) 
				&& (!ignoreCurrent || this.props[iter] != this.grabbed)) {
				return this.props[iter];
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
		
		if (this.grabrect != null) {
			// @todo delete or is it auto?
			
			this.grabrect = null;
		}
		
		// Create a rectangle around the entity to indicate that it's grabbed
		if (ent != null) {
			console.log("Grabbed prop at " + vec3.str(ent.getPosition()));
		
			this.grabrect = new RenderableBox(ent.renderable.width, ent.renderable.height, 5, [0, 1, 0]);
			
			this.grabrect.rotation = ent.renderable.rotation;
			// @todo Not working yet: this.grabrect.scale = ent.renderable.scale;
			this.grabrect.offset = ent.renderable.offset;
			this.grabrect.position = ent.getPosition();
		}
	},

	/**
	 * Goes through all props and renders them to the canvas
	 */
	render : function() {
	
		for (var iter in this.props) {
			if (MapEditor.isPropVisible(this.props[iter])) {
				this.props[iter].render();
			}
		}
		
		if (this.grabrect != null) {
			this.grabrect.render();
		}
	},
	
	isPropVisible : function(prop) {
		return true; // @todo this
	}
	
};







