/*============= Creating a canvas ======================*/ 
var canvas = document.getElementById('mycanvas');
gl = canvas.getContext('webgl');
/// get computed style for image
var cont = document.getElementById('canvas_container');
var cs = getComputedStyle(cont);

/// these will return dimensions in *pixel* regardless of what
/// you originally specified for image:
var width = parseInt(cs.getPropertyValue('width'), 10);
var height = parseInt(cs.getPropertyValue('height'), 10);

//canvas.width = width;
//canvas.height = height;
//console.log(canvas.width,canvas.height);
var bbox = canvas.getBoundingClientRect();
//console.log(bbox.left,bbox.top,bbox.width,bbox.height);

var width = parseInt(cs.getPropertyValue('width'), 10);
var height = parseInt(cs.getPropertyValue('height'), 10);
//console.log(window.innerWidth + "x" + window.innerHeight);
//console.log(window.screen.width + "x" + window.screen.height);
//console.log(window.screen.availWidth + "x" + window.screen.availHeight);
//console.log(width,height);

/*========== Defining and storing the geometry ==========*/
var vertices=[
-1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1, -1,-1,1, 1,-1,1, 1,1,1, -1,1,1, -1,-1,-1, -1,1,-1, -1,1,1, -1,-1,1,
1,-1,-1, 1,1,-1, 1,1,1, 1,-1,1, -1,-1,-1, -1,-1,1, 1,-1,1, 1,-1,-1, -1,1,-1, -1,1,1, 1,1,1, 1,1,-1,];
var colors=[   
   1,0,0,  1,0,0,  1,0,0,  1,0,0,
   0,1,1,  0,1,1,  0,1,1,  0,1,1,
   0,0,1,  0,0,1,  0,0,1,  0,0,1,
   0,1,0,  0,1,0,  0,1,0,  0,1,0,   
   1,1,0,  1,1,0,  1,1,0,  1,1,0,  
   1,0,1,  1,0,1,  1,0,1,  1,0,1];
// var colors=[
//    0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
//    0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
//    0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
//    0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
//    0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
//    0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9, 
//    ];
var indices = [
0,1,2, 0,2,3, 4,5,6, 4,6,7, 8,9,10, 8,10,11, 12,13,14, 12,14,15, 16,17,18, 16,18,19, 20,21,22, 20,22,23 ];

var vertices2=[
-1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1, -1,-1,1, 1,-1,1, 1,1,1, -1,1,1,];
var colors2=[
   0,0,0,  0,0,0,  0,0,0,  0,0,0,
   0,0,0,  0,0,0,  0,0,0,  0,0,0];
var indices2 = [
 0,1, 1,2, 2,3, 3,0, 4,5, 5,6, 6,7, 7,4, 1,5, 2,6, 3,7, 0,4]; 

// Create and store data into vertex buffer 
var vertex_buffer = gl.createBuffer (); 
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer); 
gl.bufferData(gl.ARRAY_BUFFER,
new Float32Array(vertices), gl.STATIC_DRAW);
// Create and store data into color buffer 
var color_buffer = gl.createBuffer (); 
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer); 
gl.bufferData(gl.ARRAY_BUFFER,
new Float32Array(colors), gl.STATIC_DRAW);
// Create and store data into index buffer
var index_buffer= gl.createBuffer (); 
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer); 
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW); 

var vertex_buffer2 = gl.createBuffer (); 
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer2); 
gl.bufferData(gl.ARRAY_BUFFER,
new Float32Array(vertices2), gl.STATIC_DRAW);
// Create and store data into color buffer 
var color_buffer2 = gl.createBuffer (); 
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer2); 
gl.bufferData(gl.ARRAY_BUFFER,
new Float32Array(colors2), gl.STATIC_DRAW);
// Create and store data into index buffer
var index_buffer2= gl.createBuffer (); 
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer2); 
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices2), gl.STATIC_DRAW); 

//usa libreria webgl-utilis.js
var shaderprogram = webglUtils.createProgramFromScripts(gl, 
   ["vertex-shader", "fragment-shader"]);

// setup GLSL program
// compiles shader, links program, look up locations
// const shaderprogramInfo = webglUtils.createProgramInfo(gl, ['3d-vertex-shader', '3d-fragment-shader']);

