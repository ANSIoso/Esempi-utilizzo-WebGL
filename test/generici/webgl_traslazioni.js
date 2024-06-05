var canvas;
var gl;

var shaderProgram;
var vertexPositionAttribLocation;

var translationLocation;
var rotationLocation;

const triangleVertix = 
[   0  , 1,
    0  , 0,
    0.2, 0,
    0.2, 0,
    0.2, 1,
    0  , 1,

    0.6 ,1  ,
    0   ,1  ,
    0   ,0.8,
    0   ,0.8,
    0.6 ,0.8,
    0.6 ,1  ,

    0.5 ,0.6,
    0   ,0.6,
    0   ,0.4,
    0   ,0.4,
    0.5 ,0.4,
    0.5 ,0.6,
]

translation = {
    x : 0.8,
    y : 0
}

translationIncrement = {
    x : 0.01,
    y : 0.01
}

rotation = 10;

rotationIncrement = 0.01;

function init(){
    canvas = document.getElementById("myCanvas");
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

    // individuo nel programma posizione uniforms
    translationLocation = gl.getUniformLocation(shaderProgram, 'u_traslation');
    rotationLocation = gl.getUniformLocation(shaderProgram, 'u_rotation');

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


function draw(){
    
    // ------- tr1 -------

    // - indico come i dati verranno caricati nell'attribute
    gl.vertexAttribPointer(vertexPositionAttribLocation, 2, gl.FLOAT, false, 0, 0);
    
    // - carico dati sull'array
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertix), gl.STATIC_DRAW);


    gl.uniform2fv(translationLocation, [translation.x, translation.y]);
    gl.uniform2fv(rotationLocation, [Math.sin((rotation)), Math.cos((rotation))]);

    // - disegno
    gl.drawArrays(gl.TRIANGLES, 0, 18);

    
}

function translationStep(){
    if (translation.x >= 1 || translation.x <= -1)
        translationIncrement.x *= -1;

    if (translation.y >= 1 || translation.y <= -1)
        translationIncrement.y *= -1;

    translation.x += translationIncrement.x;
    translation.y += translationIncrement.y;
}

function rotationStep(){
    if (rotation >= 360)
        rotation = 0;

    rotation+= rotationIncrement;
}

function loop(){
    requestAnimationFrame(loop);

    try{
        translationStep();
        rotationStep();
        draw();
    }catch(e){
        console.log(`errore: ${e}`);
    }
}

try{
    init();
    initDraw();
}catch(e){
    console.log(`errore: ${e}`);
}
loop();