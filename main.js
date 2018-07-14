let vrDisplay,
    vrFrameData,
    vrControls,
    arView;

let canvas,
    camera,
    scene,
    renderer,
    cube,
    cubes = [];

let anchorManager;

let CUBE_SIZE_IN_METERS = .18;

let colors = [
  new THREE.Color(0xffffff),
  new THREE.Color(0xffff00),
  new THREE.Color(0xff00ff),
  new THREE.Color(0xff0000),
  new THREE.Color(0x00ffff),
  new THREE.Color(0x00ff00),
  new THREE.Color(0x0000ff),
  new THREE.Color(0x000000)
];

THREE.getARDisplay().then(display => {
  if(display) {
    vrFrameData = new VRFrameData();
    vrDisplay = display;
    init();
  } else {
    THREE.ARUtils.displayUnsupportedMessage();
  }
});

let init = () => {
  // turn on debugging
  let arDebug = new THREE.ARDebug(vrDisplay);
  document.body.append(arDebug.getElement());

  // set up the three.js rendering environment
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  
  canvas = renderer.domElement;
  document.body.appendChild(canvas);
  scene = new THREE.Scene();

  // create ARView, which handles renderering of camera scene behind three.js context
  arView = new THREE.ARView(vrDisplay, renderer);

  // ARPerspectiveCamera a little different THREE
  camera = new THREE.ARPerspectiveCamera(
    vrDisplay, 60, window.innerWidth / window.innerHeight,
    vrDisplay.depthNear, vrDisplay.depthFar);

  // keep real and virtual world in sync
  vrControls = new THREE.VRControls(camera);

  // cube geometry to copy when user clicks on the screen
  let geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
  let faceIndeces = ['a', 'b', 'c'];
  geometry.faces.forEach(face => {
    faceIndeces.forEach((faceIndex, index) => {
      let vertexIndex = face[faceIndex];
      face.vertexColors[index] = colors[vertexIndex];
    })
  });
  let material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
  cube = new THREE.Mesh(geometry, material);

  // bind event listeners
  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('touchstart', onClick, false);

  anchorManager = new THREE.ARAnchorManager(vrDisplay);
  
  // begin render loop
  update();
};

// render loop
let update = () => {
  renderer.clearColor();
  arView.render();
  camera.updateProjectionMatrix();
  vrDisplay.getFrameData(vrFrameData);
  vrControls.update();
  renderer.clearDepth();
  renderer.render(scene, camera);
  requestAnimationFrame(update);
};

// on window resize
let onWindowResize = e => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

// when clicking, create cube at user's current position
let onClick = e => {
  // if touched with two+ fingers, remove latest models and and its anchor
  if(cubes.length > 0 && e.touches.length > 1) {
    anchorManager.remove(cubes[0]);
    scene.remove(cubes[0]);
    cubes.splice(0, 1);
    return;
  }

  // fetch pose data from current frame
  let pose = vrFrameData.pose;

  // convert pose orientation and position into objects
  let ori = new THREE.Quaternion(
    pose.orientation[0],
    pose.orientation[1],
    pose.orientation[2],
    pose.orientation[3]
  );
  let pos = new THREE.Vector3(
    pose.position[0],
    pose.position[1],
    pose.position[2]
  );
  let dirMtx = new THREE.Matrix4();
  dirMtx.makeRotationFromQuaternion(ori);
  let push = new THREE.Vector3(0, 0, -1.0);
  push.transformDirection(dirMtx);
  pos.addScaledVector(push, 0.125);

  // clone cube object and place at location
  var cubeClone = cube.clone();
  scene.add(cubeClone);
  cubeClone.position.copy(pos);
  cubeClone.quaternion.copy(ori);

  cubes.push(cubeClone);
  anchorManager.add(cubeClone);
  
};
