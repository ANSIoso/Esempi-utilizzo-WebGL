const settings = {
    cameraX: 60,
    cameraY: 100,
    posX: -40,
    posY: 100,
    posZ: 0,
    targetX: 0.8,
    targetY: 0,
    targetZ: 4.7,
    projWidth: 0.1,
    projHeight: 0.1,
};

class transform {
    modelID;

    translation = [0,0,0]
    rotation = [0,0,0]
    scale = [1,1,1]

    constructor(modelID){
        this.modelID =  modelID;
    }

    getMatrix(){
        var mat = m4.translation(...this.translation);
        m4.xRotate(mat, this.rotation[0], mat);
        m4.yRotate(mat, this.rotation[0], mat);
        m4.zRotate(mat, this.rotation[0], mat);
        m4.scale(mat, ...this.scale, mat);

        return mat;
    }
}

function degToRad(deg) {
    return deg * Math.PI / 180;
}

class Engine {

    // variabili usate per funzionamento base webgl
    gl;
    ext;

    meshProgramInfo;
    colorProgramInfo;

    defoulTexture;
    defaultMaterial;

    depthTexture;
    depthTextureSize = 512;
    depthFramebuffer;
    unusedTexture;

    // variabili setting rendering
    lightGradient = 10;
    bias = -0.0002;
    lightFOV = 46;

    // cose da disegnare
    obj = [];
    objInfo = [];

    constructor(canvas) {
        this.gl = canvas.getContext("webgl");
        if (!this.gl) {
            return;
        }

        this.ext = this.gl.getExtension('WEBGL_depth_texture');
        if (!this.ext) {
            return alert('need WEBGL_depth_texture');
        }

        // compiles and links the shaders, looks up attribute and uniform locations
        this.meshProgramInfo = webglUtils.createProgramInfo(this.gl, ['3d-vertex-shader', '3d-fragment-shader']);
        this.colorProgramInfo = webglUtils.createProgramInfo(this.gl, ['color-vertex-shader', 'color-fragment-shader']);

        // controllo che gli shader siano stati caricati correttamente
        console.log(this.meshProgramInfo.program);

        // var compiled = gl.getShaderParameter(meshProgramInfo.program, gl.COMPILE_STATUS);
        // console.log('Shader compiled successfully: ' + compiled);
        // var compilationLog = gl.getShaderInfoLog(meshProgramInfo.program);
        // console.log('Shader compiler log: ' + compilationLog);

        this.setUpDefoultObjInfo();
        this.setDepthTexture();
    }

    // === metodi setup iniziali per variabili webgl

    // - crea material e texture che vengono applicati di base a tutti gli obj
    setUpDefoultObjInfo() {
        this.defoulTexture = {
            defaultWhite: create1PixelTexture(this.gl, [255, 255, 255, 255]),
            defaultNormal: create1PixelTexture(this.gl, [127, 127, 255, 0]),
        };

        this.defaultMaterial = {
            diffuse: [1, 1, 1],
            diffuseMap: this.defoulTexture.defaultWhite,
            normalMap: this.defoulTexture.defaultNormal,
            ambient: [0, 0, 0],
            specular: [1, 1, 1],
            specularMap: this.defoulTexture.defaultWhite,
            shininess: 400,
            opacity: 1,
        };
    }

