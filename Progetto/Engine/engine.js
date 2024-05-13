class Transform {
    transformMatrix;
    // una matrice m4 è così ordinata
    //  0 |  4 |  8 | 12
    // ------------------
    //  1 |  5 |  9 | 13
    // ------------------
    //  2 |  6 | 10 | 14
    // ------------------
    //  3 |  7 | 11 | 15

    constructor() {
        this.transformMatrix = m4.identity();
    }

    translate(xTransl, yTransl, zTransl){
        m4.translate(this.transformMatrix, xTransl, yTransl, zTransl, this.transformMatrix)
    }

    rotate(xRotate, yRotate, zRotate){
        m4.xRotate(this.transformMatrix, xRotate, this.transformMatrix);
        m4.yRotate(this.transformMatrix, yRotate, this.transformMatrix);
        m4.zRotate(this.transformMatrix, zRotate, this.transformMatrix);
    }

    scale(xScale, yScale, zScale){
        m4.scale(this.transformMatrix, xScale, yScale, zScale, this.transformMatrix);
    }

    getPosition(){
        return {x: this.transformMatrix[12], y: this.transformMatrix[13], z: this.transformMatrix[14]}
    }

    test(){
        console.log(this.transformMatrix);
        console.log(this.transformMatrix[0], this.transformMatrix[1]);
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

    // - luce
    lightGradient = 30;
    bias = -0.0004; // best setting => -0.0004

    lightProjectionMatrix;
    lightFOV = 70;
    lightProjWidth = 0.1;
    lightProjHeight = 0.1;
    lightNear = 2;
    lightFar = 1000;

    lightWorldMatrix;
    lightTransform;

    // - punto di vista
    viewProjectionMatrix;
    viewFOV = 60;
    viewNear = 0.1;
    viewFar = 2000;

    viewMatrix;
    viewTransform;


    // cose da disegnare
    obj = [];       // contiene tutte le mash utilizzabili
    objInfo = [];   // contiene le info sulle mash che voglio visualizzare 
    // nel formato: {- idMash (che fa riferimento all'array obj)
    //               - Transform mash (the indica le trasformazioni da applicargli)}

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

        this.viewTransform = new Transform();
        this.lightTransform = new Transform();
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

    // === metodi per il rendering

    // imposto la luce
    updateLight() {
        // definisco proiezione della luce
        this.lightProjectionMatrix = m4.perspective(
            degToRad(this.lightFOV),
            this.lightProjWidth / this.lightProjHeight,
            this.lightNear,
            this.lightFar
        );

        
        // posiziono la luce al fianco della camera
        this.lightTransform.transformMatrix = [...this.viewTransform.transformMatrix];
        this.lightTransform.translate(10,10, 0);
        this.lightTransform.rotate(degToRad(-25), 0, 0);
        // posiziono la luce dove il transform indica
        this.lightWorldMatrix = this.lightTransform.transformMatrix;
    }

    // imposto la view
    updateView() {
        // definisco proiezione del punto di vista
        this.viewProjectionMatrix = m4.perspective(
            degToRad(this.viewFOV),
            this.gl.canvas.clientWidth / this.gl.canvas.clientHeight, // aspect ratio
            this.viewNear,
            this.viewFar);

        // posiziono il punto di vista dove il transform indica
        this.viewMatrix = this.viewTransform.transformMatrix;
    }

    // disegna la scena
    // - con il punto di vista di "cameraMatrix"
    // - riposrtando l'ombra della luce in posizione "lightWorldMatrix" nella posizione "textureMatrix"
    // - seguendo le istruzioni dello shader "programInfo"
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
            let mashTransform = element.transform.transformMatrix;
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

        this.updateLight();

        // draw to the depth texture
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.depthFramebuffer);
        this.gl.viewport(0, 0, this.depthTextureSize, this.depthTextureSize);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.drawScene(this.lightProjectionMatrix, this.lightWorldMatrix, m4.identity(), this.lightWorldMatrix, this.colorProgramInfo);

        // now draw scene to the canvas projecting the depth texture into the scene
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);


        let textureMatrix = m4.identity();
        textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
        textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
        textureMatrix = m4.multiply(textureMatrix, this.lightProjectionMatrix);
        // use the inverse of this world matrix to make
        // a matrix that will transform other positions
        // to be relative this world space.
        textureMatrix = m4.multiply(
            textureMatrix,
            m4.inverse(this.lightWorldMatrix));

        this.updateView();

        this.drawScene(this.viewProjectionMatrix, this.viewMatrix, textureMatrix, this.lightWorldMatrix, this.meshProgramInfo);

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

        requestAnimationFrame(this.render.bind(this));
    }


    async load() {
        this.viewTransform.translate(0, 0, 0);
        this.lightTransform.translate(10, 10, 0);
        this.lightTransform.rotate(degToRad(-25), 0, 0);

        this.obj.push(await this.loadGeneralObj('../models/grass1/10450_Rectangular_Grass_Patch_v1_iterations-2.obj'));
        
        var t1 = new Transform();
        t1.translate(0,-20,0);
        t1.rotate(degToRad(-90), 0, 0);
        this.objInfo.push({
            transform: t1,
            modelID: 0
        });

        var t3 = new Transform();
        t3.translate(290,-20,0);
        t3.rotate(degToRad(-90), 0, degToRad(-270));
        this.objInfo.push({
            transform: t3,
            modelID: 0
        });

        
        
        this.obj.push(await this.loadGeneralObj('../models/cat/12221_Cat_v1_l3.obj'));

        var t2 = new Transform();
        t2.rotate(degToRad(-90), 0, 0);
        this.objInfo.push({
            transform: t2,
            modelID: 1
        });

        this.render();
    }

}

const canvas = document.getElementById("canvas")
const engine = new Engine(canvas);
engine.load();

window.onkeydown = function (e) {

    switch (e.key) {
        case 'w':
            engine.viewTransform.translate(0,0,-10);
            engine.lightTransform.translate(0,0,-1);
            break;
        case 's':
            engine.viewTransform.translate(0,0,1);
            engine.lightTransform.translate(0,0,1);
            break;
        case 'a':
            engine.viewTransform.translate(-1,0,0);
            engine.lightTransform.translate(-1,0,0);
            break;
        case 'd':
            engine.viewTransform.translate(1,0,0);
            engine.lightTransform.translate(1,0,0);
            break;
        case 'e':
            engine.viewTransform.rotate(0,degToRad(-1),0);
            engine.lightTransform.rotate(0,degToRad(-1),0);
            break;
        case 'q':
            engine.viewTransform.rotate(0,degToRad(1),0);
            engine.lightTransform.rotate(0,degToRad(1),0);
            break;

        default:
            break;
    }

    console.log(engine.viewTransform.getPosition());
};