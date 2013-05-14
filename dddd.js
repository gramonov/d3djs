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
 *  Static helper functions.
 */

// data generator

DDDD.generateData = function ( seriesSize, columnSize, columnStart, maxValue ) {

  data = { series: [], columns: [], values: [] };

  seriesSize = typeof seriesSize !== 'undefined' ? seriesSize : 10;
  columnSize = typeof columnSize !== 'undefined' ? columnSize : 0;
  columnStart = typeof columnStart !== 'undefined' ? columnStart : 2000;
  maxValue = typeof maxValue !== 'undefined' ? maxValue : 150;

  for ( var i = 0; i < seriesSize; i++ ) {

    data.series.push( "Series" + i );
    if ( columnSize != 0 ) data.values.push( [] );
  
  }

  for ( var j = 0; j < columnSize; j++ ) {

    data.columns.push( columnStart + j );

  }

  if ( columnSize != 0 ) { 
    for ( var i = 0; i < seriesSize; i++ ) {
      for (var j = 0; j < columnSize; j++ ) {

        data.values[i].push( Math.random() * maxValue );  

      }
    }
  } else {
    for ( var i = 0; i < seriesSize; i++ ) {
    
    data.values.push( Math.random() * maxValue );
    
    }
  }

  return data;

};

/**
 *  three.js custom helper methods.
 */

THREE.Object3D.prototype.clear = function () {

  var children = this.children;
  
  for ( var i = 0; i < children.length; i++ ) {
    
    var child = children[i];
    child.clear();
    this.removeChild(child);

  };

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
  this.plot = new THREE.Object3D();
  this.renderer = new THREE.WebGLRenderer( { antialias: true } );
  this.controls = new THREE.TrackballControls( this.camera );
  this.projector = new THREE.Projector();
  this.raycaster = new THREE.Raycaster();
  this.mouse = new THREE.Vector2();
  this.tooltipCanvas = document.createElement( 'canvas' );

  this.prepareScene();

  return this;

};

