const settings = {
	cameraX: 2.75,
	cameraY: 5,
	posX: 40,
	posY: 50,
	posZ: 10,
	targetX: 0.8,
	targetY: 0,
	targetZ: 4.7,
	projWidth: 0.1,
	projHeight: 0.1,
	perspective: true,
	fieldOfView: 120,
};

slider_cameraX = document.getElementById("slider_cameraX");
slider_cameraY = document.getElementById("slider_cameraY");

slider_projWidth = document.getElementById("projWidth");
slider_projHeight = document.getElementById("projHeight");
slider_fov = document.getElementById("fov");

slider_cameraX.addEventListener("input", function () {
	settings.cameraX = slider_cameraX.value;
});

slider_cameraY.addEventListener("input", function () {
	settings.cameraY = slider_cameraY.value;
});

slider_projWidth.addEventListener("input", function () {
	settings.projWidth = slider_projWidth.value;
});

slider_projHeight.addEventListener("input", function () {
	settings.projHeight = slider_projHeight.value;
});

slider_fov.addEventListener("input", function () {
	settings.fieldOfView = slider_fov.value;
});


// ====== v_variabili globali di webgl_v ======

var gl;
var textures;
var defaultMaterial

function setUpDefoultTexture() {
	textures = {
		defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
		defaultNormal: create1PixelTexture(gl, [127, 127, 255, 0]),
	};

	defaultMaterial = {
		diffuse: [1, 1, 1],
		diffuseMap: textures.defaultWhite,
		normalMap: textures.defaultNormal,
		ambient: [0, 0, 0],
		specular: [1, 1, 1],
		specularMap: textures.defaultWhite,
		shininess: 400,
		opacity: 1,
	};
}

// ====== ^_variabili globali di webgl_^ ======

// ====== v_metodi per trovare centro del modello_v ======

function getExtents(positions) {
	const min = positions.slice(0, 3);
	const max = positions.slice(0, 3);
	for (let i = 3; i < positions.length; i += 3) {
		for (let j = 0; j < 3; ++j) {
			const v = positions[i + j];
			min[j] = Math.min(v, min[j]);
			max[j] = Math.max(v, max[j]);
		}
	}
	return { min, max };
}

function getGeometriesExtents(geometries) {
	return geometries.reduce(({ min, max }, { data }) => {
		const minMax = getExtents(data.position);
		return {
			min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
			max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
		};
	}, {
		min: Array(3).fill(Number.POSITIVE_INFINITY),
		max: Array(3).fill(Number.NEGATIVE_INFINITY),
	});
}

// ====== ^_metodi per trovare centro del modello_^ ======

async function loadGeneralObj(objHref) {
	const response = await fetch(objHref);
	const text = await response.text();
	const obj = parseOBJ(text);
	const baseHref = new URL(objHref, window.location.href);
	const matTexts = await Promise.all(obj.materialLibs.map(async filename => {
		const matHref = new URL(filename, baseHref).href;
		const response = await fetch(matHref);
		return await response.text();
	}));
	const materials = parseMTL(matTexts.join('\n'));

	// load texture for materials
	for (const material of Object.values(materials)) {
		Object.entries(material)
			.filter(([key]) => key.endsWith('Map'))
			.forEach(([key, filename]) => {
				let texture = textures[filename];
				if (!texture) {
					const textureHref = new URL(filename, baseHref).href;
					texture = createTexture(gl, textureHref);
					textures[filename] = texture;
				}
				material[key] = texture;
			});
	}

	const parts = obj.geometries.map(({ material, data }) => {

		if (data.color) {
			if (data.position.length === data.color.length) {
				// it's 3. The our helper library assumes 4 so we need
				// to tell it there are only 3.
				data.color = { numComponents: 3, data: data.color };
			}
		} else {
			// there are no vertex colors so just use constant white
			data.color = { value: [1, 1, 1, 1] };
		}

		// generate tangents if we have the data to do so.
		if (data.texcoord && data.normal) {
			data.tangent = generateTangents(data.position, data.texcoord);
		} else {
			// There are no tangents
			data.tangent = { value: [1, 0, 0] };
		}

		if (!data.texcoord) {
			data.texcoord = { value: [0, 0] };
		}

		if (!data.normal) {
			// we probably want to generate normals if there are none
			data.normal = { value: [0, 0, 1] };
		}

		// create a buffer for each array by calling
		// gl.createBuffer, gl.bindBuffer, gl.bufferData
		const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
		return {
			material: {
				...defaultMaterial,
				...materials[material],
			},
			bufferInfo,
		};
	});

	const extents = getGeometriesExtents(obj.geometries);
	const range = m4.subtractVectors(extents.max, extents.min);

	// amount to move the object so its center is at the origin
	const objOffset = m4.scaleVector(
		m4.addVectors(
			extents.min,
			m4.scaleVector(range, 0.5)),
		-1);

	return { parts, objOffset }
}

