



CollisionTool properties:

	EditorCollisionLine grabbed 
	bool ldrag
	bool rdrag
	bool deforming
	vec3 grabOffset
	
	const MINIMUM_COLLISIONLINE_LENGTH 
	
	array lines
	vbufLine
	cbufLine
	tbufLine

	
No right click in Javascript/browsers! Would need
to find a new version
/*
	Tool Registration:
		Each tool could be its own seperate .js file, and as tool files are loaded in,
		each one can register itself to a global list. Each registration will have 
		a tool name, a reference to an object that has common functionality between all
		tools, and an icon, or other data for us to add it to the editor web page. 
*/

var CollisionTool = {};

CollisionTool.initialize = function() {

	var LINE_WIDTH = 2;
	var BOX_RADIUS = 5;

	this.deforming = false;

	// surrounding anchor box 
/*	vertices = [
		BOX_RADIUS, -BOX_RADIUS, 0,
		BOX_RADIUS, 1+BOX_RADIUS, 0,
		-BOX_RADIUS, -BOX_RADIUS, 0,
		-BOX_RADIUS, 1+BOX_RADIUS, 0
	];
*/
	
	this.vbufLine = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbufLine);
	gl.bufferData(gl.ARRAY_BUFFER, 
		new glMatrixArrayType([
			LINE_WIDTH, 0, 0,
			LINE_WIDTH, 1, 0,
			-LINE_WIDTH, 0, 0,
			-LINE_WIDTH, 1, 0
		]), gl.STATIC_DRAW);

	// texture coordinates
	/** @todo could either keep this buffer dummy, or just disable it during rendering */
	var texcoord = [];
	for (var i = 0; i < 4; i++) {
		texcoord = texcoord.concat([0, 0, 0]);
	}

	this.tbufLine = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbufLine);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoord), gl.STATIC_DRAW);

	// color mapping
	var colors = [];
	for (var i = 0; i < vertices.length / 3; i++) {
		colors = colors.concat([1, 0, 0, 1]);
	}
	
	this.cbufLine = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.cbufLine);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
}

/**
 * Draw all instances of EditorCollisionLine 
 */
CollisionTool.render = function() {

	renderLines();
}

/**
 * Locates a collision line within range of the coordinates
 * @return EditorCollisionLine or null if one is not within range
 */
CollisionTool.getCollisionLine = function(position) {
	return null;
}

/**
 * @return the newly created EditorCollisionLine, or null if one could not be added
 */
CollisionTool.createCollisionLine = function(position) {
	return null;
}

/**
 * Select the collision line under the cursor, or clear currently selected
 * if there's nothing. 
 * @param position vec3 world coordinate of the cursor
 */
CollisionTool.onLeftMouseDown = function(position) {
	this.ldrag = true;
	
	this.grabbed = getCollisionLine(position);
	
	// calculate an offset from the grabbed and our cursor
	if (this.grabbed != null) {

		this.grabOffset = vec3.create(this.grabbed.translation);
		vec3.subtract(this.grabOffset, position);
	}
}

/**
 * @param position vec3 world coordinate of the cursor
 */
CollisionTool.onLeftMouseUp = function(position) {
	this.ldrag = false;
}

/**
 * @param position vec3 world coordinate of the cursor
 */
CollisionTool.onRightMouseDown = function(position) {
	this.rdrag = true;
	this.grabbed = this.createCollisionLine(position);
}

/**
 * If we were placing a new CollisionLine, determine whether it meets
 * minimum length standards, and delete if not. If it does, stop grabbing
 * and leave it as-is
 * @param position vec3 world coordinate of the cursor
 */
CollisionTool.onRightMouseUp = function(position) {
	this.rdrag = false;
	
	if (this.grabbed != null) {
		if (this.grabbed.length() < CollisionTool.MINIMUM_COLLISIONLINE_LENGTH) {
			// @todo delete grabbed from the list
		}
		
		this.grabbed = null;
	}
}

/**
 * If dragging a collision line, translate it. 
 * If rotating/scaling, 
 * @param position vec3 new world coordinate of the cursor
 */
CollisionTool.onMouseMove = function(position) {
		
	// If we're dragging an object
	if (this.grabbed != null) {
		if (this.ldrag) {
			
			if (this.deforming) { // translate the final point, and recalculate 
			
				// this would use moveFinalPoint, but we need to calculate a new 
				// point based on our cursors offset when clicked, etc. 
			
			} else { // just translate the intial point
			
				var newpos = vec3.create(position);
				vec3.add(newpos, this.grabOffset);
				
				this.grabbed.moveInitialPoint(newpos);
			}
			
		} else if (this.rdrag) { // final point tracks cursor
			
			this.grabbed.moveFinalPoint(position);
		}
	}
}

CollisionTool.onKeyDown = function(keycode) {
	
	if (keycode == 'S') {
		this.deforming = true;
	}
}

CollisionTool.onKeyUp = function(keycode) {
	
	if (keycode == 'S') {
		this.deforming = false;
	
	} else if (keycode == 'delete key' && this.grabbed != null) {
		
		// delete grabbed
		this.grabbed = null;
	}
}

/** Render point to point line for all collision lines */
CollisionTool.renderLines = function() {
	// Set up buffers to use
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbufLine);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
							3, gl.FLOAT, false, 0, 0);

	// Switch to color-only mode for the shader
	gl.uniform1i(shaderProgram.useColorUniform, 1);

	// Set the colors attribute for the vertices.
	gl.bindBuffer(gl.ARRAY_BUFFER, this.cbufLine);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
							4, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbufLine);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 
							2, gl.FLOAT, false, 0, 0);
	
	// draw all lines
	for (line in this.lines) {
		
		mvPushMatrix();

		// perform our stored rotation/scale/translation
		mat4.multiply(gl.mvMatrix, line.transmat);
	
		setMatrixUniforms();
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		
		mvPopMatrix();
	}
}

/** Render anchor rectangles for all collision lines 
 * @todo may not use this method. May only draw the selected/hovered lines anchor instead
 */
/*CollisionTool.renderAnchors = function() {
	// Set up buffers to use
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbufAnchor);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
							3, gl.FLOAT, false, 0, 0);

	// Switch to color-only mode for the shader
	gl.uniform1i(shaderProgram.useColorUniform, 1);

	// Set the colors attribute for the vertices.
	gl.bindBuffer(gl.ARRAY_BUFFER, this.cbufAnchor);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
							4, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbufAnchor);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 
							2, gl.FLOAT, false, 0, 0);
	
	// draw all lines
	for (line in this.lines) {
		
		mvPushMatrix();

		// perform our stored rotation/scale/translation
		mat4.multiply(gl.mvMatrix, line.transmat);
	
		setMatrixUniforms();
		gl.drawArrays(gl.TRIANGLES, 0, this.vbufAnchor.count);
		
		mvPopMatrix();
	}
}*/


