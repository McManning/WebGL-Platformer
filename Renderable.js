
/**
 * Base class for renderable primitives
 */
function Renderable() {
	this.rotation = 0.0;
	this.scale = 1.0;
	this.useSrcAlpha = false;
	this.width = 0;
	this.height = 0;
	this.position = vec3.create();

	this.color = [0.0, 0.0, 0.0, 0.0]; // @todo vec4 or something
}

Renderable.prototype.beginDraw = function() {

	mvPushMatrix();

	mat4.translate(gl.mvMatrix, this.getCenter());
	
	if (this.rotation != 0.0) {
		mat4.rotateZ(gl.mvMatrix, this.rotation);
	}

	// offset from origin would be here
	
	if (this.useSrcAlpha) {
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);
	//	gl.disable(gl.DEPTH_TEST);
	} else {
		gl.disable(gl.BLEND);
	//	gl.enable(gl.DEPTH_TEST);
	}
	
	gl.uniform4f(shaderProgram.colorUniform, 
				this.color[0], this.color[1],
				this.color[2], this.color[3]);
	
}

Renderable.prototype.endDraw = function() {

	mvPopMatrix();
}

/**
 * Determines if this renderable intersects a given point and takes in account
 * rotation/scaling/etc. 
 * @param pos vec3 world coordinate to test
 * @return true if pos is within our rectangle, false otherwise
 */
Renderable.prototype.intersectsBoundingBox = function(pos) {
	
	var dp = vec3.create(pos);
	vec3.subtract(dp, this.position);
	
	//this.localizePoint(dp);

	if (this.rotation != 0.0) {

		// rotate the test point in the opposite direction
		var c = Math.cos(-this.rotation);
		var s = Math.sin(-this.rotation);
		
		var r = vec3.create(dp);
		r[0] = dp[0] * c - dp[1] * s;
		r[1] = dp[0] * s + dp[1] * c;
		vec3.set(r, dp);
	}
	
	var w = this.width * this.scale * 0.5;
	var h = this.height * this.scale * 0.5;

	return (dp[0] >= -w && dp[0] <= w 
			&& dp[1] >= -h && dp[1] <= h);
}

/**
 * Calculates the top right corner of our box, factoring in scale and rotation
 * @return vec3 position of the top right point of our box
 */
Renderable.prototype.getTopRight = function() {

	var p = vec3.create();
	p[0] = this.width * 0.5;
	p[1] = this.height * 0.5;

	this.localizePoint(p);

	return p;
}

Renderable.prototype.getTopLeft = function() {

	var p = vec3.create();
	p[0] = -this.width * 0.5;
	p[1] = this.height * 0.5;

	this.localizePoint(p);

	return p;
}

Renderable.prototype.getBottomRight = function() {
	
	var p = vec3.create();
	p[0] = this.width * 0.5;
	p[1] = -this.height * 0.5;

	this.localizePoint(p);

	return p;
}

Renderable.prototype.getBottomLeft = function()  {
	
	var p = vec3.create();
	p[0] = -this.width * 0.5;
	p[1] = -this.height * 0.5;
	
	this.localizePoint(p);
	return p;
}

/**
 * Will apply this Renderable's translation/scale to the supplied vec3
 * @param pos vec3 point relative to the center of the Renderable
 * @return pos
 */
Renderable.prototype.localizePoint = function(pos) {

	var x = pos[0] * this.scale;
	var y = pos[1] * this.scale;
	var r = this.rotation;
	
	if (r != 0.0) {
		var c = Math.cos(r);
		var s = Math.sin(r);
		pos[0] = x * c - y * s;
		pos[1] = x * s + y * c;
	} else {
		pos[0] = x;
		pos[1] = y;
	}
	
	return pos;
}

Renderable.prototype.getCenter = function() {
	return this.position;
}

//////////////////////////////////////////////////////////////////

function RenderableBox(width, height, thickness, color) {
	this.width = width;
	this.height = height;
	this.thickness = thickness;
	this.color = color;

	this.hRect = new RenderableRect(width, thickness, color);
	this.vRect = new RenderableRect(thickness, width - 2*thickness, color);
}

RenderableBox.prototype = new Renderable();

RenderableBox.prototype.setScale = function(val) {
	this.scale = val;
	
	/*
	var w = this.width;
	var t = this.thickness;

	// Resize the children, rather than scaling them to maintain thickness
	this.hRect.resize(w*val, t);
	this.vRect.resize(t, h*val - 2*t);
	*/
	this.resize(this.width, this.height);
}

/** 
 * Change box dimensions without applying a scale
 */
RenderableBox.prototype.resize = function(w, h) {
	this.width = w;
	this.height = h;
	
	var s = this.scale;
	var t = this.thickness;

	this.hRect.resize(w*s, t);
	this.vRect.resize(t, h*s - 2*t);
}

RenderableBox.prototype.render = function() {

	this.beginDraw();
	
	var h = this.height * this.scale * 0.5;
	var w = this.width * this.scale * 0.5;
	var t = this.thickness * 0.5;
	
	// top/bottom
	this.hRect.position = [0, h - t, 0];
	this.hRect.render();
	
	this.hRect.position = [0, -h + t, 0];
	this.hRect.render();
	
	// left/right
	this.vRect.position = [-w + t, 0, 0];
	this.vRect.render();
	
	this.vRect.position = [w - t, 0, 0];
	this.vRect.render();

	this.endDraw();
}

//////////////////////////////////////////////////////////////////