function degToRad(deg) {
	return deg * Math.PI / 180;
}

async function main() {
	// Get A WebGL context
	/** @type {HTMLCanvasElement} */
	const canvas = document.querySelector("#canvas");
	gl = canvas.getContext("webgl");
	if (!gl) {
		return;
	}

	const ext = gl.getExtension('WEBGL_depth_texture');
	if (!ext) {
		return alert('need WEBGL_depth_texture');
	}

	const cubeLinesBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
        position: [
            -1, -1, -1,
            1, -1, -1,
            -1, 1, -1,
            1, 1, -1,
            -1, -1, 1,
            1, -1, 1,
            -1, 1, 1,
            1, 1, 1,
        ],
        indices: [
            0, 1,
            1, 3,
            3, 2,
            2, 0,

            4, 5,
            5, 7,
            7, 6,
            6, 4,

            0, 4,
            1, 5,
            3, 7,
            2, 6,
        ],
    });

	setUpDefoultTexture();


	// compiles and links the shaders, looks up attribute and uniform locations
	const meshProgramInfo = webglUtils.createProgramInfo(gl, ['3d-vertex-shader', '3d-fragment-shader']);
	const colorProgramInfo = webglUtils.createProgramInfo(gl, ['color-vertex-shader', 'color-fragment-shader']);

	// var compiled = gl.getShaderParameter(meshProgramInfo.program, gl.COMPILE_STATUS);
	// console.log('Shader compiled successfully: ' + compiled);
	// var compilationLog = gl.getShaderInfoLog(meshProgramInfo.program);
	// console.log('Shader compiler log: ' + compilationLog);


	const depthTexture = gl.createTexture();
	const depthTextureSize = 512;
	gl.bindTexture(gl.TEXTURE_2D, depthTexture);
	gl.texImage2D(
		gl.TEXTURE_2D,      // target
		0,                  // mip level
		gl.DEPTH_COMPONENT, // internal format
		depthTextureSize,   // width
		depthTextureSize,   // height
		0,                  // border
		gl.DEPTH_COMPONENT, // format
		gl.UNSIGNED_INT,    // type
		null);              // data
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	const depthFramebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
	gl.framebufferTexture2D(
		gl.FRAMEBUFFER,       // target
		gl.DEPTH_ATTACHMENT,  // attachment point
		gl.TEXTURE_2D,        // texture target
		depthTexture,         // texture
		0);                   // mip level

	// create a color texture of the same size as the depth texture
	const unusedTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, unusedTexture);
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,
		gl.RGBA,
		depthTextureSize,
		depthTextureSize,
		0,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		null,
	);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	// attach it to the framebuffer
	gl.framebufferTexture2D(
		gl.FRAMEBUFFER,        // target
		gl.COLOR_ATTACHMENT0,  // attachment point
		gl.TEXTURE_2D,         // texture target
		unusedTexture,         // texture
		0);                    // mip level


	const objHrefG = '../models/cat/12221_Cat_v1_l3.obj';
	var gatto = await loadGeneralObj(objHrefG);

	const objHrefP = '../models_blender/rock_slab/slab.obj';
	var pavimento = await loadGeneralObj(objHrefP);


	const imageTexture = createTexture(gl, '../models/f-texture.png');

	function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo, cameraPosition) {
		const viewMatrix = m4.inverse(cameraMatrix);

		gl.useProgram(programInfo.program);

		// imposto gli uniforms che sono univoci per tutti gli obj
		const sharedUniforms = {
			u_lightDirection: m4.normalize([settings.posX, settings.posY, settings.posZ]),
			u_viewWorldPosition: cameraPosition,
			u_view: viewMatrix,
			u_projection: projectionMatrix,
			u_textureMatrix: textureMatrix,
			u_projectedTexture: depthTexture,
		};

		webglUtils.setUniforms(programInfo, sharedUniforms);

		let u_world;

		// ====== v_disegno la slab_v ======

		// u_world = m4.yRotate(m4.identity() , time/4);
		u_world = m4.scale(m4.identity(), 10, 3, 10);
		u_world = m4.translate(u_world, ...pavimento.objOffset);

		for (const { bufferInfo, material } of pavimento.parts) {
			// calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
			webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
			// calls gl.uniform
			webglUtils.setUniforms(programInfo, {
				u_world,
			}, material);
			// calls gl.drawArrays or gl.drawElements
			webglUtils.drawBufferInfo(gl, bufferInfo);
		}

		// ====== ^_disegno la slab_^ ======

		// ====== v_disegno il gatto_v ======

		u_world = m4.translation(0, 20, 0)
		u_world = m4.yRotate(u_world, 0.5);
		// u_world = m4.zRotate(u_world, 1.5);
		u_world = m4.xRotate(u_world, degToRad(-90));
		u_world = m4.translate(u_world, ...gatto.objOffset);

		for (const { bufferInfo, material } of gatto.parts) {
			// calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
			webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
			// calls gl.uniform
			webglUtils.setUniforms(programInfo, {
				u_world,
			}, material);
			// calls gl.drawArrays or gl.drawElements
			webglUtils.drawBufferInfo(gl, bufferInfo);
		}

		// ====== ^_disegno il gatto_^ ======
	}






	function render(time) {
		time *= 0.001;  // convert to seconds
		const cameraPosition = [settings.cameraX, settings.cameraY, 120];

		webglUtils.resizeCanvasToDisplaySize(gl.canvas);

		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);

		// matrice di lookAt della proiezione texture
		let lightWorldMatrix = m4.lookAt(
			[settings.posX, settings.posY, settings.posZ],          // position
			[settings.targetX, settings.targetY, settings.targetZ], // target
			[0, 1, 0],                                              // up
		);

		const lightProjectionMatrix = settings.perspective
			? m4.perspective(
				degToRad(settings.fieldOfView),
				settings.projWidth / settings.projHeight,
				0.5,  // near
				100)  // far
			: m4.orthographic(
				-settings.projWidth / 2,   // left
				settings.projWidth / 2,   // right
				-settings.projHeight / 2,  // bottom
				settings.projHeight / 2,  // top
				0.5,                      // near
				100);                     // far


		// draw to the depth texture
		gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
		gl.viewport(0, 0, depthTextureSize, depthTextureSize);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgramInfo, cameraPosition);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		let textureMatrix = m4.identity();
		textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
		textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
		textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
		// use the inverse of this world matrix to make
		// a matrix that will transform other positions
		// to be relative this world space.
		textureMatrix = m4.multiply(
			textureMatrix,
			m4.inverse(lightWorldMatrix));

		// ====== v_camera_v ======

		// Set zNear and zFar to something hopefully appropriate
		// for the size of this object.
		const zNear = 0.1;
		const zFar = 2000;

		const fieldOfViewRadians = degToRad(60);
		const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

		const cameraTarget = [0, 0, 0];
		const up = [0, 1, 0];
		const cameraMatrix = m4.lookAt(cameraPosition, cameraTarget, up);

		// ====== ^_camera_^ ======

		drawScene(projectionMatrix, cameraMatrix, textureMatrix, meshProgramInfo, cameraPosition);


		// --------- disegno del frustum --------------------
		const viewMatrix = m4.inverse(cameraMatrix);

		gl.useProgram(colorProgramInfo.program);

		// Setup all the needed attributes.
		webglUtils.setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo);

		// scale the cube in Z so it's really long
		// to represent the texture is being projected to
		// infinity
		const mat = m4.multiply(
			lightWorldMatrix, m4.inverse(lightProjectionMatrix));

		// Set the uniforms we just computed
		webglUtils.setUniforms(colorProgramInfo, {
			u_color: [0, 0, 0, 1],
			u_view: viewMatrix,
			u_projection: projectionMatrix,
			u_world: mat,
		});

		// calls gl.drawArrays or gl.drawElements
		webglUtils.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);

		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
}

main();