import * as THREE from 'three'
import { Material, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader.js';

let container, controls;
let camera, scene, renderer, plane, plane2, tick, raycaster, mouse, meshes, currentIntersect, highlightMaterial, storedMaterial, directionalLight3;
let E755, EXX;
let clickPending = false;
let tweeningObjects;
let touchesUsed = false;
let freezeCamera = false;
let freezToggle;
const speed = 0.05;
const spread = 200;
const spreadById = 1.5;
const legoShine = 0.5;
init();
animate();

function handleFreezeToggle(e){
  e.preventDefault();
  freezeCamera = !freezeCamera;
  freezToggle.innerHTML = freezeCamera ? 'Unfreeze Camera' : 'Freeze Camera';
  controls.enabled = !freezeCamera;
}

function onMouseMove( event ) {
  if(touchesUsed) {
    return; //do not use clicks then, we got touch
  }
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  clickPending = true;
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onTouchMove( event ) {
  // console.log('touchMove');
  touchesUsed = true;
  const touches = event.changedTouches || event.touches;
  if(touches.length){
    clickPending = true;
    const touch = touches[0];
    mouse.x = ( touch.pageX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( touch.pageY / window.innerHeight ) * 2 + 1;
  }
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
}

function onTouchStart( event ) {
  // console.log('touchStart',event);
  touchesUsed = true;
  const touches = event.changedTouches || event.touches;
  if(touches.length){
    clickPending = true;
    const touch = touches[0];
    mouse.x = ( touch.pageX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( touch.pageY / window.innerHeight ) * 2 + 1;
  }
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
}

function onTouchEnd( event ) {
  event.preventDefault();
  console.log('touchend');
}

function onClick( event ) {
  // console.log('click', event);
  if(touchesUsed) {
    return; //do not use clicks then, we got touch
  }
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  clickPending = true;
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function init() {
  freezToggle = document.querySelector('#freeze-toggle');
  freezToggle.addEventListener('click', handleFreezeToggle, false);
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  meshes = [];
  tweeningObjects = {};
  currentIntersect = null;
  highlightMaterial = new THREE.MeshPhongMaterial( {
    color: 0x000000,
    emissive: 0xff00ff,
    emissiveIntensity: 1.0,
    flatShading: false,
    side: THREE.DoubleSide,
    opacity: 0.5,
    transparent: true,
    blending: THREE.NormalBlending,
  } );

  tick = 0;

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  container.addEventListener( 'mousemove', onMouseMove, false );
  container.addEventListener( 'touchmove', onTouchMove, false );
  container.addEventListener( 'touchstart', onTouchStart, false );
  container.addEventListener( 'touchend', onTouchEnd, false );
  container.addEventListener( 'click', onClick, false );

  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10000 );
  camera.position.z = 10;

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x001920 );
  const color = 0x000000; // white
  const near = 1000;
  const far = 11000;
  scene.fog = new THREE.Fog(color, near, far);

  const ambientLight = new THREE.AmbientLight( 0xffffff, 0.4 );
  scene.add( ambientLight );

  const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.3 );
  directionalLight.position.set( - 2000, 400, 1000 );
  directionalLight.castShadow = false;
  scene.add( directionalLight );

  const directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.3 );
  directionalLight2.position.set( 2000, 200, 1000 );
  directionalLight2.castShadow = false;
  scene.add( directionalLight2 );

  directionalLight3 = new THREE.PointLight( 0xffffff, 0.4 );
  directionalLight3.position.set( 0, 2000, 0 );
  directionalLight3.castShadow = false;
  scene.add( directionalLight3 );

  const gridTextureLoader = new THREE.TextureLoader();
  gridTextureLoader.load('gridtexture2.png', (tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set( 20, 20 );
    
    const geometry = new THREE.PlaneGeometry(10000, 10000, 10, 10 );
    const material = new THREE.MeshPhongMaterial( {
      map: tex,
      emissiveMap: tex,
      emissive: 0x555555,
      specularMap: tex,
      specular: 60,
      specular: 0xffffff,
      color: 0xffffff,
      transparent: true,
    } );
    const material2 = material.clone();
    material2.emissiveIntensity = 0.4;
    plane = new THREE.Mesh( geometry, material );
    plane2 = plane.clone()
    plane2.material = material2;
    material2.opacity = 0.2;
    plane.rotateX(-Math.PI/2);
    plane2.rotateX(-Math.PI/2);
    scene.add( plane );
    scene.add( plane2 );
    plane.transparent = true;
    plane2.position.set(0, -100, 0);

  });

  const loader = new TDSLoader( );

  // BLUE 

  loader.load( 'E755WHT.3ds', function ( object ) {
      object.traverse( function ( child ) {
          if ( child.isMesh ) {
              child.material = child.material.clone();
              meshes.push(child);
              const id = Number(child.name.split('Piece')[1]);
              child.material.color.set(new Vector3(1.0, 1.0, 1.0));
              child.material.transparent = true;
              child.material.specular.setScalar(legoShine);
              
              const position = new Vector3(Math.random() * spread, Math.random() * spread, id * spreadById  + 0 * Math.random() * spread/2.0);
              child.userData.position = new Vector3(...child.position.toArray());
              // const rotation = Math.random() * 3;
              child.userData.rotationX = child.rotationX;
              child.position.set(...position.toArray());
              // child.rotationX = rotationX;

              if(Math.floor(child.material.color.b * 100) === 88){
                child.material.color.g = 1.0;
              } else if (child.material.opacity < 0.9){
                child.material.color.g = 1.0;
                child.material.color.r = 0.0;
                child.material.emissive.g = 0.15;
                child.material.emissive.b = 0.35;
              }
              child.needsUpdate=true;
              child.needsUpdate;
          };
        }
      );
      scene.add( object );
      object.rotateX(-Math.PI/2.0);
      object.rotateY(0.4);
      const bbox = new THREE.Box3().setFromObject( object );
      const size = bbox.getSize( new THREE.Vector3() );
      const radius = Math.max( size.x, Math.max( size.y, size.z ) ) * 0.13;
      controls.target0.copy( bbox.getCenter( new THREE.Vector3() ) );
      controls.position0.set( -4, 6, -5 ).multiplyScalar( radius ).add( controls.target0 );
      controls.reset();
      object.position.x = -100; // horizontal
      object.position.y = 10;
  } );



  // ORANGE

  
  const loader2 = new TDSLoader( );
  loader2.load( 'E755WHT.3ds', ( object ) => {
      E755 = object;
      object.traverse( function ( child ) {
          if ( child.isMesh ) {
              meshes.push(child);
              child.material = child.material.clone();
              meshes[child.name] = child;
              const id = Number(child.name.split('Piece')[1]);
              child.material.color.set(new Vector3(1.0, 1.0, 1.0));
              child.material.specular.setScalar(legoShine);

              const position = new Vector3(Math.random() * spread, Math.random() * spread, id * spreadById  + Math.random() * spread/2.0);
              child.userData.position = new Vector3(...child.position.toArray());
              child.position.set(...position.toArray());

              if(Math.floor(child.material.color.b * 100) === 88){
                child.material.color.g = 1.0;
              } else if (child.material.opacity < 0.9){
                child.material.color.g = 0.55;
                child.material.color.r = 1.0;
                child.material.color.b = 0.0;
                child.material.emissive.g = 0.15;
                child.material.emissive.r = 0.55;
              }
              child.needsUpdate=true;
              child.material.needsUpdate=true;
          };
        }
      );
      scene.add( object );
      object.rotateX(-Math.PI/2.0); // upside rightside up
      object.rotateZ(0*Math.PI);
      object.rotateY(0.4);
      object.position.y = 50; //vertical
      object.position.x = 100; //horizontal
      object.position.z = 200; // f/b
      object.scale.multiplyScalar(1.0);
  } );

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.outputEncoding = THREE.LinearEncoding
  container.appendChild( renderer.domElement );
  controls = new OrbitControls( camera, renderer.domElement );
  window.addEventListener( 'resize', resize );
}

function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function updateGrid() {
  if(!plane) {
    return;
  } else {
    plane.position.z += 20.0;
    plane2.position.z += 20.0;
    if (plane.position.z > 500.0){
      plane.position.z = 0;
      plane2.position.z = 0;
    }
  }
}

function blowUpAnimation(tick) {
  E755?.traverse( ( child ) => {
    if ( child.isMesh ) {
      const id = Number(child.name.split('Piece')[1]);
      let offset = 1.0 * (tick % 100 - 50);
      child.translateX(-offset * (id % 15 - 3) * 0.14);
    }
  })
}

function pieceAssemblyAnimation() {
  for(let key of Object.keys(tweeningObjects) ) {
    const obj = tweeningObjects[key];
    if (obj) {
      let delta = obj.userData.position.sub(obj.position);
      // let rotDeltaX = obj.userData.rotationX - obj.rotationX;
      delta = delta.multiplyScalar(speed);
      // rotDelta = rotDelta * speed * 1.2;
      const newPos = obj.position.add(delta);
      // const newRot = obj.rotationX + rotDelta;
      obj.position.set( ...newPos.toArray() );
      // obj.rotationX.set(newRot);
      if(obj.position.lengthSq(obj.userData.position) < 0.01) {
        tweeningObjects[key] = null; //done tweening
      }
    }
  }
}

function animate() {
    tick++;
    pieceAssemblyAnimation(tick);
    updateGrid();
    
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera );
    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects( meshes );
    if(intersects.length > 0){
      if (currentIntersect && currentIntersect.object.name != intersects[0].object.name) {
        currentIntersect.object.material = storedMaterial;
      } else if (currentIntersect) {
        currentIntersect.object.material = storedMaterial;
      }
      storedMaterial = intersects[0].object.material;
      intersects[0].object.material = highlightMaterial;
      currentIntersect = intersects[0];
    }

    directionalLight3.position.set( 1000 * Math.cos(tick * 0.03), 1000 * Math.sin(tick * 0.03), -300 );

    if(clickPending) {
      clickPending = false;
      if(currentIntersect) {
        const obj = currentIntersect.object;
        obj.userData.clicked = true;
        tweeningObjects[obj.name] = obj;
      }
    }
    
    // controls.update();
    renderer.render( scene, camera );
    requestAnimationFrame( animate );
}