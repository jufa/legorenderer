import * as THREE from 'three'
import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';

let container, progressBarDiv;

let camera, scene, renderer, controls, gui, guiData;

let model, textureCube;

let envMapActivated = false;

const ldrawPath = './';

const modelFileList = {
  'EXX': './models/E-XX.ldr',
  'car': './models/car.ldr',
};

init();
animate();


function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 150, 200, 250 );

  // scene

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xdeebed );

  const ambientLight = new THREE.AmbientLight( 0xdeebed, 0.4 );
  scene.add( ambientLight );

  const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
  directionalLight.position.set( - 1000, 1200, 1500 );
  scene.add( directionalLight );

  //

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  controls = new OrbitControls( camera, renderer.domElement );

  //

  guiData = {
    modelFileName: modelFileList[ 'EXX' ],
    envMapActivated: false,
    separateObjects: false,
    displayLines: false,
    conditionalLines: false,
    smoothNormals: true,
    constructionStep: 0,
    noConstructionSteps: "No steps."
  };

  window.addEventListener( 'resize', onWindowResize );

  progressBarDiv = document.createElement( 'div' );
  progressBarDiv.innerText = "Loading...";
  progressBarDiv.style.fontSize = "3em";
  progressBarDiv.style.color = "#888";
  progressBarDiv.style.display = "block";
  progressBarDiv.style.position = "absolute";
  progressBarDiv.style.top = "50%";
  progressBarDiv.style.width = "100%";
  progressBarDiv.style.textAlign = "center";


  // load materials and then the model

  reloadObject( true );

}

function updateObjectsVisibility() {

  model.traverse( c => {

    if ( c.isLineSegments ) {

      if ( c.isConditionalLine ) {

        c.visible = guiData.conditionalLines;

      } else {

        c.visible = guiData.displayLines;

      }

    } else if ( c.isGroup ) {

      // Hide objects with construction step > gui setting
      c.visible = c.userData.constructionStep <= guiData.constructionStep;

    }

  } );

}

function reloadObject( resetCamera ) {

  if ( model ) {

    scene.remove( model );

  }

  model = null;

  updateProgressBar( 0 );
  showProgressBar();

  const lDrawLoader = new LDrawLoader();
  lDrawLoader.separateObjects = guiData.separateObjects;
  lDrawLoader.smoothNormals = guiData.smoothNormals;
  lDrawLoader
    .setPath( ldrawPath )
    .load( guiData.modelFileName, function ( group2 ) {

      if ( model ) {

        scene.remove( model );

      }

      model = group2;

      // Convert from LDraw coordinates: rotate 180 degrees around OX
      model.rotation.x = Math.PI;

      scene.add( model );

      // Adjust materials

      const materials = lDrawLoader.materials;

      if ( envMapActivated ) {

        if ( ! textureCube ) {

          // Envmap texture
          const r = "textures/cube/Bridge2/";
          const urls = [ r + "posx.jpg", r + "negx.jpg",
            r + "posy.jpg", r + "negy.jpg",
            r + "posz.jpg", r + "negz.jpg" ];
          textureCube = new THREE.CubeTextureLoader().load( urls );
          textureCube.mapping = THREE.CubeReflectionMapping;

        }

        for ( let i = 0, n = materials.length; i < n; i ++ ) {

          const material = materials[ i ];

          if ( material.userData.canHaveEnvMap ) {

            material.envMap = textureCube;

          }

        }

      }

      guiData.constructionStep = model.userData.numConstructionSteps - 1;

      updateObjectsVisibility();

      // Adjust camera and light

      const bbox = new THREE.Box3().setFromObject( model );
      const size = bbox.getSize( new THREE.Vector3() );
      const radius = Math.max( size.x, Math.max( size.y, size.z ) ) * 0.5;

      if ( resetCamera ) {

        controls.target0.copy( bbox.getCenter( new THREE.Vector3() ) );
        controls.position0.set( - 2.3, 2, 2 ).multiplyScalar( radius ).add( controls.target0 );
        controls.reset();

      }

      createGUI();

      hideProgressBar();

    }, onProgress, onError );

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function createGUI() {

  if ( gui ) {

    gui.destroy();

  }

  gui = new GUI();

  gui.add( guiData, 'modelFileName', modelFileList ).name( 'Model' ).onFinishChange( function () {

    reloadObject( true );

  } );

  gui.add( guiData, 'separateObjects' ).name( 'Separate Objects' ).onChange( function () {

    reloadObject( false );

  } );

  if ( guiData.separateObjects ) {

    if ( model.userData.numConstructionSteps > 1 ) {

      gui.add( guiData, 'constructionStep', 0, model.userData.numConstructionSteps - 1 ).step( 1 ).name( 'Construction step' ).onChange( updateObjectsVisibility );

    } else {

      gui.add( guiData, 'noConstructionSteps' ).name( 'Construction step' ).onChange( updateObjectsVisibility );

    }

  }

  gui.add( guiData, 'envMapActivated' ).name( 'Env. map' ).onChange( function changeEnvMap( value ) {

    envMapActivated = value;
    reloadObject( false );

  } );

  gui.add( guiData, 'smoothNormals' ).name( 'Smooth Normals' ).onChange( function changeNormals() {

    reloadObject( false );

  } );

  gui.add( guiData, 'displayLines' ).name( 'Display Lines' ).onChange( updateObjectsVisibility );
  gui.add( guiData, 'conditionalLines' ).name( 'Conditional Lines' ).onChange( updateObjectsVisibility );

}

//

function animate() {

  requestAnimationFrame( animate );
  render();

}

function render() {

  renderer.render( scene, camera );

}

function onProgress( xhr ) {

  if ( xhr.lengthComputable ) {

    updateProgressBar( xhr.loaded / xhr.total );

    console.log( Math.round( xhr.loaded / xhr.total * 100, 2 ) + '% downloaded' );

  }

}

function onError() {

  const message = "Error loading model";
  progressBarDiv.innerText = message;
  console.log( message );

}

function showProgressBar() {

  document.body.appendChild( progressBarDiv );

}

function hideProgressBar() {

  document.body.removeChild( progressBarDiv );

}

function updateProgressBar( fraction ) {

  progressBarDiv.innerText = 'Loading... ' + Math.round( fraction * 100, 2 ) + '%';

}