DDDD.Engine.prototype = {

  constructor: DDDD.Engine,

  prepareScene: function () {

    // add plot to the scene

    this.scene.add( this.plot );

    // setup renderer

    document.body.appendChild( this.container );
    this.container.innerWidth = window.innerWidth;
    this.container.innerHeight = window.innerHeight;

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

    this.renderer.setSize( this.container.innerWidth, this.container.innerHeight );
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
    this.tooltipContext.font = "Bold 14px Helvetica";
    this.tooltipContext.fillStyle = "rgba(0,0,0,0.95)";
    
    this.tooltipTexture = new THREE.Texture( this.tooltipCanvas ) 
    this.tooltipTexture.needsUpdate = true;
    
    this.tooltipMaterial = new THREE.SpriteMaterial({

      map: this.tooltipTexture,

      useScreenCoordinates: true,

      alignment: THREE.SpriteAlignment.topLeft

    });
    
    this.tooltipSprite = new THREE.Sprite( this.tooltipMaterial );
    this.tooltipSprite.position.set( 50, 50, 0 );
    this.tooltipSprite.scale.set( 300, 150, 1.0 );
    console.log(this.tooltipSprite);

    this.scene.add( this.tooltipSprite );

  },

  initScene: function () {

    init();
    animate();

  },

  clearScene: function () {

    this.scene.clear();

  },

  addToPlot: function () {
    for (var i = 0; i < arguments.length; i++) {
      this.plot.add( arguments[i] );
    }
  },

  addToScene: function () {
    for (var i = 0; i < arguments.length; i++) {
      this.scene.add( arguments[i] ); 
    }
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
  update();

};

function render () {

  _ENGINE.renderer.render( _ENGINE.scene, _ENGINE.camera );

}

function update() {
  var vector = new THREE.Vector3( _ENGINE.mouse.x, _ENGINE.mouse.y, 1 );
  _ENGINE.projector.unprojectVector( vector, _ENGINE.camera );

  _ENGINE.raycaster.set( _ENGINE.camera.position, vector.sub( _ENGINE.camera.position ).normalize() );
  var intersects = _ENGINE.raycaster.intersectObjects( _ENGINE.plot.children );

  if ( intersects.length > 0 ) {

    if ( _ENGINE.intersected != intersects[0].object ) {

      if ( _ENGINE.intersected ) _ENGINE.intersected.material.color.setHex( _ENGINE.intersected.currentHex );
      _ENGINE.intersected = intersects[0].object;
      _ENGINE.intersected.currentHex = _ENGINE.intersected.material.color.getHex();
      _ENGINE.intersected.material.color.setHex( 0xeeeeee );
      
      _ENGINE.tooltipContext.clearRect( 0, 0, 640, 480 );
      var message = _ENGINE.intersected.tooltipMessage;
      var metrics = _ENGINE.tooltipContext.measureText( message );
      var width = metrics.width;

      _ENGINE.tooltipContext.fillStyle = "rgba(255,255,255,0.95)";
      _ENGINE.tooltipContext.fillRect( 0, 0, width + 8, 20 + 8);
      _ENGINE.tooltipContext.fillStyle = "rgba(0,0,0,0.95)";
      _ENGINE.tooltipContext.fillRect( 2, 2, width + 4, 20 + 4 );
      _ENGINE.tooltipContext.fillStyle = "rgba(255,255,255,1)";
      _ENGINE.tooltipContext.fillText( message, 4, 20 );
      _ENGINE.tooltipTexture.needsUpdate = true;
    }

  } else {

      if ( _ENGINE.intersected ) _ENGINE.intersected.material.color.setHex( _ENGINE.intersected.currentHex );

      _ENGINE.intersected = null;

      _ENGINE.tooltipContext.clearRect( 0, 0, 300, 300 );
      _ENGINE.tooltipTexture.needsUpdate = true;
  }
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
 *  Global private engine.
 */

var _ENGINE = new DDDD.Engine();

/** 
 *  Plot class.
 *  Defines the superclass of all possible plots.
 */

DDDD.Plot = function ( data, options ) {

  _ENGINE.initScene();

  this.BASE_WIDTH = 3.0;
  this.BASE_MULTIPLIER = 2.5;

  this.SPACING = {

    series: this.BASE_WIDTH * this.BASE_MULTIPLIER * 1.25,
    
    columns: this.BASE_WIDTH * this.BASE_MULTIPLIER * 1.25
  
  };

  this.AXES = {

    X: { len: 50 },
    
    Y: { len: 50 },
    
    Z: { len: 50 }
  
  };

  this.OFFSET = { X: 30, Y: 10 };

  this.COLORS = this.createColorPalette( data.series.length )

  optionalArgs = ( typeof options === 'undefined' ) ? { canvasId: "plotarea" } : options;

  for ( var param in optionalArgs ) {
    
    this[ param ] = optionalArgs[ param ];
  
  }

  this.data = data;

  this.drawLabels();
  this.drawHelpers();

  this.loadData( data );

  return this;

};

DDDD.Plot.prototype = {

  constructor: DDDD.Plot,

  drawLabels: function () {

    for (var i = 0; i < this.data.series.length; i++) {

      var material = new THREE.MeshBasicMaterial( { color: this.COLORS[i], shading: THREE.FlatShading, transparent: true, opacity: 0.9 } );
      var text = new THREE.TextGeometry(
          this.data.series[i], 
          { size: 5, height: 0.1, curveSegments: 6, font: "helvetiker", weight: "normal", style: "normal" } 
      );

      var textLabelMesh = new THREE.Mesh( text, material );
      textLabelMesh.position.x += this.SPACING.series * (i + 1) + 2;
      textLabelMesh.position.y -= this.OFFSET.X;
      textLabelMesh.rotation.x = 0 * Math.PI / 180;
      textLabelMesh.rotation.y = 0 * Math.PI / 180;
      textLabelMesh.rotation.z = 90 * Math.PI / 180;

      _ENGINE.addToScene( textLabelMesh );

      var line = new THREE.Geometry();
      
      line.vertices.push( new THREE.Vector3( this.SPACING.series * (i + 1) + this.SPACING.series / 2, -35, 0 ) );
      line.vertices.push( new THREE.Vector3( this.SPACING.series * (i + 1) + this.SPACING.series / 2, 75, 0 ) );
      var grid_material = new THREE.LineBasicMaterial( { color: 0xeeeeee, transparent: true, opacity: 0.2 } );
      
      _ENGINE.addToScene( new THREE.Line( line, grid_material ) );
    }

    for (var i = 0; i < this.data.columns.length; i++) {
      var material = new THREE.MeshBasicMaterial( { color: 0xeeeeee, shading: THREE.FlatShading, transparent: true, opacity: 0.9 } );
      var text = new THREE.TextGeometry(
          this.data.columns[i], 
          { size: 5, height: 0.1, curveSegments: 6, font: "helvetiker", weight: "normal", style: "normal" } 
      );

      var textLabelMesh = new THREE.Mesh( text, material );
      textLabelMesh.position.y += this.SPACING.columns * (i + 1) + 2;
      textLabelMesh.position.x -= this.OFFSET.Y;
      textLabelMesh.rotation.x = 0 * Math.PI / 180;
      textLabelMesh.rotation.y = 0 * Math.PI / 180;
      textLabelMesh.rotation.z = 180 * Math.PI / 180;
      
      _ENGINE.addToScene( textLabelMesh );
  
      var line = new THREE.Geometry();
      
      line.vertices.push( new THREE.Vector3( -35, this.SPACING.columns * (i + 1) + this.SPACING.columns / 2, 0 ) );
      line.vertices.push( new THREE.Vector3( 75, this.SPACING.columns * (i + 1) + this.SPACING.columns / 2, 0 ) );
      var grid_material = new THREE.LineBasicMaterial( { color: 0xeeeeee, transparent: true, opacity: 0.2 } );

      _ENGINE.addToScene( new THREE.Line( line, grid_material ) );
    }

  },

  drawHelpers: function () {
    // todo
    return null;
  },

  createColorPalette: function ( size ) {

    var colors = [];

    for ( var i = 0; i < size; i++ ) {

      colors.push( Math.random() * 0xFFFFFF << 0 );
    
    }

    return colors;

  }

};

/** 
 *  Bar chart class.
 *  Defines all the methods associated with construction and handling
 *  of the bar charts.
 *  @inherits DDDD.Plot
 */

DDDD.BarChart = function (data, options) {

  DDDD.Plot.call( this, data, options );

}

DDDD.BarChart.prototype = Object.create( DDDD.Plot.prototype );

DDDD.BarChart.prototype.loadData = function (data) {

  //_ENGINE.clearScene();

  var maxDataValue = Math.max.apply(Math, [].concat.apply([], data.values));

  for (var i = 0; i < data.values.length; i++) {
    for (var j = 0; j < data.values[i].length; j++) {

      var bar_solid_material = new THREE.MeshBasicMaterial( { color: this.COLORS[i], shading: THREE.FlatShading, transparent: true, opacity: 0.8 } );
      var bar_foundation_material = new THREE.MeshBasicMaterial( { color: this.COLORS[i], shading: THREE.FlatShading, transparent: true, opacity: 0.5, wireframe: false } );
      var bar_wireframe_material = new THREE.MeshBasicMaterial( { color: 0xffffff, shading: THREE.FlatShading, wireframe: true, transparent: true } );

      var val = data.values[i][j] * this.AXES.Z.len / maxDataValue;

      var bar_solid = new THREE.Mesh ( 
          new THREE.CubeGeometry( this.BASE_WIDTH, this.BASE_WIDTH, val ), 
          bar_solid_material
      );

      bar_solid.datum = { series: i, column: j };

      var bar_wireframe = new THREE.Mesh (
          new THREE.CubeGeometry( this.BASE_WIDTH, this.BASE_WIDTH, val ), 
          bar_wireframe_material
      );

      var bar_foundation = new THREE.Mesh (
          new THREE.CubeGeometry( this.BASE_WIDTH * this.BASE_MULTIPLIER, this.BASE_WIDTH * this.BASE_MULTIPLIER, -0.5 ),
          bar_foundation_material
      );
      
      bar_solid.position.x = this.SPACING.series * (i + 1);
      bar_solid.position.y = this.SPACING.columns * (j + 1);
      bar_solid.position.z = val / 2;

      bar_wireframe.position.x = this.SPACING.series * (i + 1);
      bar_wireframe.position.y = this.SPACING.columns * (j + 1);
      bar_wireframe.position.z = val / 2;

      bar_foundation.position.x = this.SPACING.series * (i + 1);
      bar_foundation.position.y = this.SPACING.columns * (j + 1);

      bar_solid.tooltipMessage = "Value : " + Math.floor(data.values[i][j] * 100) / 100;

      _ENGINE.addToPlot( bar_solid );
      _ENGINE.addToScene( bar_wireframe, bar_foundation )

    }
  }
  
};

/** 
 *  Pie chart class.
 *  Defines all the methods associated with construction and handling
 *  of the pie charts.
 *  @inherits DDDD.Plot
 */

DDDD.PieChart = function (data, options) {

  this.piePieces = [];
  this.piece = 0;

  DDDD.Plot.call( this, data, options );

}

DDDD.PieChart.prototype = Object.create( DDDD.Plot.prototype );

// private methods

DDDD.PieChart.prototype._pieSegment = function ( start, end, thickness, value, color ) {

    var material = new THREE.MeshPhongMaterial( { ambient: 0x808080, color: color, emissive: 0x000000 } );

    var geometry = new THREE.Shape();
    geometry.moveTo(0, 0);
    geometry.arc(0, 0, 40, start, end, false);
    geometry.lineTo(0, 0);

    this.piePieces[this.piece].geo = geometry.extrude( { amount: thickness, bevelEnabled: false, curveSegments: 50, steps: 2 } );
    this.piePieces[this.piece].geo.dynamic = true
    this.piePieces[this.piece].baseColor = material.color.getHex();
    this.piePieces[this.piece].value = value;

    var segment = new THREE.Mesh( this.piePieces[this.piece].geo, material );
    segment.name = this.piePieces[this.piece].name = this.piece;
    
    this.piePieces[this.piece].geo.verticesNeedUpdate = true;
    this.piePieces[this.piece].geo.normalsNeedUpdate = true;
    this.piePieces[this.piece].geo.computeFaceNormals();
    this.piePieces[this.piece].geo.computeBoundingSphere();
    console.log(this.sum);
    segment.datum = { idx: this.piece };
    var val = Math.floor(data.values[this.piece] * 100) / 100;
    segment.tooltipMessage = "Value : " + val + " | " + Math.floor( val / this.sum * 10000 ) / 100 + "%";

    return segment;

};

DDDD.PieChart.prototype._pieGraph = function ( scene, values, thickness ) {

    this.sum = 0;
    
    for (var i = 0; i < values.length; i++) {
        
        this.sum += values[i];

        var material = new THREE.MeshPhongMaterial( { color: this.COLORS[i], shading: THREE.FlatShading, emissive: 0x555555, ambient: 0x333333, transparent: true, opacity: 0.9 } );
        var text = new THREE.TextGeometry(
            data.series[i] + ": " + Math.floor(data.values[i] * 100) / 100, 
            { size: 20, height: 0.1, curveSegments: 6, font: "helvetiker", weight: "normal", style: "normal" } 
        );
        var textLabelMesh = new THREE.Mesh( text, material );
        textLabelMesh.position.y += 20 + i * 30;
        textLabelMesh.position.x -= 60;
        textLabelMesh.rotation.z = Math.PI;
        _ENGINE.addToScene( textLabelMesh );

    }

    var cur = 0;
    
    for (var i = 0; i < values.length; i++) {

        var end = ((2*Math.PI) * values[i]) / this.sum;
        this.piePieces[this.piece] = [];
        _ENGINE.addToPlot( this._pieSegment( cur, cur + end, thickness, values[i], this.COLORS[i] ) );
        cur += end;
        this.piece++;

    }

    return this._pieGraph;

};

DDDD.PieChart.prototype.loadData = function (data) {

  //_ENGINE.clearScene();

  this._pieGraph( this.plot, this.data.values, 20 )
  _ENGINE.addToScene( this.plot );
  
};

DDDD.PieChart.prototype.drawLabels = function () {

  // no additional label helpers for pie chart

  return null;

};

/**

DDDD.prototype = {

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

