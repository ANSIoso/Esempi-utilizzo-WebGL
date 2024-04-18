var canvas;
var gl;

var mesh = new Array();

var program;
var attribSetters;
var uniformSetters;

// === obj "variables" ===
var arrays = {
  position:   { numComponents: 3, data: null, },
  texcoord:   { numComponents: 2, data: null, },
  normal:     { numComponents: 3, data: null, },
};

// buffer per attributi
var bufferInfo;
var loadedModelArray = [];

var ambientLight =[0.2,0.2,0.2];
var colorLight =[1.0,1.0,1.0];
var lightPosition = m4.normalize([-1, 3, 5]);

var uniformsForAll = {
  u_lightDirection:   lightPosition,
  u_ambientLight:     ambientLight,
  u_colorLight:       colorLight,
  u_view:             [0, 0, 0, 0],
  u_projection:       [0, 0, 0, 0],
  u_viewWorldPosition:[0, 0, 0],
}

var uniformsForEach = {
  diffuse: [0, 0, 0],
  //diffuseMap: 0,
  ambient: [0, 0, 0],
  specular: [0, 0, 0],
  emissive: [0, 0, 0],
  shininess: 0,
  opacity: 0,
  u_world: [0, 0, 0, 0],
};
var modelUniformArray = [];
var actualModelUniform;


// attributes
var positions = [];
var normals = [];
var texcoords = [];

// uniforms
var ambient;   //Ka
var diffuse;   //Kd
var specular;  //Ks
var emissive;  //Ke
var shininess; //Ns
var opacity;   //Ni

// immagini =============== togliere

const imageGatto = new Image();
imageGatto.src = "data/cat/Cat_diffuse.jpg";
const imageRuota = new Image();
imageRuota.src = "data/ruota/ruota_diffuse_giulio.png";

// immagini =============== togliere

var texture;

function setUpTextureBuffer(){
  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
}


function loadTexture1(gl, img) {
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([255, 255, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
           width, height, border, srcFormat, srcType, pixel);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,srcFormat, srcType, img);

  if (isPowerOf2(img.width) && isPowerOf2(img.height)) 
      gl.generateMipmap(gl.TEXTURE_2D); // Yes, it's a power of 2. Generate mips.
  else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }
  
  function isPowerOf2(value) {
     return (value & (value - 1)) == 0;
  }
}

function init(){
  canvas = document.getElementById("canvas");
  gl = canvas.getContext("webgl");

  setUpTextureBuffer();

  if(!canvas || !gl){
    console.log(`Stato caricamento: \n\tcanvas:\t${canvas} \n\twebgl:\t${gl}`);
    return;
  } 

  // mesh.sourceMesh='data/cat/12221_Cat_v1_l3.obj';
  // mesh.sourceMesh='data/cat/12221_Cat_v1_l3.obj';
  // mesh.sourceMesh='data/omo.obj';
  // mesh.sourceMesh='data/cube/cube.obj';
  // mesh.sourceMesh='data/chair/chair.obj';
  // mesh.sourceMesh='data/boeing/boeing_3.obj';
  //mesh.sourceMesh='data/soccerball/soccerball.obj';
  // mesh.sourceMesh='data/ruota/ruota_davanti_origine.obj';
  //mesh.sourceMesh='data/ruota/ruota_davanti_gomma.obj';

  // setup GLSL program
  program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
  attribSetters  = webglUtils.createAttributeSetters(gl, program);
  uniformSetters = webglUtils.createUniformSetters(gl, program);

  gl.useProgram(program); 
}

// ===== impostazioni della camera =====
function settingCamera(){
  var fieldOfViewRadians = degToRad(60);

  // Compute the projection matrix
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var zmin = 0.1;
  var zfar = 2000;
  var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zmin, zfar);

  var cameraPosition = [5, 1, 1];
  var up = [0, 0, 1];
  var target = [0, 0, 0];

  // Compute the camera's matrix using look at.
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // Make a view matrix from the camera matrix.
  var viewMatrix = m4.inverse(cameraMatrix);

  uniformsForAll.u_view = viewMatrix;
  uniformsForAll.u_projection = projectionMatrix;

  // set the camera/view position
  uniformsForAll.u_viewWorldPosition = cameraPosition;


  webglUtils.setUniforms(uniformSetters, uniformsForAll);
}

// function isPowerOf2(value) {
//   return (value & (value - 1)) === 0;
// }

function radToDeg(r) {
  return r * 180 / Math.PI;
}

function degToRad(d) {
  return d * Math.PI / 180;
}

function myLoadModel(posizione){
  mesh.sourceMesh = posizione;

  LoadMesh(gl,mesh);
  //console.log(mesh);
  
  arrays.position.data = positions;
  arrays.texcoord.data = texcoords;
  arrays.normal.data = normals;

  var loadedBufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);
  loadedModelArray.push(loadedBufferInfo);

  uniformsForEach.u_world = m4.identity();
  uniformsForEach.diffuse   = diffuse;  //Kd
  uniformsForEach.ambient   = ambient;  //Ka
  uniformsForEach.specular  = specular; //Ks
  uniformsForEach.emissive  = emissive; //Ke
  uniformsForEach.shininess = shininess;//Ns
  uniformsForEach.opacity   = opacity;  //Ni

  modelUniformArray.push(Object.assign({}, uniformsForEach));
}

function mySetModel(m, matrix){
  bufferInfo = loadedModelArray[m];
  webglUtils.setBuffersAndAttributes(gl, attribSetters, bufferInfo);

  // TOLTO all ue === var matrixLocation = gl.getUniformLocation(program, "u_world");
  // TOLTO all ue === 
  var textureLocation = gl.getUniformLocation(program, "diffuseMap");

  // Tell the shader to use texture unit 0 for diffuseMap
  // TOLTO all ue === 
  gl.uniform1i(textureLocation, 0);

  actualModelUniform = modelUniformArray[m];
  actualModelUniform.u_world = matrix;
  webglUtils.setUniforms(uniformSetters, actualModelUniform);
}

function main() {
  init();

  //gl.uniform3fv(gl.getUniformLocation(program, "u_lightDirection" ), xxx );

  settingCamera();

  var modelXRotationRadians = degToRad(0);
  var modelYRotationRadians = degToRad(0);

  myLoadModel('data/cat/12221_Cat_v1_l3.obj');
  myLoadModel('data/ruota/ruota_davanti_gomma.obj');

  // Get the starting time.
  var then = 0;

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    // ==== v_set up draw_v ====

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // ==== ^_set up draw_^ ====

    // convert to seconds
    time *= 0.001;
    // Subtract the previous time from the current time
    var deltaTime = time - then;
    // Remember the current time for the next frame.
    then = time;

    // Animate the rotation
    modelYRotationRadians += -0.7 * deltaTime;
    modelXRotationRadians += -0.4 * deltaTime;

    // =======================
    var matrix = m4.translate(m4.identity(), 0, 1, 0)
    matrix = m4.xRotate(matrix, modelXRotationRadians);
    matrix = m4.yRotate(matrix, modelYRotationRadians);
    
    mySetModel(0, matrix);
    loadTexture1(gl, imageGatto)
    gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    // =======================
    
    // =======================
    var matrix = m4.translate(m4.identity(), 0, -1, 0)
    matrix = m4.xRotate(matrix, modelXRotationRadians);
    matrix = m4.yRotate(matrix, modelYRotationRadians);

    mySetModel(1, matrix);
    loadTexture1(gl, imageRuota)
    gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    // =======================

    requestAnimationFrame(drawScene);
  }
}

main();