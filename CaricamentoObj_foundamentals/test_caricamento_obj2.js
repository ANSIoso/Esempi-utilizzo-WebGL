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
	const objHref = '../models/cat/12221_Cat_v1_l3.obj';
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

	const textures = {
		defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
	};

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

	const defaultMaterial = {
		diffuse: [1, 1, 1],
		diffuseMap: textures.defaultWhite,
		ambient: [0, 0, 0],
		specular: [1, 1, 1],
		specularMap: textures.defaultWhite,
		shininess: 400,
		opacity: 1,
	};

	const parts = obj.geometries.map(({ material, data }) => {
		// Because data is just named arrays like this
		//
		// {
		//   position: [...],
		//   texcoord: [...],
		//   normal: [...],
		// }
		//
		// and because those names match the attributes in our vertex
		// shader we can pass it directly into `createBufferInfoFromArrays`
		// from the article "less code more fun".

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

	const extents = getGeometriesExtents(obj.geometries);
	const range = m4.subtractVectors(extents.max, extents.min);
	// amount to move the object so its center is at the origin
	const objOffset = m4.scaleVector(
		m4.addVectors(
			extents.min,
			m4.scaleVector(range, 0.5)),
		-1
	);


























	const objHref1 = '../models/boeing/boeing_3.obj';
	const response1 = await fetch(objHref1);
	const text1 = await response1.text();
	const obj1 = parseOBJ(text1);
	const baseHref1 = new URL(objHref1, window.location.href);
	const matTexts1 = await Promise.all(obj1.materialLibs.map(async filename => {
		console.log(filename);
		const matHref1 = new URL(filename, baseHref1).href;
		const response1 = await fetch(matHref1);
		return await response1.text();
	}));
	const materials1 = parseMTL(matTexts1.join('\n'));

	const textures1 = {
		defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
	};

	// load texture for materials
	for (const material of Object.values(materials1)) {
		Object.entries(material)
			.filter(([key]) => key.endsWith('Map'))
			.forEach(([key, filename]) => {
				let texture = textures1[filename];
				if (!texture) {
					const textureHref = new URL(filename, baseHref1).href;
					texture = createTexture(gl, textureHref);
					textures1[filename] = texture;
				}
				material[key] = texture;
			});
	}

	const defaultMaterial1 = {
		diffuse: [1, 1, 1],
		diffuseMap: textures1.defaultWhite,
		ambient: [0, 0, 0],
		specular: [1, 1, 1],
		specularMap: textures1.defaultWhite,
		shininess: 400,
		opacity: 1,
	};

	const parts1 = obj1.geometries.map(({ material, data }) => {
		// Because data is just named arrays like this
		//
		// {
		//   position: [...],
		//   texcoord: [...],
		//   normal: [...],
		// }
		//
		// and because those names match the attributes in our vertex
		// shader we can pass it directly into `createBufferInfoFromArrays`
		// from the article "less code more fun".

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
				...materials1[material],
			},
			bufferInfo,
		};
	});


























	
	
	const cameraTarget = [0, 0, 0];
	// figure out how far away to move the camera so we can likely
	// see the object.
	const radius = m4.length(range) * 1.2;
	const cameraPosition = m4.addVectors(cameraTarget, [
		0,
		0,
		radius,
	]);
	// Set zNear and zFar to something hopefully appropriate
	// for the size of this object.
	const zNear = radius / 100;
	const zFar = radius * 3;

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
		let u_world = m4.identity();
		u_world = m4.yRotate(u_world, time)
		u_world = m4.xRotate(u_world, time)
		u_world = m4.translate(u_world, ...objOffset);

		for (const { bufferInfo, material } of parts) {
			// calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
			webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
			// calls gl.uniform
			webglUtils.setUniforms(meshProgramInfo, {
				u_world,
			}, material);
			// calls gl.drawArrays or gl.drawElements
			webglUtils.drawBufferInfo(gl, bufferInfo);
		}

		u_world = m4.translation(0,0,time*2);

		for (const { bufferInfo, material } of parts1) {
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
