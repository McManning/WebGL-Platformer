
<?php

	$vs = file_get_contents('shaders/main.vert');
	$fs = file_get_contents('shaders/main.frag');
	
	// sanitize
	$vs = str_replace("\r", "", $vs);
	$fs = str_replace("\r", "", $fs);
	
	$vs = str_replace("\n", "\\\n", $vs);
	$fs = str_replace("\n", "\\\n", $fs);
?>

<html>
<head>

<script type="text/javascript">
	
var g_vertexShader = "<?php echo $vs; ?>";

var g_fragmentShader = "<?php echo $fs; ?>";
	
</script>

<script type="text/javascript" src="lib/webgl-utils.js"></script>
<script type="text/javascript" src="lib/glMatrix.js"></script>
<script type="text/javascript" src="lib/framerate.js"></script>
<script type="text/javascript" src="map.js"></script>
<script type="text/javascript" src="Renderable.js"></script>
<script type="text/javascript" src="tools/PropEditTool.js"></script>
<script type="text/javascript" src="main.js"></script>

</head>
<body onload="start()">

<canvas id="ogl_canvas" style="position:absolute; top:0px; left:0px;" width="1024" height="640">
	SORRY BRO, NO CANVAS SUPPORT
</canvas>

<div style="position:absolute; top:650px;"><div id="framerate"></div> (Ctrl+Shift+J for JS console)</div>

</body>
</html>
