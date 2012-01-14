

/*
	Following styling guidelines:
	http://javascript.crockford.com/code.html
*/

/**
 * Create a new visible prop on the map
 */
function MapProp(position, url, width, height) {

	this.position = position;
	this.renderable = new Renderable(url, width, height, RenderableOffset.CENTER);
	MapEditor.addProp(this);
}

MapProp.prototype.render = function() {
	this.renderable.render(this.position);
}

/**
 * @param vec3 position in world coordinate space
 */
MapProp.prototype.intersects = function(pos) {
	
	// @todo compare position & dimensions to coordinates
	// Also have to take in account rotation and whatnot
	// See: http://stackoverflow.com/questions/1240660/check-if-a-point-is-in-a-rotated-rectangle-c
	
	// lazy distance formula for now
	
	/*var i = Math.abs(pos[0] - this.position[0]);
	var j = Math.abs(pos[1] - this.position[1]);
	
	var d = Math.sqrt(i*i + j*j);
	
	console.log(d);
	*/
	return true;
}

MapEditor = {
	
	/**
	 * Create a new blank map, ready to accept editing
	 */
	initialize : function() {
	
		this.props = [];
		// this.lights = [];
		// this.triggers = [];
		
		this.grabbed = null;
	},
	
	addProp : function(prop) {
		this.props.push(prop);
	},
	
	/** 
	 * Locates and returns the topmost prop at canvas coordinates (x,y)
	 */
	pickProp : function(x, y) {
		var iter;
	
		// Create coordinates relative to the camera
		var pos = MapCamera.canvasToWorld(x, y);
		var len = this.props.length;
		
		// most forward props are at the end of the array, reverse iterate
		for (iter = len - 1; iter >= 0; iter--) {
			if (this.props[iter].intersects(pos)) {
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

		this.grabbed.position = MapCamera.canvasToWorld(x, y);
	},
	
	setGrabbedEntity : function(ent) {
		this.grabbed = ent;
	},

	/**
	 * Goes through all props and renders them to the canvas
	 */
	render : function() {
		var iter;
		var len = this.props.length;
		
		for (iter = 0; iter < len; iter++) {
			if (MapEditor.isPropVisible(this.props[iter])) {
				this.props[iter].render();
			}
		}
	},
	
	isPropVisible : function(prop) {
		return true; // @todo this
	}
	
};







