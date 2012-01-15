
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

	if (this.rotation != 0.0) {

		// rotate the test point in the opposite direction
		var c = Math.cos(-this.rotation);
		var s = Math.sin(-this.rotation);
		
		var r = vec3.create(dp);
		r[0] = dp[0] * c - dp[1] * s;
		r[1] = dp[0] * s + dp[1] * c;
		vec3.set(r, dp);
	}
	
	vec3.subtract(dp, this.offset);

	// @TODO: Factor in scaling, when we get to that point!

	return (dp[0] >= 0 && dp[0] <= this.width && dp[1] >= 0 && dp[1] <= this.height);
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

RenderableBox.prototype.render = function(position) {
	
	this.beginDraw();

	// top/bottom
	this.hRect.position = [0, this.height - this.thickness, 0];
	this.hRect.render();
	
	this.hRect.position = [0, 0, 0];
	this.hRect.render();
	
	// left/right
	this.vRect.position = [0, this.thickness, 0];
	this.vRect.render();
	
	this.vRect.position = [this.width - this.thickness, this.thickness, 0];
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

	// create buffers, lack of immediate mode in WebGL forces us to do this
	this.vbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);

	// triangle strip form (since there's no GL_QUAD)
	gl.bufferData(gl.ARRAY_BUFFER, 
		new glMatrixArrayType([
			width, 0.0, 0.0, // bottom right
			width, height, 0.0, // top right
			0.0,   0.0, 0.0, // bottom left
			0.0,   height, 0.0 // top left
		]), gl.STATIC_DRAW);
		
	this.vbuf.itemSize = 3;
	this.vbuf.itemCount = 4;
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

//////////////////////////////////////////////////////////////////

function RenderableImage(url, width, height) {
	this.width = width;
	this.height = height;
	
	// create texture from image
	this.texture = loadTexture(url);

	// create buffers, lack of immediate mode in WebGL forces us to do this
	this.vbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);

	// triangle strip form (since there's no GL_QUAD)
	gl.bufferData(gl.ARRAY_BUFFER, 
		new glMatrixArrayType([
			width, 0.0, 0.0, // bottom right
			width, height, 0.0, // top right
			0.0,   0.0, 0.0, // bottom left
			0.0,   height, 0.0 // top left
		]), gl.STATIC_DRAW);
		
	this.vbuf.itemSize = 3;
	this.vbuf.itemCount = 4;

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

