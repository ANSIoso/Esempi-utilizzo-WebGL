// components from html
var canvas;
var gl;

var uiDistance

// shader program variables
var program;
var uniformSetters;
var attribSetters;

// === obj "variables" ===
var arrays = {
    position:   { numComponents: 3, data: null, },
    normal:     { numComponents: 3, data: null, },
};

var uniforms = {
    u_worldViewProjection:   m4.identity(),
    u_worldInverseTranspose: m4.identity(),
    u_reverseLightDirection: m4.normalize([1, 0.7, 1]),
};

var rotation = 0;
var z_position = 0;
// === obj "variables" ===

// === v_camera "variables"_v ===
var zNear = 1;
var zFar = 2000;

var fieldOfViewRadians = 90;

var cameraAngleRadians = 0;
var x_cam = 0, y_cam = 0, z_cam = 0; 
// === ^_camera "variables"_^ ===

// === functions ===
function init(){
    canvas = document.getElementById('myCanvas');
    gl = canvas.getContext("webgl");

    if(!canvas || !gl){
        console.log(`Stato caricamento: \n\tcanvas:\t${canvas} \n\twebgl:\t${gl}`);
        return;
    }  

    // creo il programma e imposto getter e setter
    program = webglUtils.createProgramFromScripts(gl, ["vertex-shader", "fragment-shader"]);
    uniformSetters = webglUtils.createUniformSetters(gl, program);
    attribSetters  = webglUtils.createAttributeSetters(gl, program);

    initInterface();

    z_position = uiDistance.value
}

function initInterface(){
    uiDistance = document.getElementById("z_transl");

    uiDistance.addEventListener("input", function(){
        z_position = uiDistance.value;
        console.log(z_position);
    });

    window.onkeydown= function(e){

        switch (e.key) {
            case 'w':
                z_cam -= 0.1;
                break;
            case 's':
                z_cam += 0.1;
                break;
            case 'a':
                x_cam -= 0.1;
                break;
            case 'd':
                x_cam += 0.1;
                break;
            case 'Shift':
                y_cam -= 1;
                break;
            case ' ':
                y_cam += 1;
                break;

            case 'e':
                cameraAngleRadians -= 0.1;
                break;
            case 'q':
                cameraAngleRadians += 0.1;
                break;
        
            default:
                break;
        }  
    }; 
}

function initDraw(){
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);
    
    gl.enable(gl.DEPTH_TEST);
}

async function loadModel(position){
    var response = await fetch(position);  
    var text = await response.text();
    return parseOBJ(text);
}


async function main() {
    init();

    var cubeOBJ = await loadModel('models/ruota/ruota_davanti_gomma.obj');
    var omoOBJ = await loadModel('models/omo.obj');

    function drawScene() {
        rotation += 0.01;

        if(rotation == 360)
            rotation = 0;

        initDraw()

        // ===== v_impostazioni della camera_v =====
        
        // matrice proiezionie
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        // posizione camera
        var cameraMatrix = m4.yRotation(cameraAngleRadians);
        cameraMatrix = m4.translate(cameraMatrix, x_cam, y_cam, z_cam);
        var viewMatrix = m4.inverse(cameraMatrix);

        var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        // ===== ^_impostazioni della camera_^ =====

        // ===== v_carico l'omo_v =====

        // creo i buffer per gli attribute e li imposto
        arrays.position.data = omoOBJ.position;
        arrays.normal.data = omoOBJ.normal;

        var bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);

        webglUtils.setBuffersAndAttributes(gl, attribSetters, bufferInfo);
        
        // calcolo laposizione del modello nel modo
        matrix = m4.translation(-10, 0, z_position);
        m4.yRotate(matrix, rotation, matrix);
        m4.translate(matrix, 0, -10, 0, matrix);

        // calcolo la proiezione riepetto al punto di vista

        var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, matrix);
        var worldInverseMatrix = m4.inverse(matrix);
        var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);
        
        // carico gli uniform e li setto
        uniforms.u_worldViewProjection = worldViewProjectionMatrix;
        uniforms.u_worldInverseTranspose = worldInverseTransposeMatrix;
    
        webglUtils.setUniforms(uniformSetters, uniforms);
    
        // disegno geometria
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);

        // ===== ^_carico l'omo_^ =====

        // ======================

        arrays.position.data = cubeOBJ.position;
        console.log(cubeOBJ.texcoord);
        arrays.normal.data = cubeOBJ.normal;

        var bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);
    
        // Setup all the needed attributes.
        webglUtils.setBuffersAndAttributes(gl, attribSetters, bufferInfo);

        matrix = m4.translation(10, 0, z_position);
        m4.yRotate(matrix, rotation, matrix);
        m4.scale(matrix, 1, 1, 1, matrix);
        m4.translate(matrix, 0, 0, -10, matrix);
        
        var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, matrix);
        var worldInverseMatrix = m4.inverse(matrix);
        var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

        uniforms.u_worldViewProjection = worldViewProjectionMatrix;
        uniforms.u_worldInverseTranspose = worldInverseTransposeMatrix;
    
        // Set the uniforms
        webglUtils.setUniforms(uniformSetters, uniforms);
    
        // Draw the geometry.
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);

        requestAnimationFrame(drawScene)
    }

    drawScene();
}

main();
