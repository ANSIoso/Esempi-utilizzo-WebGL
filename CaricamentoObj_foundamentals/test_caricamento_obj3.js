// ====== v_metodi utili per ottenere centro modello_v ======

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

// ====== ^_metodi utili per ottenere centro modello_^ ======

async function myLoad(gl, objHref) {

	// ====== v_texture e material di base_v ======

	const textures = {
		defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
	};

	const defaultMaterial = {
		diffuse: [1, 1, 1],
		diffuseMap: textures.defaultWhite,
		ambient: [0, 0, 0],
		specular: [1, 1, 1],
		specularMap: textures.defaultWhite,
		shininess: 400,
		opacity: 1,
	};

	// ====== ^_texture e material di base_^ ======


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
	
	// calcolo il centro del modello
	const extents = getGeometriesExtents(obj.geometries);
	const range = m4.subtractVectors(extents.max, extents.min);
	const objOffset = m4.scaleVector(
		m4.addVectors(
			extents.min,
			m4.scaleVector(range, 0.5)),
		-1);

	return {parts, objOffset}
}



async function main() {
	// Get A WebGL context
	/** @type {HTMLCanvasElement} */
	const canvas = document.querySelector("#canvas");
	const gl = canvas.getContext("webgl");
	if (!gl) {
		return;
	}

	// compiles and links the shaders, looks up attribute and uniform locations
	const meshProgramInfo = webglUtils.createProgramInfo(gl, ['3d-vertex-shader', '3d-fragment-shader']);

	// ========== inizio caricamento obj ==========
	
	const objHref = '../models/boeing/boeing_3.obj';
	var a = await myLoad(gl, objHref);


	const objHref1 = '../models/soft_chair/Chair.obj';
	var a1 = await myLoad(gl, objHref1);

	
	const cameraTarget = [0, 0, 0];
	const cameraPosition = m4.addVectors(cameraTarget, [
		0,
		0,
		100,
	]);
	// Set zNear and zFar to something hopefully appropriate
	// for the size of this object.
	const zNear = 0.1;
	const zFar = 2000;

	function degToRad(deg) {
		return deg * Math.PI / 180;
	}

	function render(time) {
		time *= 0.001;  // convert to seconds

		webglUtils.resizeCanvasToDisplaySize(gl.canvas);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.enable(gl.DEPTH_TEST);

		const fieldOfViewRadians = degToRad(60);
		const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

		const up = [0, 1, 0];
		// Compute the camera's matrix using look at.
		const camera = m4.lookAt(cameraPosition, cameraTarget, up);

		// Make a view matrix from the camera matrix.
		const view = m4.inverse(camera);

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
		let u_world = m4.yRotation(time);
		u_world = m4.translate(u_world, ...a.objOffset);

		for (const { bufferInfo, material } of a.parts) {
			// calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
			webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
			// calls gl.uniform
			webglUtils.setUniforms(meshProgramInfo, {
				u_world,
			}, material);
			// calls gl.drawArrays or gl.drawElements
			webglUtils.drawBufferInfo(gl, bufferInfo);
		}

		u_world = m4.translate(m4.identity(), 0,0,95);
		u_world = m4.yRotate(u_world, time);
		u_world = m4.translate(u_world, ...a1.objOffset);

		for (const { bufferInfo, material } of a1.parts) {
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
