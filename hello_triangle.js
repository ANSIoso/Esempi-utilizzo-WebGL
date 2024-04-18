var canvas;
var gl;

const triangleVertices = [0.0, 0.5, -0.5, -0.5, 0.5, -0.5]

// start
try{
    init();
    hello_triangle();
}catch(e){
    console.log(`errore: ${e}`);
}

// functions
function init(){
    canvas = document.getElementById('demo_canvas');
    gl = canvas.getContext('webgl');
    
    if(!canvas || !gl){
        console.log(`Stato caricamento: \n\tcanvas:\t${canvas} \n\twebgl:\t${gl}`);
        return;
    }
}

function hello_triangle(){
    // andiamo a convertire la variabile che contiene
    // i vertici del triangolo in modo che siano leggibili dalla gpu
    
    const tiangleGeoBuffer = gl.createBuffer();         //| Creiamo una memoria vertex e la connettiamo con 
    gl.bindBuffer(gl.ARRAY_BUFFER, tiangleGeoBuffer);   //|

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices) , gl.STATIC_DRAW); // indichiamo come lavoreremo con il buffer

    // ========= vVERTEX SHADERv =========
    // creo codice vertex shader
    const vertexShaderSourceCode = `
    attribute vec2 vertexPosition;

    void main(void) {
        gl_Position = vec4(vertexPosition, 0.0, 1.0);
    }`;

    // carico codice vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSourceCode);
    gl.compileShader(vertexShader)

    // controllo non ci siano errori di compilazione
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        const compilerError = gl.getShaderInfoLog(vertexShader);
        console.log(`Failed to COMPILE vertex shader - ${compilerError}`);
        return;
    }
    // ========= ^VERTEX SHADER^ =========

    // ========= vFRAGMENT SHADERv =========
    const fragmentShaderSourceCode = `
    void main(void) {
        gl_FragColor = vec4(0.294, 0.0, 0.51, 1.0);
    }`;
    
    // carico codice fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSourceCode);
    gl.compileShader(fragmentShader);

    // controllo non ci siano errori di compilazione
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        const compilerError = gl.getShaderInfoLog(fragmentShader);
        console.log(`Failed to COMPILE fragment shader - ${compilerError}`);
        return;
    }
    // ========= ^FRAGMENT SHADER^ =========

    // ========= vTOTAL SHADERv =========
    // creo il programma webgl collegando [vertexShader, fragmentShader]
    const triangeleShaderProgram = gl.createProgram();
    gl.attachShader(triangeleShaderProgram, vertexShader);
    gl.attachShader(triangeleShaderProgram, fragmentShader);
    gl.linkProgram(triangeleShaderProgram);

    // controllo che non ci siano problemi nel linking
    if(!gl.getProgramParameter(triangeleShaderProgram, gl.LINK_STATUS)){
        const linkError = gl.getShaderInfoLog(triangeleShaderProgram);
        console.log(`Failed to LINK shaders - ${linkError}`);
        return;
    }

    // impostare gpu program
    gl.useProgram(triangeleShaderProgram);
    // ========= ^TOTAL SHADER^ =========

    // vertexPositionAttribLocation deve essere sempre a 0
    const vertexPositionAttribLocation = gl.getAttribLocation(triangeleShaderProgram, 'vertexPosition');
    if (vertexPositionAttribLocation > 0){
        console.log('failed to get attrib location for vertexPosition');
        return;
    }
    gl.vertexAttribPointer(vertexPositionAttribLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionAttribLocation);


    // puliamo tutti i buffer e canvas
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.clearColor(0.08, 0.08, 0.08, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // impostiamo dimensioni del viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    // disegno triangolo    
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // FINE scollego
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}