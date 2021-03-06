

var gl;

// globals that shouldn't be globals
var shaderProgram;

var g_pressedKeys = new Array();

function loadFragmentShader() {
	var shader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(shader, g_fragmentShader);

	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw ("Fragment Shader Error: " + gl.getShaderInfoLog(shader));
	}
	else
	{
		gl.attachShader(shaderProgram, shader);
	}
}

function loadVertexShader() {
	var shader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(shader, g_vertexShader);
	
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw ("Vertex Shader Error: " + gl.getShaderInfoLog(shader));
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
	shaderProgram.HSVShiftUniform = gl.getUniformLocation(shaderProgram, "uHSVShift");
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

	position : vec3.create(), /**< Our position would be the same as the canvas
									@todo type convert to rect? */

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

		result[0] += x;
		result[1] += (gl.viewportHeight - y);

		return result;
	},
	
	canvasVec3ToWorld : function(pos) {

		var result = vec3.create(this.position);
		result[0] += pos[0];
		result[1] += (gl.viewportHeight - pos[1]);

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
	
	MapEditor.initialize();
	ResourceManager.initialize();
	
	mypic = new RenderableImage("./test.png", 512, 512); //484, 531);
	mypic.rotation = 0.78539;
	mypic.useSrcAlpha = true;
	//mypic.position = [500, 0, 0];

	background = new RenderableImage("./background.png", 640*2, 480*2);
	background.position[0] = 1000;
	
	testrect = new RenderableBox(300, 300, 10, [0.5, 0, 0.5]);
	testrect.position = [100, 0, 0];

	g_activeTool = new PropEditTool();
	
	gl.clearColor(1.0, 0.5, 0.5, 1.0);
	//gl.enable(gl.DEPTH_TEST);
	
	//gl.enable(gl.BLEND);

	heartbeat();
}

function heartbeat() {
	
	// hook this function to be called next redraw 
	requestAnimFrame(heartbeat); 
	
	// stuff that should go into steady timers...
	handleKeyboard();
	MapEditor.onUpdate();
	if (g_activeTool != null) {
		g_activeTool.onUpdate();
	}
	
	drawScene();
	framerate.snapshot();
}

/**
 * Doodle stuff here
 */
function drawScene() {
	
	MapCamera.setupViewport();

	background.render();
	testrect.render();
	mypic.render();
	MapEditor.renderableDebug.render(mypic);
	
	MapEditor.render();
	
	if (g_activeTool != null) {
		g_activeTool.render();
	}
}

/**
 * Helper function to determine where exactly in the canvas the cursor is located
 * @return vec3 result, from (0,0) to (gl.viewportWidth,gl.viewportHeight)
 * @todo may return negatives, and points outside the canvas. Need to ensure cursor is IN the canvas!
 */
function getCursorPositionInCanvas(e) {
	var result = vec3.create();
	
	if (e.pageX || e.pageY) { 
		result[0] = e.pageX;
		result[1] = e.pageY;
	} else { 
		result[0] = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
		result[1] = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
	} 
	result[0] -= gl.canvas.offsetLeft;
	result[1] -= gl.canvas.offsetTop;
	
	return result;
}


//////////////////////////////////////////////////////////////////

function bindEvents(canvas) {
	
	canvas.onmousedown = onMouseDown;
	
	// These were document
    document.onmouseup = onMouseUp;
    document.onmousemove = onMouseMove;
	
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
	g_pressedKeys.length = 0;
}

/**
 * Window regained focus, reactivate inputs and certain events
 */
function onFocus() {
    console.log("focus");
	
}

function onKeyDown(e) {
	e = e || window.event;

	g_pressedKeys[e.keyCode] = true;
	
	if (g_activeTool != null) {
		g_activeTool.onKeyDown(e.keyCode);
	}
	
	// override Page up/down keys
	// @todo better placement of things like this
	if (e.keyCode == 33 || e.keyCode == 34) {
		//e.preventDefault(); // only for ctrl/alt shortcuts
		return false;
	}

}

function onKeyUp(e) {
	e = e || window.event; // @todo why?
	
	console.log("Key code: " + e.keyCode);

	// @todo still doesn't work to clear the keyboard. Figure out a method!!!
	delete g_pressedKeys[e.keyCode];
	
	if (g_activeTool != null) {
		g_activeTool.onKeyUp(e.keyCode);
	}
}

function onMouseDown(e) {

	var pos = getCursorPositionInCanvas(e);
	var prop;
	
	console.log("pos raw: " + vec3.str(pos));

	// @todo right/left check. For now, assume right functionality
	if (g_activeTool != null) {
		g_activeTool.onMouseDown(pos);
	}
}

function onMouseUp(e) {

	var pos = getCursorPositionInCanvas(e);

	// @todo right/left check. For now, assume right functionality
	if (g_activeTool != null) {
		g_activeTool.onMouseUp(pos);
	}
}

var g_mousePosition = vec3.create();

// @todo move this to the proper location!
vec3.equal = function(a, b) {
	return (a[0] == b[0] && a[1] == b[1] && a[2] == b[2]);
};

/** Fired every time the mouse moves, keep lightweight */
function onMouseMove(e) {
	g_mousePosition = getCursorPositionInCanvas(e);
}


// @todo BUG: If press, drag, click out of focus, it'll KEEP MOVING the camera and can't get it to stop!
// Sometimes just a random double click in the window will make it happen too!
// It's pretty common, really. Need to figure out solutions!
function handleKeyboard() {

	// Camera binds
	if (g_pressedKeys[87]) { // up 
		MapCamera.position[1] += 10.0;
	}
	if (g_pressedKeys[83]) { // down
		MapCamera.position[1] -= 10.0;
	}
	if (g_pressedKeys[65]) { // left
		MapCamera.position[0] -= 10.0;
	}
	if (g_pressedKeys[68]) { // right
		MapCamera.position[0] += 10.0;
	}
}

