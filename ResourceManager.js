
ResourceManager = {
	
	initialize : function() {
		this.loadedImages = new Array();
		this.loadedTextures = new Array();
	},
	
	/** 
	 * Checks local cache for the Image object to return. If it doesn't
	 * exist, it will create and return a new one. 
	 * 
	 * @return an Image object loaded from the url
	 */
	getImage : function(url) {
		
		var img = this.loadedImages[url];
		
		if (!img) {
			img = new Image();
			img.src = url;
			this.loadedImages[url] = img;
		}
		
		return img;
	},
	
	/**
	 * Checks local cache for the Texture object to return. If it doesn't
	 * exist, it will create and return a new one. 
	 *
	 * @return gl Texture object, configured for the particular image
	 */
	getTexture : function(url) {
		
		var img = this.getImage(url);
		var texture = this.loadedTextures[url];

		if (!texture) {
			texture = gl.createTexture();
			texture.image = img;
			
			// if our cached image hasn't finished downloading yet, 
			// belay configuring
			if (!img.complete) {
			
				img.onload = function() {
					this.configureImageTexture(texture);
				}
				
			} else { // can set up the texture now 
				this.configureImageTexture(texture);
			}
			
			this.loadedTextures[url] = texture;
		}
		
		return texture;
	},
	
	configureImageTexture : function(texture) {

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
	},
	
	printStats : function() {
		
		console.log("-- Images --");
		for (var url in this.loadedImages) {
			console.log("[" + url + "] Complete: " + this.loadedImages[url].complete);
		}
		
		console.log("-- Textures --");
		for (var url in this.loadedTextures) {
			console.log("[" + url + "]");
		}
	}

};

