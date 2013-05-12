/** 
 *  d3d.js is a library for creating 3d charts, machine learning,
 *  and graph analysis.
 *  @author: Georgy Ramonov
 *  @version: 0.2
 */

/** 
 *  DDDD class provides a primary user endpoint for communications with the library.
 */

var DDDD = DDDD || { REVISION : '2'};

/**
 *  Helper function.
 */

DDDD.prototype = {

  createCanvas: function ( width, height ) {

  }

};

/** 
 *  Engine class.
 *  Defines all the methods associated with construction and handling
 *  of the graphics.
 */

DDDD.Engine = function () {

  this.container = document.createElement( 'div' );
  this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
  this.scene = new THREE.Scene();
  this.renderer = new THREE.WebGLRenderer( { antialias: true } );
  this.controls = new THREE.TrackballControls( this.camera );
  this.plot = new THREE.Object3D();
  projector = new THREE.Projector();
  raycaster = new THREE.Raycaster();
  this.mouse = new THREE.Vector2();
  this.tooltipCanvas = document.createElement( 'canvas' );

  this.prepareScene();

  return this;

};

DDDD.Engine.prototype = {

  constructor: DDDD.Engine,

  prepareScene: function () {

    // setup renderer

    document.body.appendChild( this.container );

    // setup camera

    this.camera.up = new THREE.Vector3( 0, 0, 1 );
    this.camera.position.set( 150, 150, 200 );

    // setup controls
    
    this.controls.rotateSpeed = 1.5;
    this.controls.zoomSpeed = 0.4;
    this.controls.panSpeed = 1.0;

    this.controls.noZoom = false;
    this.controls.noPan = false;

    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;

    this.controls.keys = [ 65, 83, 68 ];

    //this.controls.addEventListener( 'change', this.render );

    // setup renderer

    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor( 0x000000, 1 );
    this.renderer.shadowMapEnabled = true;
    this.renderer.shadowMapSoft = true;
    this.renderer.shadowMapWidth = 1024;
    this.renderer.shadowMapHeight = 1024;
    this.renderer.shadowCameraFov = 35;

    // setup lighting

    light = new THREE.SpotLight();
    light.castShadow = true;
    light.position.set( 170, 300, 100 );
    this.scene.add( light );

    ambientLight = new THREE.PointLight( 0x123456 );
    ambientLight.position.set( 20, 150, 120 );
    this.scene.add( ambientLight );

    ambientLight = new THREE.PointLight( 0x123456 );
    ambientLight.position.set( -20, -150, 120 );
    this.scene.add( ambientLight );

    // setup tooltips

    this.tooltipContext = this.tooltipCanvas.getContext( '2d' );
    this.tooltipContext.font = "Bold 13px Arial";
    this.tooltipContext.fillStyle = "rgba(0,0,0,0.95)";
    
    this.tooltipTexture = new THREE.Texture( this.tooltipCanvas ) 
    this.tooltipTexture.needsUpdate = true;
    
    this.tooltipMaterial = new THREE.SpriteMaterial({

      map: this.tooltipTexture,

      useScreenCoordinates: true,

      alignment: THREE.SpriteAlignment.topLeft

    });
    
    this.tooltipSprite = new THREE.Sprite( this.tooltipMaterial );
    this.tooltipSprite.scale.set( 300, 150, 1.0 );
    this.tooltipSprite.position.set( 50, 50, 0 );

    this.scene.add( this.tooltipSprite );

  },

  initScene: function () {

    init();
    animate();

  }

};

/**
 *  Global render-oriented functions.
 */

function init () {

  document.body.appendChild( _ENGINE.renderer.domElement ); 
  window.addEventListener( 'resize', onWindowResize, false );
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );

};

function animate () {

  requestAnimationFrame( animate );
  _ENGINE.controls.update();
  render();
  //this.update();

};

function render () {

  _ENGINE.renderer.render( _ENGINE.scene, _ENGINE.camera );

}

function onWindowResize () {

  _ENGINE.camera.aspect = window.innerWidth / window.innerHeight;
  _ENGINE.camera.updateProjectionMatrix();

  _ENGINE.renderer.setSize( window.innerWidth, window.innerHeight );

  _ENGINE.controls.handleResize();

  _ENGINE.render();

};

function onDocumentMouseMove ( event ) {

  event.preventDefault();

  _ENGINE.tooltipSprite.position.set( event.clientX, event.clientY, 0 );

  _ENGINE.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  _ENGINE.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

};

/**
 *  Global privateengine.
 */

var _ENGINE = new DDDD.Engine();
_ENGINE.initScene();

/** 
 *  Bar chart class.
 *  Defines all the methods associated with construction and handling
 *  of the bar charts.
 */

DDDD.BarChart = function ( data, options ) {

  optionalArgs = ( typeof options === 'undefined' ) ? { canvasId: "plotarea" } : options;

  for ( var param in optionalArgs ) {
    
    this[ param ] = optionalArgs[ param ];
  
  }

  this.loadData( data );

  return this;

};

DDDD.BarChart.prototype = {

  constructor: DDDD.BarChart,

  loadData: function ( data ) {
    
    this.data = data;
  
  }

};

/**

DDDD.prototype = {
  BarChart = function ( data ) {
    return null;
  },

  PieChart = function ( data ) {
    return null;
  },

  TimeSeriesChart = function ( data ) {
    return null;
  },

  ScatterPlot = function ( data ) {
    return null;
  },

  GeoChart = function ( data ) {
    return null;
  },

  KNN = function ( data ) {
    return null;
  },

  Network = function ( data ) {
    return null;
  },

  FunctionPlotter = function ( data ) {
    return null;
  }
}
*/

