

var gl;

// globals that shouldn't be globals
var shaderProgram;

var g_pressedKeys = {};

function loadFragmentShader() {
	var shader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(shader, 
"\
precision highp float; \
varying vec2 vTextureCoord; \
uniform sampler2D uSampler; \
uniform vec4 uColor; \
void main(void) { \
	if (uColor.a < 1.0) { \
		gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)); \
		if (uColor.a > 0.0) { \
			gl_FragColor = gl_FragColor * uColor; /* @todo better blending */ \
		} \
	} else { \
		gl_FragColor = uColor; \
	} \
} \
");

	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("Fragment Shader Error: " + gl.getShaderInfoLog(shader));
	}
	else
	{
		gl.attachShader(shaderProgram, shader);
	}
}

function loadVertexShader() {
	var shader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(shader,
"\
attribute vec3 aVertexPosition; \
attribute vec2 aTextureCoord; \
uniform mat4 uMVMatrix; \
uniform mat4 uPMatrix; \
uniform vec4 uColor; \
varying vec2 vTextureCoord; \
void main(void) { \
	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0); \
	vTextureCoord = aTextureCoord; \
} \
");
	
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("Vertex Shader Error: " + gl.getShaderInfoLog(shader));
	}
	else
	{
		gl.attachShader(shaderProgram, shader);
	}
}

// Shaders are mandatory in OGL ES to do any proper rendering
function initShaders() {

	shaderProgram = gl.createProgram();
	
	loadVertexShader();
	loadFragmentShader();
	
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Could not initialize shaders");
	}

	gl.useProgram(shaderProgram);

	// Hook variables
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

	shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "uColor");
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}

function initGL(canvas) {
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.canvas = canvas;
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		
		gl.mvMatrix = mat4.create();
		gl.pMatrix = mat4.create();
		
	} catch (e) {
	}
	if (!gl) {
		alert("No WebGL Support. Sux2bu");
	}
}	


//////////////////////////////////////////////////////////////////


RenderableOffset = {
	CENTER : 1,
	BOTTOM_LEFT : 2,
	BOTTOM_CENTER : 3,
}

function Renderable(url, width, height, offsetType) {
	this.rotation = 0.0;
	this.scale = 1.0;
	this.useSrcAlpha = false;
	this.width = width;
	this.height = height;
	
	// create texture from image
	if (url) {
		this.texture = loadTexture(url);
	} else {
		this.texture = null;
	}
	
	// create buffers, lack of immediate mode in WebGL forces us to do this
	this.vbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);

	switch (offsetType) {
		case RenderableOffset.CENTER:
			this.offset = [-width*0.5, -height*0.5, 0.0];
			break;
		case RenderableOffset.BOTTOM_CENTER:
			this.offset = [-width*0.5, 0.0, 0.0];
			break;
		default: // RenderableOffset.BOTTOM_LEFT
			this.offset = [0.0, 0.0, 0.0];
			break;
	}
	
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

Renderable.prototype.render = function(position) {

	mvPushMatrix();

	// Position itself correctly
	mat4.translate(gl.mvMatrix, position);
	
	if (this.rotation != 0.0) {
		mat4.rotateZ(gl.mvMatrix, this.rotation);
	}
	
	mat4.translate(gl.mvMatrix, this.offset);
	
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
	
	gl.uniform4f(shaderProgram.colorUniform, 0, 0, 0, 0);
	
	if (this.useSrcAlpha) {
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);
	//	gl.disable(gl.DEPTH_TEST);
	} else {
		gl.disable(gl.BLEND);
	//	gl.enable(gl.DEPTH_TEST);
	}
	
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vbuf.itemCount);
	
	mvPopMatrix();
}

function loadTexture(url) {
	var texture = gl.createTexture();
	texture.image = new Image();
	texture.image.onload = function() {
		configureImageTexture(texture); 
	}
	texture.image.src = url;
	return texture;
}

function configureImageTexture(texture) {
	
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);  
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);  
	
	// Supporting non power of two textures
	// See: http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	
	// Can't mipmap if want non-power-of-two via wrapping
	//gl.generateMipmap(gl.TEXTURE_2D); 

	gl.bindTexture(gl.TEXTURE_2D, null);
}


//////////////////////////////////////////////////////////////////


var mvMatrixStack = new Array();

function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	gl.mvMatrix = mvMatrixStack.pop();
}

function mvPushMatrix() {
	var copy = mat4.create();
	mat4.set(gl.mvMatrix, copy);
	mvMatrixStack.push(copy);
}

// upload matrix changes to the graphics card, since GL doesn't track local changes
function setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, gl.pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, gl.mvMatrix);
}


MapCamera = {

	position : vec3.create(),

	setupViewport : function() {
	
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		// set up projection matrix
		mat4.ortho(0, gl.viewportWidth, 0, gl.viewportHeight, 0.0, 100.0, gl.pMatrix);
		
		// set up model view matrix
		mat4.identity(gl.mvMatrix);
		
		// Translate origin away from our camera
		var trans = vec3.create(this.position);
		trans[0] *= -1;
		trans[1] *= -1;
		
		mat4.translate(gl.mvMatrix, trans);
	},
	
	/**
	 * @return vec3 indicating the center of the canvas, in world coordinates
	 */
	getCenterPoint : function() {
		
		var center = vec3.create(this.position);
		center[0] += gl.viewportWidth * 0.5;
		center[1] += gl.viewportHeight * 0.5;

		return center;
	},
	
	/**
	 * @return vec3 world coordinates to match canvas (x, y)
	 */
	canvasToWorld : function(x, y) {
		
		var result = vec3.create(this.position);
		
		//point.xy + camera.xy - canvas.xy
		// assuming xy are relative to the canvas at this point and not the document
		
		y = (gl.viewportHeight - y);
		result[0] += x;
		result[1] += y;
		
		console.log("canvas " + x + "," + y + " > world " + vec3.str(result));
		
		return result;
	}

};


