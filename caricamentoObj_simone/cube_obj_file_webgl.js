"use strict";
let vet = new Array()

let canvas = document.getElementById("canvas");
  let gl = canvas.getContext("webgl");
  if (!gl) {
    console('ciao') 
  }
let s = 
{
 mesh : [],
 positions : [],
 normals : [],
 texcoords : [],
 numVertices: 0,
 ambient: 0,   //Ka
 diffuse: 0,   //Kd
 specular: 0,  //Ks
 emissive: 0,  //Ke
 shininess: 0, //Ns
 opacity: 0,   //Ni
 normalsBuffer: [],
 texcoordsBuffer: [],
 positionsBuffer: [],
}
let s1 = 
{
 mesh : [],
 positions : [],
 normals : [],
 texcoords : [],
 numVertices: 0,
 ambient: 0,   //Ka
 diffuse: 0,   //Kd
 specular: 0,  //Ks
 emissive: 0,  //Ke
 shininess: 0, //Ns
 opacity: 0,   //Ni
 normalsBuffer:  [],
 texcoordsBuffer: [],
 positionsBuffer: [],
}
vet.push(s)
vet.push(s1)
var program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
gl.useProgram(program);
var matrixLocation = gl.getUniformLocation(program, "u_world");
var textureLocation = gl.getUniformLocation(program, "diffuseMap");
var viewMatrixLocation = gl.getUniformLocation(program, "u_view");
var projectionMatrixLocation = gl.getUniformLocation(program, "u_projection");
var lightWorldDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
var viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
function prova(pathMesh) {
  for(let index = 0; index < 2; index++){

  vet[index].mesh.sourceMesh = pathMesh[index];
  LoadMesh(gl,vet[index]);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var normalLocation = gl.getAttribLocation(program, "a_normal");
  var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

  // Create a buffer for positions
  vet[index].positionsBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, vet[index].positionsBuffer);
  // Put the positions in the buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vet[index].positions), gl.STATIC_DRAW);

  // Create a buffer for normals
  vet[index].normalsBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER mormalsBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, vet[index].normalsBuffer);
  // Put the normals in the buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vet[index].normals), gl.STATIC_DRAW);

  // provide texture coordinates
  vet[index].texcoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vet[index].texcoordsBuffer);
  // Set Texcoords
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vet[index].texcoords), gl.STATIC_DRAW);

  var ambientLight=[0.2,0.2,0.2];
  var colorLight=[1.0,1.0,1.0];

  gl.uniform3fv(gl.getUniformLocation(program, "diffuse" ), vet[index].diffuse );
  gl.uniform3fv(gl.getUniformLocation(program, "ambient" ), vet[index].ambient); 
  gl.uniform3fv(gl.getUniformLocation(program, "specular"), vet[index].specular );	
  gl.uniform3fv(gl.getUniformLocation(program, "emissive"), vet[index].emissive );
  //gl.uniform3fv(gl.getUniformLocation(program, "u_lightDirection" ), xxx );
  gl.uniform3fv(gl.getUniformLocation(program, "u_ambientLight" ), ambientLight );
  gl.uniform3fv(gl.getUniformLocation(program, "u_colorLight" ), colorLight );

  gl.uniform1f(gl.getUniformLocation(program, "shininess"), vet[index].shininess);
  gl.uniform1f(gl.getUniformLocation(program, "opacity"), vet[index].opacity);

  // Turn on the position attribute
  gl.enableVertexAttribArray(positionLocation);
  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, vet[index].positionsBuffer);
  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 3;          // 3 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

  // Turn on the normal attribute
  gl.enableVertexAttribArray(normalLocation);
  // Bind the normal buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, vet[index].normalsBuffer);
  gl.vertexAttribPointer(normalLocation, size, type, normalize, stride, offset);

  // Turn on the texcord attribute
  gl.enableVertexAttribArray(texcoordLocation);
  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, vet[index].texcoordsBuffer);
  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  size = 2;          // 2 components per iteration
  gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);
  var fieldOfViewRadians = degToRad(30);
  var modelXRotationRadians = degToRad(0);
  var modelYRotationRadians = degToRad(0);

  // Compute the projection matrix
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  //  zmin=0.125;
  var zmin=0.1;
  var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zmin, 200);

  var cameraPosition = [4.5, 4.5, 2];
  var up = [0, 0, 1];
  var target = [0, 0, 0];

  // Compute the camera's matrix using look at.
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // Make a view matrix from the camera matrix.
  var viewMatrix = m4.inverse(cameraMatrix);

  gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
  gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
        
  // set the light position
  gl.uniform3fv(lightWorldDirectionLocation, m4.normalize([-1, 3, 5]));

  // set the camera/view position
  gl.uniform3fv(viewWorldPositionLocation, cameraPosition);

  // Tell the shader to use texture unit 0 for diffuseMap
  gl.uniform1i(textureLocation, 0);

 

  
  requestAnimationFrame(drawScene);

  

  // Get the starting time.
  var then = 0;
  // Draw the scene.
  function drawScene(time) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
   
    // convert to seconds
    time *= 0.001;
    // Subtract the previous time from the current time
    var deltaTime = time - then;
    // Remember the current time for the next frame.
    then = time;

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    //gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    var matrix = m4.identity();
    // matrix = m4.xRotate(matrix, modelXRotationRadians);
    // matrix = m4.yRotate(matrix, modelYRotationRadians);
    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);
    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, vet[0].numVertices);
      // Clear the canvas AND the depth buffer.
    
    var matrix2 = m4.identity();
    matrix2 = m4.translate(matrix2,1,0,0);
    matrix2 = m4.zRotate(matrix2, degToRad(180))
    // matrix = m4.yRotate(matrix, modelYRotationRadians);
    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix2);
    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, vet[1].numVertices);
    
    
    
    requestAnimationFrame(drawScene);
  }
  }
}

function main(){
  prova(['data/cat/12221_Cat_v1_l3.obj','data/horse/10026_Horse_v01-it2.obj'])

}

main()


  function degToRad(d) {
    return d * Math.PI / 180;
  }