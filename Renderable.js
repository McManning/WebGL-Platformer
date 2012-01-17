
RenderableOffset = {
	CENTER : 1,
	BOTTOM_LEFT : 2,
	BOTTOM_CENTER : 3,
}

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
	
	this.setOffset(RenderableOffset.BOTTOM_LEFT);
}

Renderable.prototype.setOffset = function(offsetType) {
	
	switch (offsetType) {
		case RenderableOffset.CENTER:
			this.offset = [-this.width*0.5, -this.height*0.5, 0.0];
			break;
		case RenderableOffset.BOTTOM_CENTER:
			this.offset = [-this.width*0.5, 0.0, 0.0];
			break;
		default: // RenderableOffset.BOTTOM_LEFT
			this.offset = [0.0, 0.0, 0.0];
			break;
	}
}

Renderable.prototype.beginDraw = function() {
	
	mvPushMatrix();

	mat4.translate(gl.mvMatrix, this.position);
	
	if (this.rotation != 0.0) {
		mat4.rotateZ(gl.mvMatrix, this.rotation);
	}
	
	//var p = vec3.create(this.offset);
	//vec3.scale(this.offset, this.scale);
	mat4.translate(gl.mvMatrix, this.offset);
	
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
/*
	if (this.rotation != 0.0) {

		// rotate the test point in the opposite direction
		var c = Math.cos(-this.rotation);
		var s = Math.sin(-this.rotation);
		
		var r = vec3.create(dp);
		r[0] = dp[0] * c - dp[1] * s;
		r[1] = dp[0] * s + dp[1] * c;
		vec3.set(r, dp);
	}
	*/
/*	
	// inversely localize the point
	var x = dp[0] * this.scale;
	var y = dp[1] * this.scale;
	var r = -this.rotation;
	
	if (r != 0.0) {
		var c = Math.cos(r);
		var s = Math.sin(r);
		dp[0] = x * c - y * s;
		dp[1] = x * s + y * c;
	} else {
		dp[0] = x;
		dp[1] = y;
	}
	
	var scaledOffset = vec3.create(this.offset);
	vec3.scale(this.offset, this.scale);
	
	vec3.subtract(dp, scaledOffset);
	console.log("dp: " + vec3.str(dp));
	*/

	return (dp[0] >= 0 && dp[0] <= this.width * this.scale 
			&& dp[1] >= 0 && dp[1] <= this.height * this.scale);
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
	//vec3.scale(this.offset, val);
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

RenderableBox.prototype.render = function(position) {

	this.beginDraw();
	
	var h = this.height * this.scale;
	var w = this.width * this.scale;
	var t = this.thickness;
	
	// top/bottom
	this.hRect.position = [0, h - t, 0];
	this.hRect.render();
	
	this.hRect.position = [0, 0, 0];
	this.hRect.render();
	
	// left/right
	this.vRect.position = [0, t, 0];
	this.vRect.render();
	
	this.vRect.position = [w - t, t, 0];
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
	//vec3.scale(this.offset, val);
	
	if (this.vbuf)
		gl.deleteBuffer(this.vbuf);
	
	this.buildVertexBuffer();
}

RenderableRect.prototype.resize = function(w, h) {
	
	this.width = w;
	this.height = h;
	
	if (this.vbuf)
		gl.deleteBuffer(this.vbuf);
	
	this.buildVertexBuffer();
}

RenderableRect.prototype.buildVertexBuffer = function() {
	
	var w = this.width;
	var h = this.height;
	var s = this.scale;
	
	this.vbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);

	// triangle strip form (since there's no GL_QUAD)
	gl.bufferData(gl.ARRAY_BUFFER, 
		new glMatrixArrayType([
			w*s, 0.0, 0.0, // bottom right
			w*s, h*s, 0.0, // top right
			0.0, 0.0, 0.0, // bottom left
			0.0, h*s, 0.0 // top left
		]), gl.STATIC_DRAW);
		
	this.vbuf.itemSize = 3;
	this.vbuf.itemCount = 4;
}

//////////////////////////////////////////////////////////////////

