var canvas;
var gl;

var cubeOBJ;
var omo;

function init() {
    canvas = document.getElementById('myCanvas');
    gl = canvas.getContext("webgl");

    if(!canvas || !gl){
        console.log(`Stato caricamento: \n\tcanvas:\t${canvas} \n\twebgl:\t${gl}`);
        return;
    }  

    // creo programma
    shaderProgram = webglUtils.createProgramFromScripts(gl, ["vertex-shader", "fragment-shader"]);

    gl.useProgram(shaderProgram);

    // individuo nel programma posizione attributi
    vertexPositionAttribLocation = gl.getAttribLocation(shaderProgram, 'vertexPosition');

    // individuo nel programma posizione uniform
    transformMatrixLocation = gl.getUniformLocation(shaderProgram, 'u_transformMatrix');

    // creo buffer e lo "connetto"
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


}

function initDraw(){
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // - attivo l'attributo
    gl.enableVertexAttribArray(vertexPositionAttribLocation);
}

function endDraw(){
    // == FINE scollego ==
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

async function main(){
    var response = await fetch('https://webglfundamentals.org/webgl/resources/models/cube/cube.obj');  
    var text = await response.text();
    cubeOBJ = parseOBJ(text);

    response = await fetch('models/omo.obj');  
    text = await response.text();
    omo = parseOBJ(text);

    init();
    initDraw();
    draw();
}


function degToRad(d) {
    return d * Math.PI / 180;
}

var cameraAngleRadians = degToRad(0);
var fieldOfViewRadians = degToRad(60);


function draw(){
    
    // ------- tr1 -------

    // - indico come i dati verranno caricati nell'attribute
    gl.vertexAttribPointer(vertexPositionAttribLocation, 3, gl.FLOAT, false, 0, 0);

    // ---------------------- Camera ----------------------
    var radius = 200;

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    // Compute a matrix for the camera
    var cameraMatrix = m4.yRotation(cameraAngleRadians);
    cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);

    // Make a view matrix from the camera matrix
    var viewMatrix = m4.inverse(cameraMatrix);

    // Compute a view projection matrix
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // ---------------------- Camera ----------------------


    // - carico dati sull'array
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeOBJ.position), gl.STATIC_DRAW);

    var matrix = m4.translate(viewProjectionMatrix, 0, 0, 0);

    gl.uniformMatrix4fv(transformMatrixLocation, false, m4.scaling(0.1, 0.1, 1));

    // - disegno
    gl.drawArrays(gl.TRIANGLES, 0, cubeOBJ.position.length);

    // --- omo ---

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(omo.position), gl.STATIC_DRAW);

    var transl_mat = m4.scaling(0.1, 0.1, 1);
    transl_mat = m4.translate(transl_mat, 1, -10, 0);
    
    gl.uniformMatrix4fv(transformMatrixLocation, false, transl_mat);


    gl.drawArrays(gl.TRIANGLES, 0, omo.position.length);
}

main();