
/*
	Both RenderableBox and RenderableRect need origin, rotation, etc.
	
	Really, there needs to be a Renderable primitive
	then we have RenderableImage over that (or whatever), etc. 
*/

function RenderableBox(width, height, thickness, color) {
	this.width = width;
	this.height = height;
	this.thickness = thickness;

	this.hRect = new RenderableRect(width, thickness, color);
	this.vRect = new RenderableRect(thickness, width - 2*thickness, color);
}

RenderableBox.prototype.render = function(position) {
	mvPushMatrix();

	mat4.translate(gl.mvMatrix, position);

	// top/bottom
	this.hRect.render([0, this.height - this.thickness, 0]);
	this.hRect.render([0, 0, 0]);
	
	// left/right
	this.vRect.render([0, this.thickness, 0]);
	this.vRect.render([this.width - this.thickness, this.thickness, 0]);

	mvPopMatrix();
}

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

RenderableRect.prototype.render = function(position) {

	mvPushMatrix();

	// Position itself correctly
	mat4.translate(gl.mvMatrix, position);

	// Set up buffers to use
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
							this.vbuf.itemSize, gl.FLOAT, false, 0, 0);

	gl.uniform4f(shaderProgram.colorUniform, 
					this.color[0], this.color[1], 
					this.color[2], this.color[3]);
	
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vbuf.itemCount);
	
	mvPopMatrix();
}