function RenderableImage(url, width, height) {
	this.width = width;
	this.height = height;
	
	// create texture from image
	this.texture = loadTexture(url);

	this.buildVertexBuffer();

	// Create texture mapping
	this.tbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
	
	gl.bufferData(gl.ARRAY_BUFFER, 
		new glMatrixArrayType([
			1.0, 0.0,
			1.0, 1.0,
			0.0, 0.0,
			0.0, 1.0
		]), gl.STATIC_DRAW);
		
	this.tbuf.itemSize = 2;
	this.tbuf.itemCount = 4;

	// @todo create normal mapping
	
	this.debugTR = new RenderableRect(8, 8, [1, 0, 0]);
	this.debugTR.setOffset(RenderableOffset.CENTER);
	
	this.debugBR = new RenderableRect(8, 8, [0, 0, 1]);
	this.debugBR.setOffset(RenderableOffset.CENTER);
	
	this.debugBL = new RenderableRect(8, 8, [0, 1, 1]);
	this.debugBL.setOffset(RenderableOffset.CENTER);
	
	this.debugTL = new RenderableRect(8, 8, [1, 1, 0]);
	this.debugTL.setOffset(RenderableOffset.CENTER);
	
	this.debugC = new RenderableRect(8, 8, [1, 0, 1]);
	this.debugC.setOffset(RenderableOffset.CENTER);
	
	
}

RenderableImage.prototype = new Renderable();

RenderableImage.prototype.render = function() {

	//this.beginDraw();
	
	mvPushMatrix();

	mat4.translate(gl.mvMatrix, this.getCenter());
	
	if (this.rotation != 0.0) {
		mat4.rotateZ(gl.mvMatrix, this.rotation);
	}
	
	//var p = vec3.create(this.offset);
	//vec3.scale(this.offset, this.scale);
	//mat4.translate(gl.mvMatrix, this.offset);
	
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
	
	// DEBUGGING
	this.debugTR.position = this.getTopRight();
	this.debugBR.position = this.getBottomRight();
	this.debugBL.position = this.getBottomLeft();
	this.debugTL.position = this.getTopLeft();
	this.debugC.position = this.getCenter();
	
	this.debugTR.render();
	this.debugBR.render();
	this.debugBL.render();
	this.debugTL.render();
	this.debugC.render();
}

RenderableImage.prototype.setScale = function(val) {
	this.scale = val;
	
	// @todo Should offsets scale with the object?
	// calculate new offset
	//this.offset[0] = this.width * val * 0.5;
	//this.offset[1] = this.height * val * 0.5;
	
	if (this.vbuf)
		gl.deleteBuffer(this.vbuf);
	
	this.buildVertexBuffer();
}

RenderableImage.prototype.buildVertexBuffer = function() {
	
	var w = this.width;
	var h = this.height;
	var s = this.scale;
	
	this.vbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);

	// triangle strip form (since there's no GL_QUAD)
	gl.bufferData(gl.ARRAY_BUFFER, 
		new glMatrixArrayType([
			w*s, 0.0, 0.0, // bottom right
			w*s, h*s, 0.0, // top right
			0.0, 0.0, 0.0, // bottom left
			0.0, h*s, 0.0 // top left
		]), gl.STATIC_DRAW);
		
	this.vbuf.itemSize = 3;
	this.vbuf.itemCount = 4;
}

/**
 * Calculates the top right corner of our box, factoring in scale and rotation
 * @return vec3 position of the top right point of our box
 */
RenderableImage.prototype.getTopRight = function() {

	var p = vec3.create();
	p[0] = this.width;
	p[1] = this.height;
	vec3.add(p, this.offset);
	
	this.localizePoint(p);
	vec3.add(p, this.getCenter());
	
	return p;
}

RenderableImage.prototype.getTopLeft = function() {

	var p = vec3.create();
	p[1] = this.height;
	vec3.add(p, this.offset);
	
	this.localizePoint(p);
	vec3.add(p, this.getCenter());
	
	return p;
}

RenderableImage.prototype.getBottomRight = function() {
	
	var p = vec3.create();
	p[0] = this.width;
	vec3.add(p, this.offset);
	
	this.localizePoint(p);
	vec3.add(p, this.getCenter());
	
	return p;
}

RenderableImage.prototype.getBottomLeft = function()  {
	
	var p = vec3.create(this.offset);
	this.localizePoint(p);
	vec3.add(p, this.getCenter());
	
	return p;
}

/**
 * Will apply this Renderable's translation/scale to the supplied vec3
 * @param pos vec3 point relative to the center of the Renderable
 * @return pos
 */
RenderableImage.prototype.localizePoint = function(pos) {

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

RenderableImage.prototype.getCenter = function() {
	return this.position;
}