    // - crea la depth texture usata per le ombre
    setDepthTexture() {
        this.depthTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,      // target
            0,                  // mip level
            this.gl.DEPTH_COMPONENT, // internal format
            this.depthTextureSize,   // width
            this.depthTextureSize,   // height
            0,                  // border
            this.gl.DEPTH_COMPONENT, // format
            this.gl.UNSIGNED_INT,    // type
            null);              // data
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        this.depthFramebuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.depthFramebuffer);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,       // target
            this.gl.DEPTH_ATTACHMENT,  // attachment point
            this.gl.TEXTURE_2D,        // texture target
            this.depthTexture,         // texture
            0);                   // mip level

        // create a color texture of the same size as the depth texture
        this.unusedTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.unusedTexture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.depthTextureSize,
            this.depthTextureSize,
            0,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            null,
        );
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        // attach it to the framebuffer
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,        // target
            this.gl.COLOR_ATTACHMENT0,  // attachment point
            this.gl.TEXTURE_2D,         // texture target
            this.unusedTexture,         // texture
            0);                    // mip level
    }

    // === funzioni utilità per modelli

    // (1) metodi per trovare centro di un obj
    getExtents(positions) {
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

    // (2) metodi per trovare centro di un obj
    getGeometriesExtents(geometries) {
        return geometries.reduce(({ min, max }, { data }) => {
            const minMax = this.getExtents(data.position);
            return {
                min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
                max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
            };
        }, {
            min: Array(3).fill(Number.POSITIVE_INFINITY),
            max: Array(3).fill(Number.NEGATIVE_INFINITY),
        });
    }

    // carica un modello partendo dalla posizione nel pc
    async loadGeneralObj(objHref) {
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
                    let texture = this.defoulTexture[filename];
                    if (!texture) {
                        const textureHref = new URL(filename, baseHref).href;
                        texture = createTexture(this.gl, textureHref);
                        this.defoulTexture[filename] = texture;
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
            const bufferInfo = webglUtils.createBufferInfoFromArrays(this.gl, data);
            return {
                material: {
                    ...this.defaultMaterial,
                    ...materials[material],
                },
                bufferInfo,
            };
        });

        const extents = this.getGeometriesExtents(obj.geometries);
        const range = m4.subtractVectors(extents.max, extents.min);

        // amount to move the object so its center is at the origin
        const objOffset = m4.scaleVector(
            m4.addVectors(
                extents.min,
                m4.scaleVector(range, 0.5)),
            -1);

        return { parts, objOffset }
    }

    // === metodi per il rendering degli obj

    drawScene(projectionMatrix, cameraMatrix, textureMatrix, lightWorldMatrix, programInfo) {
        const viewMatrix = m4.inverse(cameraMatrix);

        this.gl.useProgram(programInfo.program);

        // imposto gli uniforms che sono univoci per tutti gli obj
        const sharedUniforms = {
            u_view: viewMatrix,
            u_projection: projectionMatrix,
            u_bias: this.bias,
            u_textureMatrix: textureMatrix,
            u_projectedTexture: this.depthTexture,

            u_innerLimit: Math.cos(degToRad(this.lightFOV / 2 - this.lightGradient)),
            u_outerLimit: Math.cos(degToRad(this.lightFOV / 2)),
            u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
            u_lightWorldPosition: lightWorldMatrix.slice(12, 15),
            u_viewWorldPosition: cameraMatrix.slice(12, 15),
        };

        webglUtils.setUniforms(programInfo, sharedUniforms);

        // per ogni elemento presente in objinfo
        this.objInfo.forEach(element => {

            // ottengo la mash indicata dall'emement
            let mash = this.obj[element.modelID];
            let mashCenter = mash.objOffset;

            // ottengo transform indicata dall'emement e la applico alla mash "ricentrata"
            let mashTransform = element.getMatrix();
            var u_world = m4.translate(mashTransform, ...mashCenter);
    
            for (const { bufferInfo, material } of mash.parts) {
                // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
                webglUtils.setBuffersAndAttributes(this.gl, programInfo, bufferInfo);
                // calls gl.uniform
                webglUtils.setUniforms(programInfo, {
                    u_world,
                }, material);
                // calls gl.drawArrays or gl.drawElements
                webglUtils.drawBufferInfo(this.gl, bufferInfo);
            }
             
        });
    }

    render(time) {
        time *= 0.001;  // convert to seconds

        webglUtils.resizeCanvasToDisplaySize(this.gl.canvas);

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);


        // matrice di lookAt della proiezione texture
        let lightWorldMatrix = m4.lookAt(
            [settings.posX, settings.posY, settings.posZ],          // position
            [settings.targetX, settings.targetY, settings.targetZ], // target
            [0, 1, 0],                                              // up
        );

        const lightProjectionMatrix = m4.perspective(
            degToRad(this.lightFOV),
            settings.projWidth / settings.projHeight,
            2,  // near
            200 // far
        )  

        // draw to the depth texture
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.depthFramebuffer);
        this.gl.viewport(0, 0, this.depthTextureSize, this.depthTextureSize);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), lightWorldMatrix, this.colorProgramInfo);

        // now draw scene to the canvas projecting the depth texture into the scene
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);


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
        const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);


        const cameraTarget = [0, 0, 0];
        const cameraPosition = [settings.cameraX, settings.cameraY, 120];
        const up = [0, 1, 0];
        // Compute the camera's matrix using look at.
        const camera = m4.lookAt(cameraPosition, cameraTarget, up);
        // ====== ^_camera_^ ======

        this.drawScene(projection, camera, textureMatrix, lightWorldMatrix, this.meshProgramInfo);

        // // ------ Draw the light frustum ------

        // const viewMatrix = m4.inverse(camera);

        // gl.useProgram(colorProgramInfo.program);

        // // Setup all the needed attributes.
        // webglUtils.setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo);

        // // scale the cube in Z so it's really long
        // // to represent the texture is being projected to
        // // infinity
        // const mat = m4.multiply(
        //     lightWorldMatrix, m4.inverse(lightProjectionMatrix));

        // // Set the uniforms we just computed
        // webglUtils.setUniforms(colorProgramInfo, {
        //     u_color: [1, 1, 1, 1],
        //     u_view: viewMatrix,
        //     u_projection: projection,
        //     u_world: mat,
        // });

        // // calls gl.drawArrays or gl.drawElements
        // webglUtils.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);


        // tick();
        requestAnimationFrame(this.render.bind(this));
    }


    async load() {
        this.obj.push(await this.loadGeneralObj('../models/cat/12221_Cat_v1_l3.obj'));
        this.obj.push(await this.loadGeneralObj('../models_blender/metal_slab/untitled.obj'));

        var t1 = new transform(0);
        var t2 = new transform(1);
        t2.scale = [5,5,5]
        t2.translation[1] = -30;

        this.objInfo.push(t1);
        this.objInfo.push(t2);
        
        e.render();
    }

}

const canvas = document.getElementById("canvas")
const e = new Engine(canvas);
e.load();