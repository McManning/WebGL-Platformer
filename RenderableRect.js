

function Cube() {

	this.vbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
        vertices = [
            // Front face
            -100.0, -100.0,  100.0,
             100.0, -100.0,  100.0,
             100.0,  100.0,  100.0,
            -100.0,  100.0,  100.0,

            // Back face
            -100.0, -100.0, -100.0,
            -100.0,  100.0, -100.0,
             100.0,  100.0, -100.0,
             100.0, -100.0, -100.0,

            // Top face
            -100.0,  100.0, -100.0,
            -100.0,  100.0,  100.0,
             100.0,  100.0,  100.0,
             100.0,  100.0, -100.0,

            // Bottom face
            -100.0, -100.0, -100.0,
             100.0, -100.0, -100.0,
             100.0, -100.0,  100.0,
            -100.0, -100.0,  100.0,

            // Right face
             100.0, -100.0, -100.0,
             100.0,  100.0, -100.0,
             100.0,  100.0,  100.0,
             100.0, -100.0,  100.0,

            // Left face
            -100.0, -100.0, -100.0,
            -100.0, -100.0,  100.0,
            -100.0,  100.0,  100.0,
            -100.0,  100.0, -100.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.vbuf.itemSize = 3;
        this.vbuf.numItems = 24;

        this.tbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
        var textureCoords = [
          // Front face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,

          // Back face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,

          // Top face
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,

          // Bottom face
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,

          // Right face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,

          // Left face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        this.tbuf.itemSize = 2;
        this.tbuf.numItems = 24;

        this.ibuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
        var cubeVertexIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
        this.ibuf.itemSize = 1;
        this.ibuf.numItems = 36;
		
}



Cube.prototype.render = function(position)
{
mvPushMatrix();

	position[0] += 100;
//	position[2] -= 100;

	mat4.translate(gl.mvMatrix, position);
	
//	mat4.rotate(gl.mvMatrix, Math.pi / 4, [1, 0, 0]);
//	mat4.rotate(gl.mvMatrix, 0.5, [0, 1, 0]);
//	mat4.rotate(gl.mvMatrix, Math.pi / 4, [0, 0, 1]);

		// Position itself correctly
	

	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vbuf.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.tbuf.itemSize, gl.FLOAT, false, 0, 0);

		
		
		
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, this.ibuf.numItems, gl.UNSIGNED_SHORT, 0);
		
	mvPopMatrix();
}


function RenderableRect(w, h, t) {
	this.width = w;
	this.height = h;
	this.thickness = t;

/*	var vertices = [
		0, 0, 0, 
		t, t, 0,
		0, h, 0,
		
		t, h-t, 0,
		w, h, 0,
		w-t, h-t, 0,
		w, 0, 0,
		w-t, t, 0,
	];

	var indices = [
	
		2,3,4,
		
		0, 1, 2,
		1, 3, 2,
		3, 2, 4,
		3, 5, 4,
		4, 5, 6,
		6, 5, 7,
		7, 1, 6
	];
*/
	var vertices = [
		
		w, h, 0,
		0, h, 0,
		0, 0, 0,
		
		0, 0, 0,
		-w, -h, 0,
		w, -h, 0,
		
	];

	this.vbuf = gl.createBuffer();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
	gl.bufferData(gl.ARRAY_BUFFER, 
					new Float32Array(vertices), 
					gl.STATIC_DRAW);
					
	this.vbuf.count = vertices.length / 3;

	
	var colors = [];
	for (var i = 0; i < vertices.length / 3; i++) {
		colors = colors.concat([1, 0, 0, 1]);
	}
	
	this.cbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.cbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	
	this.cbuf.count = colors.length / 4;
/*		
	var indices = [
		0,1,2,
		2,3,4
	];

	this.ibuf = gl.createBuffer();  
	this.ibuf.count = indices.length;

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);  
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 
					new Uint16Array(indices), 
					gl.STATIC_DRAW);
*/
}
				
  
RenderableRect.prototype.render = function(position) {

	mvPushMatrix();

	position[0] -= 100;
	
	// Position itself correctly
	mat4.translate(gl.mvMatrix, position);
	
	/*
	if (this.rotation != 0.0) {
		mat4.rotateZ(gl.mvMatrix, this.rotation);
	}
	
	mat4.translate(gl.mvMatrix, this.offset);
	*/
	
	// Set up buffers to use
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
							3, gl.FLOAT, false, 0, 0);

	// Switch to color-only mode for the shader
	gl.uniform1i(shaderProgram.useColorUniform, 1);
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
	
	// Set the colors attribute for the vertices.
	gl.bindBuffer(gl.ARRAY_BUFFER, this.cbuf);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
							4, gl.FLOAT, false, 0, 0);

		
							
	//gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
	
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLES, 0, this.vbuf.count);
	//gl.drawElements(gl.TRIANGLES, this.ibuf.count, gl.UNSIGNED_SHORT, 0); 
	
	mvPopMatrix();
}

  


function RenderableThing() {

	var vertices = [
		
		100.0, 	100.0, 	0,
		0, 		100.0, 	0,
		0,		0, 		0,
		
		
		0, 		0, 		0,
	   -100.0, -100.0,	0,
		100.0, -100.0, 	0,
		
	];

	this.vbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	this.vbuf.count = vertices.length / 3;

	
	// texture coordinates
	var texcoord = [];
	for (var i = 0; i < vertices.length / 3; i++) {
		texcoord = texcoord.concat([0, 0, 0]);
	}

	this.tbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoord), gl.STATIC_DRAW);
	this.tbuf.count = texcoord.length / 3;
	
	// color mapping
	var colors = [];
	for (var i = 0; i < vertices.length / 3; i++) {
		colors = colors.concat([1, 0, 0, 1]);
	}
	
	this.cbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.cbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	this.cbuf.count = colors.length / 4;
}
				
  
RenderableThing.prototype.render = function(position) {

	mvPushMatrix();

	position[0] -= 100;
	
	// Position itself correctly
	mat4.translate(gl.mvMatrix, position);
	
	// Set up buffers to use
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
							3, gl.FLOAT, false, 0, 0);

	// Switch to color-only mode for the shader
	gl.uniform1i(shaderProgram.useColorUniform, 1);

	
	// Set the colors attribute for the vertices.
	gl.bindBuffer(gl.ARRAY_BUFFER, this.cbuf);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
							4, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 
							2, gl.FLOAT, false, 0, 0);

/*	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.tbuf);
	gl.uniform1i(shaderProgram.samplerUniform, 0); */
							
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLES, 0, this.vbuf.count);

	mvPopMatrix();
}


