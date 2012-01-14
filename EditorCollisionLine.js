

CollisionType = {
	HARD : 1, /**< Always solid */
	FALL_THROUGH : 2, /**< Solid if moving opposite to the normal */
	FALL_THROUGH_SOFT : 3, /**< Same as FALL_THROUGH, but conditions 
								can allow an object to pass through */
}

function EditorCollisionLine() {
	var LINE_WIDTH = 2;
	var BOX_RADIUS = 5;
	
	this.angle = 0.0;
	this.type = CollisionType.HARD; /**< Ingame behavior of this collision line */
	
	this.normal = vec3.create();
	this.translation = vec3.create(); /**< World coordinate of the initial point */
	this.end = vec3.create(); /**< Offset from (0, 0) of the second point */
	
	this.rotmat = mat4.create();
	this.transmat = mat4.create();
}

/**
 * Calculates a new rotation/scale matrix based on the vector
 * between the initial/final points, and creates a new normal for collision
 */
EditorCollisionLine.prototype.recalculate = function() {

	var x = this.end[0], y = this.end[1];

	// calculate new angle
	this.angle = Math.atan(y / x);
	
	// calculate normal
	this.normal = vec3.create([-x, y, 0]);
	vec3.normalize(this.normal);
	
	var height = Math.sqrt(x*x + y*y);
	
	// calculate new rotation/scale matrix
	mat4.identity(this.rotmat);
	mat4.scale(this.rotmat, [0, height, 0]);
	mat4.rotateZ(this.rotmat, this.angle);
	
	// calculate the final matrix, with translation mixed in
	mat4.identity(this.transmat);
	mat4.translate(this.transmat, this.translation);
	mat4.multiply(this.transmat, this.rotmat);
}

/**
 * Calculates of the coordinates are in our anchor rectangle and returns
 * the results. 
 * @return boolean
 */
EditorCollisionLine.prototype.isInAnchor = function(x, y) {
	/*
		Out of laziness, can determine points distance from our 
		initial->final line, and return whether it's under a certain
		threshold. 
		
		Or, could do the whole rotated rectangle math... but that seems
		like overkill
	*/
}

/**
 * Recalculates everything based on a new final point, and assumes the 
 * initial point does not move
 * @param pos vec3 world coordinates of line end
 */
EditorCollisionLine.prototype.moveFinalPoint = function(pos) {
	/*
		remember, initial is (0, 0) and is a translation
		in code. So we're not directly copying cursor world coordinates
		into final. It needs to be offset by the translation location and
		whatnot. 
	*/
	
	vec3.set(this.end, pos);
	
	// Recalculate everything
	this.recalculate();
}

/**
 * Recalculates everything based on a new initial point, and assumes
 * the final point moves the same delta xy (ie: everything just translates)
 * @param pos vec3 world coordinates of line start
 */
EditorCollisionLine.prototype.moveInitialPoint = function(pos) {

	vec3.set(this.translation, pos);

	// recalculate final matrix 
	mat4.identity(this.transmat);
	mat4.translate(this.transmat, this.translation);
	mat4.multiply(this.transmat, this.rotmat);
}

/**
 * Calculates a raw byte array representation of this collision line, necessary
 * for saving state information. 
 * @return ???
 */
EditorCollisionLine.prototype.serialize = function() {

}