/*======== Associating attributes to vertex shader =====*/
var _Pmatrix = gl.getUniformLocation(shaderprogram, "Pmatrix"); 
var _Vmatrix = gl.getUniformLocation(shaderprogram, "Vmatrix"); 
var _Mmatrix = gl.getUniformLocation(shaderprogram, "Mmatrix");
var _position = gl.getAttribLocation(shaderprogram, "position"); 
var _color = gl.getAttribLocation(shaderprogram, "color"); 

gl.useProgram(shaderprogram);   

//    gl.useProgram(shaderprogramInfo.program);
//    webglUtils.setUniforms(shaderprogramrogramInfo, {
//      Vmatrix: view_matrix,
//      Pmatrix: proj_matrix,
//    });

function get_target(){
var min_xyz=[], max_xyz=[];
  min_xyz=[vertices[0],vertices[1],vertices[2]];
  max_xyz=[vertices[0],vertices[1],vertices[2]];
  for (var k=0; k<vertices.length/3; k++)
      for (var j=0; j<3; j++){
        if (vertices[k+j] > max_xyz[j]) max_xyz[j] = vertices[k+j];
                else if (vertices[k+j] < min_xyz[j]) min_xyz[j] = vertices[k+j];
      }
  for (var k=0;k<vertices2.length/3;k++)
      for (var j=0; j<3; j++){
        if (vertices2[k+j] > max_xyz[j]) max_xyz[j] = vertices2[k+j];
                else if (vertices2[k+j] < min_xyz[j]) min_xyz[j] = vertices2[k+j];
      }
/* centro oggetto iniziale */
  target[0] = (min_xyz[0] + max_xyz[0])/2;
  target[1] = (min_xyz[1] + max_xyz[1])/2;
  target[2] = (min_xyz[2] + max_xyz[2])/2;
}

function degToRad(d) {
   return d * Math.PI / 180;
}

//usa libreria m4.js per definire proj_matrix
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var zmin = 1;
var zmax = 100;
var fov = degToRad(40);

// var mo_matrix=[
//     1,0,0,0,
//     0,1,0,0,
//     0,0,1,0,
//     0,0,0,1];

var THETA=degToRad(225), PHI=degToRad(115);
var D = 13.0;

//var target = [0, 0, 0];
//get_target();
target = [0, 0, 1.1];
var up = [0, 0, 1];

var drag;
var alpha = 0;

/*================= Mouse events ======================*/
// var AMORTIZATION=0.95;
// var drag=false;
var old_x, old_y;
var old;

 var mouseDown=function(e) {
    drag=true;
    canvas.style.backgroundColor = "red";
    old = windowToCanvas(canvas, e.pageX, e.pageY);
//    old_x=e.pageX, old_y=e.pageY;
//    e.preventDefault();
//    render();
//    return false;
 };

var mouseUp=function(e){
   drag=false;
   canvas.style.backgroundColor = "white";
//   render();
};

var mouseMove=function(e) {
if (!drag) return false; 
// dX=-(e.pageX-old_x)*2*Math.PI/canvas.width; 
// dY=-(e.pageY-old_y)*2*Math.PI/canvas.height; 
var cur = windowToCanvas(canvas, e.pageX, e.pageY);
//console.log('stampa',e.pageX,e.pageY);
dX=-(cur.x-old.x)*2*Math.PI/canvas.width; 
dY=-(cur.y-old.y)*2*Math.PI/canvas.height; 
//console.log('stampa',dX,dY);
THETA+=dX;
PHI+=dY;
old.x=cur.x, old.y=cur.y; 
e.preventDefault();
render();
};

function windowToCanvas(canvas, x, y) {
var bbox = canvas.getBoundingClientRect();

return { x: Math.round(x - bbox.left * (canvas.width  / bbox.width)),
         y: Math.round(y - bbox.top  * (canvas.height / bbox.height))
       };
}

canvas.onmousedown=mouseDown;
canvas.onmouseup=mouseUp;
canvas.onmouseout=mouseUp;
canvas.onmousemove=mouseMove;

function reportWindowSize() {
/// these will return dimensions in *pixel* regardless of what
/// you originally specified for image:
var width = parseInt(cs.getPropertyValue('width'), 10);
var height = parseInt(cs.getPropertyValue('height'), 10);

//console.log(window.innerWidth + "x" + window.innerHeight);
//console.log(window.screen.width + "x" + window.screen.height);
//console.log(window.screen.availWidth + "x" + window.screen.availHeight);
//console.log(width,height);

/* canvas.width = width;
canvas.height = height;
console.log(canvas.width,canvas.height);
var bbox = canvas.getBoundingClientRect();
console.log(bbox.left,bbox.top,bbox.width,bbox.height);
 */}

