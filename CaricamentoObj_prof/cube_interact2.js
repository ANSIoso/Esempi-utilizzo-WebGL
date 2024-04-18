/*============= Creating a canvas ======================*/ 
var canvas = document.getElementById('my_Canvas');
gl = canvas.getContext('webgl');
//to manage text on canvas and webgl
// look up the text canvas.
var textCanvas = document.getElementById("text");
// make a 2D context for it
var ctx = textCanvas.getContext("2d");

/*========== Defining and storing the geometry ==========*/
var vertices=[
-1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1, -1,-1,1, 1,-1,1, 1,1,1, -1,1,1, -1,-1,-1, -1,1,-1, -1,1,1, -1,-1,1,
1,-1,-1, 1,1,-1, 1,1,1, 1,-1,1, -1,-1,-1, -1,-1,1, 1,-1,1, 1,-1,-1, -1,1,-1, -1,1,1, 1,1,1, 1,1,-1,];
// var colors1=[
//    1,0,1,  1,0,1,  1,0,1,  1,0,1,
//    1,0,0,  1,0,0,  1,0,0,  1,0,0,
//    0,0,1,  0,0,1,  0,0,1,  0,0,1,
//    0,1,1,  0,1,1,  0,1,1,  0,1,1,
//    1,1,0,  1,1,0,  1,1,0,  1,1,0,
//    0,1,0,  0,1,0,  0,1,0,  0,1,0,];
var colors=[
   0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
   0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
   0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
   0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
   0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,
   0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9,  0.9,0.9,0.9, 
   ];
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

// var color1_buffer = gl.createBuffer (); 
// gl.bindBuffer(gl.ARRAY_BUFFER, color1_buffer); 
// gl.bufferData(gl.ARRAY_BUFFER,
// new Float32Array(colors1), gl.STATIC_DRAW);

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
//  const shaderprogramInfo = webglUtils.createProgramInfo(gl, ['3d-vertex-shader', '3d-fragment-shader']);

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

var THETA=degToRad(20), PHI=degToRad(80);
var D = 8.5;

// var target = [0, 0, 0];
// get_target();
var target = [0, 0, 1.1];
var up = [0, 0, 1];

var drag;
var alpha = 0;

/*================= Mouse events ======================*/
// var AMORTIZATION=0.95;
// var drag=false;
// var old_x, old_y;
// var dX=0, dY=0;

 var mouseDown=function(e) {
    drag=true;
    old_x=e.pageX, old_y=e.pageY;
    e.preventDefault();
//    render();
    return false;
 };
var mouseUp=function(e){
   drag=false;
};
var mouseMove=function(e) {
if (!drag) return false; 
dX=-(e.pageX-old_x)*2*Math.PI/canvas.width; 
dY=-(e.pageY-old_y)*2*Math.PI/canvas.height; 
console.log('stampa',dX,dY);
THETA+=dX;
if (PHI+dY>=0 && PHI+dY<=Math.PI)
     PHI+=dY;
old_x=e.pageX, old_y=e.pageY; 
e.preventDefault();
render();
};

document.getElementById("Button1").onclick = function(){D *= 1.1; render()};
document.getElementById("Button2").onclick = function(){D *= 0.9; render()};
document.getElementById("Button3").onclick = function(){zmin  *= 1.1; zmax *= 1.1; render()};
document.getElementById("Button4").onclick = function(){zmin *= 0.9; zmax *= 0.9; render()};
document.getElementById("Button5").onclick = function(){fov  *= 1.1; fov *= 1.1; render()};
document.getElementById("Button6").onclick = function(){fov *= 0.9; fov *= 0.9; render()};
document.getElementById("Button7").onclick = function(){alpha += 5; render()};

canvas.onmousedown=mouseDown;
canvas.onmouseup=mouseUp;
canvas.mouseout=mouseUp;
canvas.onmousemove=mouseMove;

/*=================== Drawing =================== */

//var time_old=0;

var render=function() {
//var dt=time-time_old;

//if (!drag) {
//         dX*=AMORTIZATION, dY*=AMORTIZATION;
//         THETA+=dX, PHI+=dY;
//}

var proj_matrix = m4.perspective(fov, aspect, zmin, zmax);

var camera = [D*Math.sin(PHI)*Math.cos(THETA),
              D*Math.sin(PHI)*Math.sin(THETA),
              D*Math.cos(PHI)];
var view_matrix = m4.inverse(m4.lookAt(camera, target, up));

//time_old=time;          
gl.enable(gl.DEPTH_TEST);
// gl.depthFunc(gl.LEQUAL); 
gl.clearColor(1.0, 1.0, 1.0, 1); 
/*to manage text on canvas and webgl */
// Clear the 2D canvas
ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

gl.clearDepth(1.0);
gl.viewport(0.0, 0.0, canvas.width, canvas.height); 
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

gl.uniformMatrix4fv(_Pmatrix, false, proj_matrix); 
gl.uniformMatrix4fv(_Vmatrix, false, view_matrix); 
var mo_matrix=m4.identity();
gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix);

//Cubo a facce
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.vertexAttribPointer(_position, 3, gl.FLOAT, false,0,0); 
gl.enableVertexAttribArray(_position);

//gl.bindBuffer(gl.ARRAY_BUFFER, color1_buffer);
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

//Copia scalata, ruotata e poi traslata del cubo
var mo_matrix2=m4.identity();
mo_matrix2=m4.translate(mo_matrix2, 0, 0, 2);
mo_matrix2=m4.zRotate(mo_matrix2, degToRad(alpha));
mo_matrix2=m4.scale(mo_matrix2, 0.75, 0.75, 0.75);
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

/*to manage text on canvas and webgl */
  ctx.font = '18pt Calibri';
  ctx.fillStyle = 'green'; 
  ctx.fillText('Welcome to CG LAB', 40, 50);

//  window.requestAnimationFrame(render); 
}
           
render(0); 