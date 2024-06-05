var canvas;
var gl;

var slider_x_transl;
var slider_y_transl;
var slider_x_scale;
var slider_y_scale;
var slider_rotation;

var rotation = 0;
var translation = {
    x : 0,
    y : 0
}

var scale = {
    x : 1,
    y : 1
}

const triangleVertix = 
[   0  , 1, 0, 
    0  , 0, 0,
    0.2, 0, 0,
    0.2, 0, 0,
    0.2, 1, 0,
    0  , 1, 0,

    0.6 ,1  , 0,
    0   ,1  , 0,
    0   ,0.8, 0,
    0   ,0.8, 0,
    0.6 ,0.8, 0,
    0.6 ,1  , 0,

    0.5 ,0.6, 0,
    0   ,0.6, 0,
    0   ,0.4, 0,
    0   ,0.4, 0,
    0.5 ,0.4, 0,
    0.5 ,0.6, 0,
]

function init(){
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

function initInterface(){
    slider_x_transl = document.getElementById("x_transl");
    slider_y_transl = document.getElementById("y_transl");
    slider_x_scale = document.getElementById("x_scale");
    slider_y_scale = document.getElementById("y_scale");
    slider_rotation = document.getElementById("rotation");

    slider_x_transl.addEventListener("input", function () {
        translation.x = slider_x_transl.value;
        draw();
    })

    slider_y_transl.addEventListener("input", function () {
        translation.y = slider_y_transl.value;
        draw();
    })

    slider_x_scale.addEventListener("input", function () {
        scale.x = slider_x_scale.value;
        draw();
    })

    slider_y_scale.addEventListener("input", function () {
        scale.y = slider_y_scale.value;
        draw();
    })

    slider_rotation.addEventListener("input", function () {
        rotation = slider_rotation.value;
        draw();
    })
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

function draw(){
    
    // ------- tr1 -------

    // - indico come i dati verranno caricati nell'attribute
    gl.vertexAttribPointer(vertexPositionAttribLocation, 3, gl.FLOAT, false, 0, 0);

    // - carico dati sull'array
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertix), gl.STATIC_DRAW);

    
    
    var transform_mat = m4.translation(translation.x, translation.y, 0);
    transform_mat = m4.scale(transform_mat, scale.x, scale.y, 0);
    transform_mat = m4.xRotate(transform_mat, rotation * (Math.PI/180));
    
    transform_mat = m4.translate(transform_mat, -0.5, -0.6, 0);

    gl.uniformMatrix4fv(transformMatrixLocation, false, transform_mat);

    // - disegno
    gl.drawArrays(gl.TRIANGLES, 0, 18);

    // ------- tr2 -------

    scale_mat = m4.scaling(0.5, 0.5, 0);

    gl.uniformMatrix4fv(transformMatrixLocation, false, scale_mat);

    gl.drawArrays(gl.TRIANGLES, 0, 18);
}

try{
    init();
    initInterface();
    initDraw();
    draw();
}catch(e){
    console.log(`errore: ${e}`);
}