window.onresize = reportWindowSize;

canvas.addEventListener("touchstart", function(event) {
  var touch;
	if (event.targetTouches.length == 1) {
		touch = event.targetTouches[0];
    drag=true;
    canvas.style.backgroundColor = "red";
    old_x=touch.pageX, old_y=touch.pageY;
    //touch.preventDefault();
  return false;
  }
});

canvas.addEventListener("touchend", function(event) {
	drag=false;
  canvas.style.backgroundColor = "white";
});

canvas.addEventListener("touchmove", function(event) {
	var touch;
	if (event.targetTouches.length == 1) {
		touch = event.targetTouches[0];
    if (!drag) return false; 
    dX=-(touch.pageX-old_x)*2*Math.PI/canvas.width; 
    dY=-(touch.pageY-old_y)*2*Math.PI/canvas.height; 
//console.log('stampa',dX,dY);
    THETA+=dX;
    PHI+=dY;
    old_x=touch.pageX, old_y=touch.pageY; 
//    event.preventDefault();
    render();
	}
});

/*=================== Drawing =================== */
var define_cube=function(dx,dy,dz){
var val=0.0125;
if (dx>0)
  xeps=val;
else
  if (dx<0)
    xeps=-val;
  else
    xeps=0;

if (dy>0)
  yeps=val;
else
  if (dy<0)
    yeps=-val;
  else
    yeps=0;

if (dz>0)
  zeps=val;
else
  if (dz<0)
    zeps=-val;
  else
    zeps=0;

//Copia traslata del cubo
var mo_matrix2=m4.identity();
mo_matrix2=m4.translate(mo_matrix2, dx+xeps, dy+yeps, dz+zeps);
gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix2);

//Cubo a facce
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.vertexAttribPointer(_position, 3, gl.FLOAT, false,0,0); 
gl.enableVertexAttribArray(_position);

gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.vertexAttribPointer(_color, 3, gl.FLOAT, false,0,0) ; 
gl.enableVertexAttribArray(_color);

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

//Cubo a linee
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer2);
gl.vertexAttribPointer(_position, 3, gl.FLOAT, false,0,0); 
gl.enableVertexAttribArray(_position);

gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer2);
gl.vertexAttribPointer(_color, 3, gl.FLOAT, false,0,0) ; 
gl.enableVertexAttribArray(_color);

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer2);
gl.drawElements(gl.LINES, indices2.length, gl.UNSIGNED_SHORT, 0);

//Cubo a linee
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer2);
gl.vertexAttribPointer(_position, 3, gl.FLOAT, false,0,0); 
gl.enableVertexAttribArray(_position);

gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer2);
gl.vertexAttribPointer(_color, 3, gl.FLOAT, false,0,0) ; 
gl.enableVertexAttribArray(_color);

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer2);
gl.drawElements(gl.LINES, indices2.length, gl.UNSIGNED_SHORT, 0);

}

var render=function() {

// if (!drag) {
//         dX*=AMORTIZATION, dY*=AMORTIZATION;
//         THETA+=dX, PHI+=dY;
// }

var proj_matrix = m4.perspective(fov, aspect, zmin, zmax);

var camera = [D*Math.sin(PHI)*Math.cos(THETA),
              D*Math.sin(PHI)*Math.sin(THETA),
              D*Math.cos(PHI)];
var view_matrix = m4.inverse(m4.lookAt(camera, target, up));
         
gl.enable(gl.DEPTH_TEST);
//gl.depthFunc(gl.LEQUAL); 
gl.clearColor(1.0, 1.0, 1.0, 1); 

gl.clearDepth(1.0);
gl.viewport(0.0, 0.0, canvas.width, canvas.height); 
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

gl.uniformMatrix4fv(_Pmatrix, false, proj_matrix); 
gl.uniformMatrix4fv(_Vmatrix, false, view_matrix); 

define_cube(0,0,0);
define_cube(2,0,0);
define_cube(0,2,0);
define_cube(-2,0,0);
define_cube(0,-2,0);
define_cube(-2,2,0);
define_cube(2,-2,0);
define_cube(-2,0,2);
define_cube(0,-2,2);
define_cube(0,0,2);
define_cube(0,0,-2);
define_cube(2,0,-2);
define_cube(0,2,-2);

}

render(0);
