var canvas;
var gl;

const triangleVertices = 
    [-0.5, 1, 
    -0.5, 0, 
     0.5, 0,
    -0.5, 1,
     0.5, 1,
     0.5, 0
    ]
const triangleVertices1 = [0.0, 0, -0.5, -1, 0.5, -1]

function init(){
    canvas = document.getElementById("myCanvas");
    gl = canvas.getContext("webgl");

    if(!canvas || !gl){
        console.log(`Stato caricamento: \n\tcanvas:\t${canvas} \n\twebgl:\t${gl}`);
        return;
    }

    my_render();
}

function my_render(){

    // ------- START -------
    
    // puliamo tutti i buffer e canvas
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.clearColor(0.08, 0.08, 0.08, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // impostiamo dimensioni del viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    var shaderprogram = webglUtils.createProgramFromScripts(gl, ["vertex-shader", "fragment-shader"]);
    gl.useProgram(shaderprogram);

    // ------- START -------

    // creiamo un buffer che andremo a utilizzare per passare dati allo shader program
    //
    //            questo è il buffer che creiamo
    //          ↙
    const positionBuffer  = gl.createBuffer();

    //                   questp è il buffer che useremo
    //                   |
    //                   |                connettiamo il buffer prima creato al buffer che useremo
    //                  ↙               ↙
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer );   













    // ------- tr1 -------

    // scriviamo sul buffer la figura che vogliamo visualizzare
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices) , gl.STATIC_DRAW); // indichiamo come lavoreremo con il buffer

    // diciamo a gl in quale variabili dello shader program dovrà inserire gli attribute
    //                                                                                |
    //                                                                               ↙
    const vertexPositionAttribLocation = gl.getAttribLocation(shaderprogram, 'vertexPosition');
    if (vertexPositionAttribLocation > 0){
        console.log('failed to get attrib location for vertexPosition');
        return;
    }
    gl.vertexAttribPointer(vertexPositionAttribLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionAttribLocation);

    // disegno ciò che si trova attualmente all'interno di "gl.ARRAY_BUFFER"
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // ------- tr1 -------

    // ------- tr2 -------
    // scriviamo sul buffer la figura che vogliamo visualizzare
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices1) , gl.STATIC_DRAW); // indichiamo come lavoreremo con il buffer

    const vertexPositionAttribLocation1 = gl.getAttribLocation(shaderprogram, 'vertexPosition');
    if (vertexPositionAttribLocation > 0){
        console.log('failed to get attrib location for vertexPosition');
        return;
    }
    gl.vertexAttribPointer(vertexPositionAttribLocation1, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionAttribLocation1);

    // disegno ciò che si trova attualmente all'interno di "gl.ARRAY_BUFFER"
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // ------- tr2 -------

    // FINE scollego
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

try{
    init();
}catch(e){
    console.log(`errore: ${e}`);
}