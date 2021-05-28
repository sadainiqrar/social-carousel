varying vec2 vUv;

uniform float time;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform sampler2D texture;
uniform float opacity;
uniform vec3 gradientColor;
uniform float progress;

uniform vec2 resolution;
uniform vec2 imageResolution;

void main() {
	// vec2 ratio = vec2(min((resolution.x / resolution.y) / (imageResolution.x / imageResolution.y), 1.0), min((resolution.y / resolution.x) / (imageResolution.y / imageResolution.x), 1.0));
	// vec2 uv = vec2(vUv.x * ratio.x + (1.0 - ratio.x) * 0.5, vUv.y * ratio.y + (1.0 - ratio.y) * 0.5);
	vec4 origColor = texture2D(texture, vUv);
	gl_FragColor = origColor;

	#ifdef USE_FOG
		#ifdef USE_LOGDEPTHBUF_EXT
	float depth = gl_FragDepthEXT / gl_FragCoord.w;
		#else
	float depth = gl_FragCoord.z / gl_FragCoord.w;
		#endif
	float fogFactor = smoothstep(fogNear, fogFar, depth);
	gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
	#endif

}