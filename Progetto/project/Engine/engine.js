class Engine {
    // == variabili usate per funzionamento dell'engine ==
    ctx;    // variabile che ospita contesto 2d
    gl;     // variabile che ospita contesto webgl
    ext;    // variabile che ospita estensione webgl per gestione depth texture

    // - shader programs
    meshProgramInfo;
    colorProgramInfo;
    skyboxProgramInfo;
    // - - settaggi shader
    enableSpecular;
    enableNormalMaps;
    enableShadows;
    enableShading;

    // - setting defoult di un modello caricato
    defoulTexture;
    defaultMaterial;

    // - variabili utilizzate per rendering ombre
    depthTexture;
    depthTextureSize = 512;
    depthFramebuffer;
    unusedTexture;

    // - variabili utilizzate per la skybox
    skyTexture;
    quadBufferInfo;

    // ========== variabili setting rendering ===========
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

    // =============== cose da disegnare ================
    obj = {};       // contiene tutte le mash utilizzabili
    game;           // contiene il gioco esso ha le info su:
    // - quali mash renderizzare
    // - dove renderizzarle


    // ==================== METODI ======================
    constructor(canvas, uiCanvas, game) {
        this.screenFocused = false;
        this.game = game;

        // estrazione dei contesti per disegnare sui 2 canvas
        this.gl = canvas.getContext("webgl");
        if (!this.gl) {
            console.log("Errore caricamento webgl");
            return;
        }

        this.ctx = uiCanvas.getContext("2d");
        if (!this.gl) {
            console.log("Errore caricamento ctx");
            return;
        }

        // estrazione  dell'estensione per la gestione delle depth texture
        this.ext = this.gl.getExtension('WEBGL_depth_texture');
        if (!this.ext) {
            return alert('need WEBGL_depth_texture');
        }

        // compila e collega gli shader, ricerca le posizioni degli attribute e delle uniform
        this.meshProgramInfo = webglUtils.createProgramInfo(this.gl, ['3d-vertex-shader', '3d-fragment-shader']);
        this.colorProgramInfo = webglUtils.createProgramInfo(this.gl, ['color-vertex-shader', 'color-fragment-shader']);
        this.skyboxProgramInfo = webglUtils.createProgramInfo(this.gl, ["skybox-vertex-shader", "skybox-fragment-shader"]);

        // attivo tutte le opzioni di rendering
        this.enableSpecular = 1;
        this.enableNormalMaps = 1;
        this.enableShadows = 1;
        this.enableShading = 1;


        // controllo che gli shader siano stati caricati correttamente
        console.log(this.meshProgramInfo.program);

        // var compiled = gl.getShaderParameter(meshProgramInfo.program, gl.COMPILE_STATUS);
        // console.log('Shader compiled successfully: ' + compiled);
        // var compilationLog = gl.getShaderInfoLog(meshProgramInfo.program);
        // console.log('Shader compiler log: ' + compilationLog);

        this.setUpDefoultObjInfo();

        this.setDepthTexture();

        // imposto le informazioni necessarie a creare la skybox
        this.setUpSkyboxTexture();
        // imposto i buffer che contengono le info sul cubo al quale viene "incollata" la skybox
        this.quadBufferInfo = {
            position: { numComponents: 2, data: null, },
        };
        this.quadBufferInfo.position.data = [
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]

        // imposto punto di vista e posizione della luce
        this.viewTransform = this.game.player;
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

    // - crea la le textures utilizzate per la skybox
    setUpSkyboxTexture() {
        // Create a texture.
        this.skyTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.skyTexture);

        const faceInfos = [
            {
                target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                url: './assets/skybox/px.jpg',
            },
            {
                target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                url: './assets/skybox/nx.jpg',
            },
            {
                target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                url: './assets/skybox/py.jpg',
            },
            {
                target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                url: './assets/skybox/ny.jpg',
            },
            {
                target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                url: './assets/skybox/pz.jpg',
            },
            {
                target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                url: './assets/skybox/nz.jpg',
            },
        ];
        faceInfos.forEach((faceInfo) => {
            const { target, url } = faceInfo;

            // Upload the canvas to the cubemap face.
            const level = 0;
            const internalFormat = this.gl.RGBA;
            const width = 512;
            const height = 512;
            const format = this.gl.RGBA;
            const type = this.gl.UNSIGNED_BYTE;

            // setup each face so it's immediately renderable
            this.gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

            // Asynchronously load an image
            const image = new Image();
            image.src = url;

            self = this;

            image.addEventListener('load', function () {
                // Now that the image has loaded make copy it to the texture.
                self.gl.bindTexture(self.gl.TEXTURE_CUBE_MAP, self.skyTexture);
                self.gl.texImage2D(target, level, internalFormat, format, type, image);


                // Check if the image is a power of 2 in both dimensions.
                if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                    // Yes, it's a power of 2. Generate mips.
                    self.gl.generateMipmap(self.gl.TEXTURE_CUBE_MAP);
                } else {
                    // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
                    self.gl.texParameteri(self.gl.TEXTURE_CUBE_MAP, self.gl.TEXTURE_WRAP_S, self.gl.CLAMP_TO_EDGE);
                    self.gl.texParameteri(self.gl.TEXTURE_CUBE_MAP, self.gl.TEXTURE_WRAP_T, self.gl.CLAMP_TO_EDGE);
                    self.gl.texParameteri(self.gl.TEXTURE_CUBE_MAP, self.gl.TEXTURE_MIN_FILTER, self.gl.LINEAR);
                }
                self.gl.generateMipmap(self.gl.TEXTURE_CUBE_MAP);
            });
        });
        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
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

    // metodo utilizzato per caricare tutte le mash che sono utilizzate nel programma
    async load() {

        this.obj["terreno"] = await this.loadGeneralObj('./assets/modelsOBJ/grass_slab/grass_slab.obj');

        this.obj["fantasma"] = await this.loadGeneralObj('./assets/modelsOBJ/fantasma/fantasma.obj');

        for (let index = 1; index <= 5; index++) {
            let treeName = "albero" + index;

            this.obj[treeName] = await this.loadGeneralObj('./assets/modelsOBJ/alberi/' + treeName + '.obj');
        }

        for (let index = 1; index <= 7; index++) {
            let rockName = "roccia" + index;

            this.obj[rockName] = await this.loadGeneralObj('./assets/modelsOBJ/rocce/' + rockName + '.obj');
        }

        this.obj["totem"] = await this.loadGeneralObj('./assets/modelsOBJ/mio_totem/mio.obj');

        this.render();
    }

    // === metodi per il rendering ===

    // imposto la luce
    updateLight() {
        // definisco matrice proiezione della luce
        this.lightProjectionMatrix = m4.perspective(
            degToRad(this.lightFOV),
            this.lightProjWidth / this.lightProjHeight,
            this.lightNear,
            this.lightFar
        );


        // posiziono la luce al fianco della camera
        this.lightTransform.transformMatrix = m4.copy(this.viewTransform.getMatrix());
        this.lightTransform.translate(10, 0, 0);
        this.lightTransform.rotate(degToRad(-10), 0, 0);
        // posiziono la luce dove il transform indica
        this.lightWorldMatrix = this.lightTransform.transformMatrix;
    }

    // imposto la view
    updateView() {
        // definisco matrice proiezione del punto di vista
        this.viewProjectionMatrix = m4.perspective(
            degToRad(this.viewFOV),
            this.gl.canvas.clientWidth / this.gl.canvas.clientHeight, // aspect ratio
            this.viewNear,
            this.viewFar);

        // posiziono il punto di vista dove il transform indica
        this.viewMatrix = this.viewTransform.getMatrix();
    }

    // disegna la scena
    // - con il punto di vista di "cameraMatrix"
    // - riposrtando l'ombra proiettata dalla luce in posizione "lightWorldMatrix" nella posizione "textureMatrix"
    // - seguendo le istruzioni dello shader "programInfo"
    drawScene(projectionMatrix, cameraMatrix, textureMatrix, lightWorldMatrix, programInfo) {
        const viewMatrix = m4.inverse(cameraMatrix);

        this.gl.useProgram(programInfo.program);

        // imposto gli uniforms che sono univoci per tutti gli obj
        const sharedUniforms = {
            // settaggi shader
            u_enableSpecular: this.enableSpecular,
            u_enableNormalMaps: this.enableNormalMaps,
            u_enableShadows: this.enableShadows,
            u_enableShading: this.enableShading,

            // intensità luce torcia
            u_lightPower: this.game.torchLight,

            u_view: viewMatrix,
            u_projection: projectionMatrix,
            u_bias: this.bias,
            u_textureMatrix: textureMatrix,
            u_projectedTexture: this.depthTexture,

            // gestione delle ombre
            u_innerLimit: Math.cos(degToRad(this.lightFOV / 2 - this.lightGradient)),
            u_outerLimit: Math.cos(degToRad(this.lightFOV / 2)),
            u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
            u_lightWorldPosition: lightWorldMatrix.slice(12, 15),
            u_viewWorldPosition: cameraMatrix.slice(12, 15),
        };

        webglUtils.setUniforms(programInfo, sharedUniforms);

        // estraggo tutte le info sui gameObj che devo "disegnare"
        let gameObjInfo = game.getGameObjInfo();

        gameObjInfo.forEach(element => {

            // ottengo la mash indicata dall'element
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

    // metodo che va a disegnare la skybox
    drawSkybox() {
        // estraggo dalla matrice di traslazione della camera la direzione della visuale
        // azzerando la posizione in cui si trova in modo che il punto di vista sia sempre al centro della skybox
        var viewDirectionMatrix = m4.inverse(this.viewMatrix);
        viewDirectionMatrix[12] = 0;
        viewDirectionMatrix[13] = 0;
        viewDirectionMatrix[14] = 0;

        var viewDirectionProjectionMatrix = m4.multiply(
            this.viewProjectionMatrix, viewDirectionMatrix);
        var viewDirectionProjectionInverseMatrix =
            m4.inverse(viewDirectionProjectionMatrix);

        // effettuo depth test
        // imposto come shader program da susare quello che gestisce la skybox
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.useProgram(this.skyboxProgramInfo.program);

        // carico info della skybox nello shader program e disegno
        var bufferInfo = webglUtils.createBufferInfoFromArrays(this.gl, this.quadBufferInfo);

        webglUtils.setBuffersAndAttributes(this.gl, this.skyboxProgramInfo, bufferInfo);
        webglUtils.setUniforms(this.skyboxProgramInfo, {
            u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
            u_skybox: this.skyTexture,
        });
        webglUtils.drawBufferInfo(this.gl, bufferInfo);
    }

    // metodi utilizzati per il disegno della ui
    drawStaminaBar() {
        // imposto dati per il disegno
        this.ctx.strokeStyle = "white";
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";

        // calcolo punti riferimento delle barre da disegnare
        let start = 4;
        let fullBarWidth = 50;
        let fullBarHeight = 2;

        let pixelToFill = (fullBarWidth * this.game.playerStamina) / this.game.playerStaminaMax;

        // disegno le due barre
        this.ctx.strokeRect(start, start, fullBarWidth + 2, start + fullBarHeight);
        this.ctx.fillRect(start + 1, start + 1, pixelToFill, start + fullBarHeight - 2);
    }

    writeOnScreenCenter(text) {
        // sfumo tutto lo schermo di nero
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        this.ctx.fillRect(0, 0, uiCanvas.width, uiCanvas.height);

        // calcolo dimensione della stringa
        let textWidth = this.ctx.measureText(text).width;

        // imposto la scritta bianca e il suo font
        this.ctx.font = '12px Abys';
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        this.ctx.fillText(text, (uiCanvas.width / 2) - (textWidth / 2), uiCanvas.height / 2)
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

        // aggiorno posizione punto di vista
        this.updateView();

        // ridisegno la scena dal punto di vista riportando i dati sulla depth texture
        this.drawScene(this.viewProjectionMatrix, this.viewMatrix, textureMatrix, this.lightWorldMatrix, this.meshProgramInfo);

        this.drawSkybox();

        // pulisco il canvas della ui
        this.ctx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
        this.drawStaminaBar()

        if (document.pointerLockElement != canvas && window.innerWidth > 1300)
            this.writeOnScreenCenter("Clicca qui")

        //loop
        this.game.updateStatus();
        controller.loop();

        requestAnimationFrame(this.render.bind(this));
    }
}