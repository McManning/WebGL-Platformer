
precision highp float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 uColor;

void main(void) {
	if (uColor.a < 1.0) {
	
		gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
		
		if (uColor.a > 0.0) {
			gl_FragColor = gl_FragColor * uColor; /* @todo better blending */
		}
		
	} else {
	
		gl_FragColor = uColor;
		
	}
}