//////////////////////////////////////////////////////////////////


var mypic;
var background;
var testrect;

var g_activeTool = null;

function start() {
	var canvas = document.getElementById("ogl_canvas");
	
	initGL(canvas);
	initShaders();

	bindEvents(canvas);
	
	framerate = new Framerate("framerate");
	
	//MapEditor.initialize();
	
	mypic = new Renderable("./test.png", 512, 512, RenderableOffset.CENTER); //484, 531);
	mypic.rotation = 0.78539;
	mypic.useSrcAlpha = true;
	
	background = new Renderable("./background.png", 640*2, 480*2, RenderableOffset.BOTTOM_LEFT);

	testrect = new RenderableBox(300, 300, 10, [0.5, 0, 0.5, 0.80]);
	//new RenderableRect(100, 100, [0.5, 0, 0.5, 1.0]);
	
	//MapCamera.setPosition([0.0, 0.0, 0.0]);
	
	gl.clearColor(1.0, 0.5, 0.5, 1.0);
	//gl.enable(gl.DEPTH_TEST);
	
	//gl.enable(gl.BLEND);

	heartbeat();
}

function bindEvents(canvas) {
	
	canvas.onmousedown = onMouseDown;
	
	// These were document
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;
	
	// @todo window versus document?
	window.onkeydown = onKeyDown;
    window.onkeyup = onKeyUp;

	window.onfocus = onFocus;
	window.onblur = onBlur;
}

/**
 * Window loses focus, kill inputs and certain events
 */
function onBlur() {
    console.log("blur");
	delete g_pressedKeys;
}

/**
 * Window regained focus, reactivate inputs and certain events
 */
function onFocus() {
    console.log("focus");
	
}

function heartbeat() {
	
	// hook this function to be called next redraw 
	requestAnimFrame(heartbeat); 
	
	handleKeyboard();
	drawScene();
	
	framerate.snapshot();
}

/**
 * Doodle stuff here
 */
function drawScene() {
	
	MapCamera.setupViewport();

	background.render([0.0, 0.0, 0.0]);
	
	testrect.render([100, 0, 0]);
	
	mypic.render([500, 0, 0]);
	
	if (g_activeTool != null) {
		g_activeTool.render();
	}
}

/**
 * Helper function to determine where exactly in the canvas the cursor is located
 * @return vec3 result, from (0,0) to (gl.viewportWidth,gl.viewportHeight)
 * @todo may return negatives, and points outside the canvas. Need to ensure cursor is IN the canvas!
 */
function getCursorPositionInCanvas(event) {
	var result = vec3.create();
	
	if (event.pageX || event.pageY) { 
		result[0] = event.pageX;
		result[1] = event.pageY;
	}
	else { 
		result[0] = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
		result[1] = event.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
	} 
	result[0] -= gl.canvas.offsetLeft;
	result[1] -= gl.canvas.offsetTop;
	
	return result;
}

function onKeyDown(e) {
	e = e || window.event;
	
	g_pressedKeys[e.keyCode] = true;
	
	if (g_activeTool != null) {
		g_activeTool.onKeyDown(e.keyCode);
	}
}

function onKeyUp(e) {
	e = e || window.event;
	
	console.log("Key code: " + e.keyCode);

	// @todo still doesn't work to clear the keyboard. Figure out a method!!!
	delete g_pressedKeys[e.keyCode];
	
	if (g_activeTool != null) {
		g_activeTool.onKeyUp(e.keyCode);
	}
}

function onMouseDown(e) {

	var pos = getCursorPositionInCanvas(e);
	console.log("pos raw: " + vec3.str(pos));
	
	// @todo right/left check. For now, assume right functionality
	if (g_activeTool != null) {
		g_activeTool.onRightMouseDown(pos);
	}
}

function onMouseUp(e) {

	var pos = getCursorPositionInCanvas(e);

	// @todo right/left check. For now, assume right functionality
	if (g_activeTool != null) {
		g_activeTool.onRightMouseUp(pos);
	}
}

function onMouseMove(e) {

	var pos = getCursorPositionInCanvas(e);

	if (g_activeTool != null) {
		g_activeTool.onMouseMove(pos);
	}
}


// @todo BUG: If press, drag, click out of focus, it'll KEEP MOVING the camera and can't get it to stop!
// Sometimes just a random double click in the window will make it happen too!
// It's pretty common, really. Need to figure out solutions!
function handleKeyboard() {

	// @todo time binding
	
	//for (e in g_pressedKeys) {
	//	console.log(e);
	//}

	// Camera binds
	if (g_pressedKeys[38]) { // up 
		MapCamera.position[1] += 10.0;
	}
	if (g_pressedKeys[40]) { // down
		MapCamera.position[1] -= 10.0;
	}
	if (g_pressedKeys[37]) { // left
		MapCamera.position[0] -= 10.0;
	}
	if (g_pressedKeys[39]) { // right
		MapCamera.position[0] += 10.0;
	}
}
