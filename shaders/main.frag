
precision highp float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 uColor;
uniform float uHueShift; /* Amount to shift the Hue, range 0 to 6 */

/* Converts the rgb value to hsv, where H's range is -1 to 5 */
vec3 rgb_to_hsv(vec3 RGB)
{
	float r = RGB.x;
	float g = RGB.y;
	float b = RGB.z;

	float minChannel = min(r, min(g, b));
	float maxChannel = max(r, max(g, b));

	float h = 0.0;
	float s = 0.0;
	float v = maxChannel;

	float delta = maxChannel - minChannel;

	if (delta != 0.0) { 
		s = delta / v;

		if (r == v) h = (g - b) / delta;
		else if (g == v) h = 2.0 + (b - r) / delta;
		else /* b == v */ h = 4.0 + (r - g) / delta;
	}

	return vec3(h, s, v);
}

vec3 hsv_to_rgb(vec3 HSV)
{
	vec3 RGB; /* = HSV.z; */

	float h = HSV.x;
	float s = HSV.y;
	float v = HSV.z;

	float i = floor(h);
	float f = h - i;

	float p = (1.0 - s);
	float q = (1.0 - s * f);
	float t = (1.0 - s * (1.0 - f));

	if (i == 0.0) { RGB = vec3(1.0, t, p); }
	else if (i == 1.0) { RGB = vec3(q, 1.0, p); }
	else if (i == 2.0) { RGB = vec3(p, 1.0, t); }
	else if (i == 3.0) { RGB = vec3(p, q, 1.0); }
	else if (i == 4.0) { RGB = vec3(t, p, 1.0); }
	else /* i == -1 */ { RGB = vec3(1.0, p, q); }

	RGB *= v;

	return RGB;
}

void main(void) {
	if (uColor.a < 1.0) {
	
		gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
		
		if (uColor.a > 0.0) {
			gl_FragColor = gl_FragColor * uColor; /* @todo better blending */
		}
		
	} else {
	
		gl_FragColor = uColor;
		
	}
	
	/* Apply Hue transformation, if we got it */
	/*if (uHueShift != 0.0) {
	
		vec3 hsv = rgb_to_hsv(gl_FragColor.xyz);
		hsv.x += uHueShift;

		// Put the hue back to the -1, 5 range
		if (hsv.x > 5.0) 
			hsv.x -= 6.0;

		gl_FragColor = vec4(hsv_to_rgb(hsv), gl_FragColor.a);
	}*/
}
