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

	setUpDefoultTexture();

	// compiles and links the shaders, looks up attribute and uniform locations
	const meshProgramInfo = webglUtils.createProgramInfo(gl, ['3d-vertex-shader', '3d-fragment-shader']);

	const objHrefG = '../models/cat/12221_Cat_v1_l3.obj';
	var gatto = await loadGeneralObj(objHrefG);

	const objHrefP = '../models_blender/rock_slab/slab.obj';
	var pavimento = await loadGeneralObj(objHrefP);

	function render(time) {
		time *= 0.001;  // convert to seconds

		webglUtils.resizeCanvasToDisplaySize(gl.canvas);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.enable(gl.DEPTH_TEST);

		// ====== v_camera_v ======

		const cameraTarget = [0, 0, 0];
		const cameraPosition = [0,40,120];

		// Set zNear and zFar to something hopefully appropriate
		// for the size of this object.
		const zNear = 0.1;
		const zFar = 2000;

		const fieldOfViewRadians = degToRad(60);
		const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

		const up = [0, 1, 0];
		// Compute the camera's matrix using look at.
		const camera = m4.lookAt(cameraPosition, cameraTarget, up);

		// Make a view matrix from the camera matrix.
		const view = m4.inverse(camera);

		// ====== ^_camera_^ ======

		const sharedUniforms = {
			u_lightDirection: m4.normalize([-1, 3, 5]),
			u_view: view,
			u_projection: projection,
			u_viewWorldPosition: cameraPosition,
		};

		gl.useProgram(meshProgramInfo.program);

		// calls gl.uniform
		webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

		// compute the world matrix once since all parts
		// are at the same space.

		let u_world = m4.translation(0, 20, 0)
		u_world = m4.yRotate(u_world, time/4);
		// u_world = m4.zRotate(u_world, 1.5);
		u_world = m4.xRotate(u_world, degToRad(-90));
		u_world = m4.translate(u_world, ...gatto.objOffset);

		for (const { bufferInfo, material } of gatto.parts) {
			// calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
			webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
			// calls gl.uniform
			webglUtils.setUniforms(meshProgramInfo, {
				u_world,
			}, material);
			// calls gl.drawArrays or gl.drawElements
			webglUtils.drawBufferInfo(gl, bufferInfo);
		}

		u_world = m4.translation(0, 0, 0)
		u_world = m4.yRotate(u_world, time/4);
		u_world = m4.scale(u_world, 6, 3, 6);
		u_world = m4.translate(u_world, ...pavimento.objOffset);

		for (const { bufferInfo, material } of pavimento.parts) {
			// calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
			webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
			// calls gl.uniform
			webglUtils.setUniforms(meshProgramInfo, {
				u_world,
			}, material);
			// calls gl.drawArrays or gl.drawElements
			webglUtils.drawBufferInfo(gl, bufferInfo);
		}

		

		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
}

main();