function RenderableRect(width, height, color) {
	this.width = width;
	this.height = height;
	this.color = color;
	
	if (color == null || color.length < 3) {
		throw "Invalid color array length";
	}
	
	color[3] = 1.0; // To prevent using the last texture 
	// @todo allow alpha channel to override in the shader, giving transparent rects
	
	this.buildVertexBuffer();
	
}

RenderableRect.prototype = new Renderable();

RenderableRect.prototype.render = function() {

	this.beginDraw();

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
							this.vbuf.itemSize, gl.FLOAT, false, 0, 0);

	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vbuf.itemCount);
	
	this.endDraw();

}

RenderableRect.prototype.setScale = function(val) {
	this.scale = val;

	this.buildVertexBuffer();
}

RenderableRect.prototype.resize = function(w, h) {
	
	this.width = w;
	this.height = h;

	this.buildVertexBuffer();
}

RenderableRect.prototype.buildVertexBuffer = function() {
	
	if (this.vbuf)
		gl.deleteBuffer(this.vbuf);
		
	var w = this.width * this.scale * 0.5;
	var h = this.height * this.scale * 0.5;
	
	this.vbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);

	// triangle strip form (since there's no GL_QUAD)
	gl.bufferData(gl.ARRAY_BUFFER, 
		new glMatrixArrayType([
			w, -h, 0.0, // bottom right
			w, h, 0.0, // top right
			-w, -h, 0.0, // bottom left
			-w, h, 0.0 // top left
		]), gl.STATIC_DRAW);
		
		
	this.vbuf.itemSize = 3;
	this.vbuf.itemCount = 4;

}

//////////////////////////////////////////////////////////////////

function RenderableImage(url, width, height) {
	this.width = width;
	this.height = height;
	this.flipped = false;
	this.hue = 0.0;
	
	// create texture from image
	this.texture = loadTexture(url);

	this.buildVertexBuffer();
	this.buildTextureBuffer();
	
	// @todo create normal mapping
}

RenderableImage.prototype = new Renderable();

RenderableImage.prototype.render = function() {

	this.beginDraw();

	// Set up buffers to use
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
							this.vbuf.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 
							this.tbuf.itemSize, gl.FLOAT, false, 0, 0);
		
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	gl.uniform1i(shaderProgram.samplerUniform, 0);
	
	
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vbuf.itemCount);
	
	this.endDraw();
}

RenderableImage.prototype.setScale = function(val) {
	this.scale = val;

	this.buildVertexBuffer();
}

RenderableImage.prototype.buildVertexBuffer = function() {
	
	if (this.vbuf)
		gl.deleteBuffer(this.vbuf);
		
	var w = this.width * this.scale * 0.5;
	var h = this.height * this.scale * 0.5;
	
	this.vbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);

	// triangle strip form (since there's no GL_QUAD)
	gl.bufferData(gl.ARRAY_BUFFER, 
		new glMatrixArrayType([
			w, -h, 0.0, // bottom right
			w, h, 0.0, // top right
			-w, -h, 0.0, // bottom left
			-w, h, 0.0 // top left
		]), gl.STATIC_DRAW);
		
		
	this.vbuf.itemSize = 3;
	this.vbuf.itemCount = 4;

}

RenderableImage.prototype.buildTextureBuffer = function() {
	
	if (this.tbuf)
		gl.deleteBuffer(this.tbuf);
		
	// Create texture mapping
	this.tbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
	
	if (this.flipped) {
		gl.bufferData(gl.ARRAY_BUFFER, 
			new glMatrixArrayType([
				0.0, 0.0,
				0.0, 1.0,
				1.0, 0.0,
				1.0, 1.0
			]), gl.STATIC_DRAW);
	} else {
		gl.bufferData(gl.ARRAY_BUFFER, 
			new glMatrixArrayType([
				1.0, 0.0,
				1.0, 1.0,
				0.0, 0.0,
				0.0, 1.0
			]), gl.STATIC_DRAW);
	}
		
	this.tbuf.itemSize = 2;
	this.tbuf.itemCount = 4;

}

RenderableImage.prototype.flipHorizontal = function() {
	this.flipped = !this.flipped;

	this.buildTextureBuffer();
}

//////////////////////////////////////////////////////////////////

/**
 * Draws various icons for a Renderable object 
 */
function RenderableDebugger() {
	this.debugTR = new RenderableRect(8, 8, [1, 0, 0]);
	this.debugBR = new RenderableRect(8, 8, [0, 0, 1]);
	this.debugBL = new RenderableRect(8, 8, [0, 1, 1]);
	this.debugTL = new RenderableRect(8, 8, [1, 1, 0]);
	this.debugC = new RenderableRect(8, 8, [1, 0, 1]);
}

RenderableDebugger.prototype.render = function(parent) {

	// DEBUGGING
	this.debugTR.position = parent.getTopRight();
	vec3.add(this.debugTR.position, parent.getCenter());
	this.debugBR.position = parent.getBottomRight();
	vec3.add(this.debugBR.position, parent.getCenter());
	this.debugBL.position = parent.getBottomLeft();
	vec3.add(this.debugBL.position, parent.getCenter());
	this.debugTL.position = parent.getTopLeft();
	vec3.add(this.debugTL.position, parent.getCenter());
	this.debugC.position = vec3.create(parent.getCenter());

	this.debugTR.render();
	this.debugBR.render();
	this.debugBL.render();
	this.debugTL.render();
	this.debugC.render();
}


