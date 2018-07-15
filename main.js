//////////////////////////////////////////////////////////////////////////////////
//    Init
//////////////////////////////////////////////////////////////////////////////////

// init renderer
let renderer  = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setClearColor(new THREE.Color('lightgrey'), 0);
renderer.setSize(640, 480);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0px';
renderer.domElement.style.left = '0px';
document.body.appendChild(renderer.domElement);

// array of functions for the rendering loop
let onRenderFcts = [];

// init scene and camera
let scene = new THREE.Scene();

//////////////////////////////////////////////////////////////////////////////////
//    Initialize a basic camera
//////////////////////////////////////////////////////////////////////////////////

// Create a camera
let camera = new THREE.Camera();
scene.add(camera);

////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////

let arToolkitSource = new THREEx.ArToolkitSource({ sourceType : 'webcam' });
arToolkitSource.init(_ => onResize());

// handle resize
window.addEventListener('resize', _ => onResize());
let onResize = _ => {
  arToolkitSource.onResize();
  arToolkitSource.copySizeTo(renderer.domElement);
  if(arToolkitContext.arController !== null)
    arToolkitSource.copySizeTo(arToolkitContext.arController.canvas);
};

////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////

// create atToolkitContext
let arToolkitContext = new THREEx.ArToolkitContext({
  cameraParametersUrl: '../data/camera_para.dat',
  detectionMode: 'mono'
});

// initialize it
arToolkitContext.init(_ => camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix()));

// update artoolkit on every frame
onRenderFcts.push(_ => {
  if(arToolkitSource.ready === false) return;

  arToolkitContext.update(arToolkitSource.domElement);

  // update scene.visible if the marker is seen
  scene.visible = camera.visible;
});

////////////////////////////////////////////////////////////////////////////////
//          Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////

// init controls for camera
let mengerMarker = new THREE.Group;
mengerMarker.name = 'menger';
scene.add(mengerMarker);
let mengerMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, mengerMarker, {
  type: 'pattern',
  patternUrl: '../data/menger.patt',
//  changeMatrixMode: 'cameraTransformMatrix'
});
// add a gizmo in the center of the marker
var geometry  = new THREE.OctahedronGeometry( 0.1, 0 )
var material  = new THREE.MeshNormalMaterial({
  wireframe: true
}); 
var mesh  = new THREE.Mesh( geometry, material );
mengerMarker.add( mesh );
// as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
//scene.visible = false;

let sierpinskiMarker = new THREE.Group;
sierpinskiMarker.name = 'sierpinski';
scene.add(sierpinskiMarker);
let sierpinskiMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, sierpinskiMarker, {
  type: 'pattern',
  patternUrl: '../data/sierpinski.patt',
//  changeMatrixMode: 'cameraTransformMatrix'
});
// add a gizmo in the center of the marker
var geometry  = new THREE.OctahedronGeometry( 0.1, 0 )
var material  = new THREE.MeshNormalMaterial({
  wireframe: true
}); 
var mesh  = new THREE.Mesh( geometry, material );
sierpinskiMesh.add( mesh );


//////////////////////////////////////////////////////////////////////////////////
//    add an object in the scene
//////////////////////////////////////////////////////////////////////////////////

/* //ALL Sierpinski Sponge
let material = new THREE.MeshNormalMaterial({
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide
});
var cubeGeom = new THREE.BoxGeometry(1,1,1);
function genFrac(geom){
  var mergedGeometry = new THREE.Geometry();
  var tempG = geom;
  for(i=0;i<27;i++){
    if(!([22,16,14,13,12,10,4].includes(i))){
      tempG.translate(i%3,Math.floor(i/3)%3,Math.floor(i/9)%3)
      mergedGeometry.merge(tempG);
      tempG.translate(-(i%3),-(Math.floor(i/3)%3),-(Math.floor(i/9)%3))
    }
  }
  return mergedGeometry.scale(1/3,1/3,1/3);
}

var menger1 = genFrac(cubeGeom);
console.log(menger1);
var menger2 = genFrac(menger1);
var menger3 = genFrac(menger2);
//var menger4 = genFrac(menger3);

var selection = menger3
selection.translate(-0.5,0,-0.5)

scene.add(new THREE.Mesh(selection,material));
*/

//Chaos Game
function rand(min, max) {
  return (Math.floor(Math.random() * (max - min + 1)) + min);
}

var pointPos = [0,0.5,0];
var lastPos = [0,0.5,0];
var colorRepeat = [255,0,0];
var vertices = [new THREE.Vector3(-0.5,0,0.5),new THREE.Vector3(0.5,0,0.5),new THREE.Vector3(0,0.5,-0.5),new THREE.Vector3(0,1,0.5)] //3D Sierpinski Triangle
var t = 0

function newPoint(){
  var tempRand = rand(0,vertices.length-1);
  var temp = vertices[tempRand];
  return [(lastPos[0]+temp.x)/2,(lastPos[1]+temp.y)/2,(lastPos[2]+temp.z)/2];

}

var geometry = new THREE.BufferGeometry();
geometry.addAttribute( 'position', new THREE.Float32BufferAttribute(pointPos, 3 ) );

geometry.addAttribute( 'color', new THREE.Float32BufferAttribute([255,0,0], 3 ) );
var material = new THREE.PointsMaterial( { size: 0.01, vertexColors: THREE.VertexColors} );
var points = new THREE.Points(geometry,material);
scene.add(points)

var inter = setInterval(function(){
  if(!scene.visible){
    return;
  }

  t++;
  pointPos.push(lastPos[0],lastPos[1],lastPos[2]);
  lastPos = newPoint();
  colorRepeat.push(255,0,0);
  var geometry = new THREE.BufferGeometry();
  geometry.addAttribute( 'position', new THREE.Float32BufferAttribute(pointPos, 3 ) );
  geometry.addAttribute( 'color', new THREE.Float32BufferAttribute(colorRepeat, 3 ) );
  var points = new THREE.Points(geometry,material);
  scene.add(points);
  //if(t>1000){
  //  clearInterval(inter);
  //}
}, 10);


//////////////////////////////////////////////////////////////////////////////////
//    render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////

// render the scene
onRenderFcts.push(_ => renderer.render(scene, camera));

// run the rendering loop
let lastTimeMsec = null;
let animate;
(animate = nowMsec => {
  requestAnimationFrame(animate);

  // measure time
  lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
  let deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
  lastTimeMsec = nowMsec;

  // call each update function
  onRenderFcts.forEach(onRenderFct => onRenderFct(deltaMsec/1000, nowMsec/1000));
})();
