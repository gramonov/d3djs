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

// point generator

DDDD.generatePoints = function ( size, clusterNum, maxValue ) {

  data = [];

  size = typeof size !== 'undefined' ? size : 10;
  clusterNum = typeof clusterNum !== 'undefined' ? clusterNum : 3;
  maxValue = typeof maxValue !== 'undefined' ? maxValue : 150;

  for ( var i = 0; i < clusterNum; i++ ) {

    data.push( [] );

  }

  for ( var i = 0; i < clusterNum; i++ ) {
    for ( var j = 0; j < size; j++ ) {
      
      var point = [];

      for ( var k = 0; k < 3; k++ ) {

        point.push( Math.random() * maxValue );    
      
      }

      data[i].push( point );
      
    }
  }

  return data;

};

// generate geodata from twitter

DDDD.generateGeodata = function ( size ) {

  var data = [];

  var DISEASE_MAP = [
    "Anthrax",
    "Varicella",
    "Common Cold",
    "Gastroenteritis",
    "Std",
    "Malaria",
    "Tuberculosis",
    "Mumps",
    "Measles",
    "Dengue"
  ];

  for ( var i = 0; i < size; i++ ) {

    size = typeof size !== 'undefined' ? size : 50;
    var lat = (Math.random() * 360 - 180).toFixed(3) * 1
    var lng = (Math.random() * 360 - 180).toFixed(3) * 1
    var disease = DISEASE_MAP[Math.floor(Math.random() * 9)];

    data.push( { name: "testname", text: "tweet text is here", keyword: disease, lat: lat, lng: lng } );

  }

  return data;

}

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

  this.COLORS = this.createColorPalette( data )

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

  createColorPalette: function ( data ) {

    var colors = [];

    var size = 'series' in data ? data.series.length : data.length; 

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

DDDD.BarChart = function ( data, options  ) {

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

DDDD.PieChart = function ( data, options ) {

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
 *  Scatterplot class.
 *  Defines all the methods associated with construction and handling
 *  of the scatterplot.
 *  @inherits DDDD.Plot
 */

DDDD.Scatterplot = function (data, options) {

  DDDD.Plot.call( this, data, options );

}

DDDD.Scatterplot.prototype = Object.create( DDDD.Plot.prototype );

DDDD.Scatterplot.prototype.loadData = function (data) {

  //_ENGINE.clearScene();

  var maxDataValue = Math.max.apply( Math, [].concat.apply( [], data ) );

  for (var i = 0; i < data.length; i++) {
      var material = new THREE.MeshPhongMaterial( { color: this.COLORS[i], shading: THREE.FlatShading, emissive: 0x555555, ambient: 0x333333, transparent: true, opacity: 0.9 } );
      var text = new THREE.TextGeometry(
          "Series " + i, 
          { size: 16, height: 0.1, curveSegments: 6, font: "helvetiker", weight: "normal", style: "normal" } 
      );
      var textLabelMesh = new THREE.Mesh( text, material );
      textLabelMesh.position.y += 20 + i * 30;
      textLabelMesh.position.x -= 60;
      textLabelMesh.rotation.z = Math.PI;
      _ENGINE.addToScene( textLabelMesh );
  }

  for ( var i = 0; i < data.length; i++ ) {        
      for ( var j = 0; j < data[i].length; j++ ) {

          var mat = new THREE.MeshBasicMaterial( { color: this.COLORS[i], transparent: true, opacity: 0.85 } );
          
          var dot = new THREE.Mesh (
              new THREE.SphereGeometry( 1.5, 32, 32 ), 
              mat
          );

          dot.datum = { x: data[i][j][0], y: data[i][j][1], z: data[i][j][2] };

          dot.position.x = data[i][j][0];
          dot.position.y = data[i][j][1];
          dot.position.z = data[i][j][2];

          dot.tooltipMessage = "(" + dot.position.x.toFixed(3) + ", " + dot.position.y.toFixed(3) + ", " + dot.position.z.toFixed(3) + ")";

          _ENGINE.addToPlot( dot );

      }
  }
};

DDDD.Scatterplot.prototype.drawLabels = function () {

  var grid_material = new THREE.LineBasicMaterial( { color: 0xeeeeee, transparent: true, opacity: 0.2 } );
  var gridLines = new THREE.Object3D();
  var gridSize = 10;

  for (var i = 0; i <= 150; i += gridSize) {

      var line = new THREE.Geometry();
      line.vertices.push( new THREE.Vector3( i, 0, 0 ) );
      line.vertices.push( new THREE.Vector3( i, 150, 0 ) );
      gridLines.add( new THREE.Line( line, grid_material ) );

      line = new THREE.Geometry();
      line.vertices.push( new THREE.Vector3( 0, i, 0 ) );
      line.vertices.push( new THREE.Vector3( 150, i, 0 ) );
      gridLines.add( new THREE.Line(line, grid_material ) );
  
  }

  _ENGINE.addToScene( gridLines );

};

/** 
 *  Geo chart class.
 *  Defines all the methods associated with construction and handling
 *  of the geo charts.
 *  @inherits DDDD.Plot
 */

DDDD.GeoChart = function (data, options) {

  DDDD.Plot.call( this, data, options );

}

DDDD.GeoChart.prototype = Object.create( DDDD.Plot.prototype );

DDDD.GeoChart.prototype.loadData = function (data) {

  this._setupEarth();
  this._addDensity( data );
  
};


DDDD.GeoChart.prototype._setupEarth = function () {

    var spGeo = new THREE.SphereGeometry( 100, 50, 50);
    var planetTexture = THREE.ImageUtils.loadTexture( "images/earth2.jpg" );
    var mat2 =  new THREE.MeshPhongMaterial( {
        map: planetTexture,
        shininess: 0.2 
    });
    
    sp = new THREE.Mesh( spGeo,mat2 );
    _ENGINE.addToScene( sp );

    light = new THREE.DirectionalLight( 0x3333ee, 3.5, 500 );
    _ENGINE.addToScene( light );
    light.position.set( 1800, 500, 1800 );

    light = new THREE.DirectionalLight( 0x3333ee, 3.5, 500 );
    _ENGINE.addToScene( light );
    light.position.set( -1800, 500, -1800 );

    light = new THREE.DirectionalLight( 0x3333ee, 3.5, 500 );
    _ENGINE.addToScene( light );
    light.position.set( -1800, 500, 1800 );

    ight = new THREE.DirectionalLight( 0x3333ee, 3.5, 500 );
    _ENGINE.addToScene( light );
    light.position.set( 1800, 500, -1800 );

};

DDDD.GeoChart.prototype._addDensity = function ( data ) {
    
    var geom = new THREE.Geometry();
    
    for ( var i = 0 ; i < data.length ; i++ ) {
    
        var color = 0x000000;
        switch ( data[i].keyword ) {

            case "Anthrax" : color = 0x00ff00; break;
            case "Varicella" : color = 0xffff00; break;
            case "Common Cold" : color = 0x0000ff; break;
            case "Gastroenteritis" : color = 0xff00ff; break;
            case "Std" : color = 0xff0000; break;
            case "Malaria" : color = 0x00ffff; break;
            case "Tuberculosis" : color = 0xf0f00; break;
            case "Mumps" : color = 0xf00f0; break;
            case "Measles" : color = 0xf0f0f0; break;
            case "Dengue" : color = 0x0f0f0f; break;
            default: break;
        
        }

        var cubeMat = new THREE.MeshBasicMaterial( { color: color, shading: THREE.FlatShading, transparent: true, opacity: 0.90 } );
        var position = this._latLongToVector3( data[i].lat, data[i].lng, 50, 2 );

        var cube = new THREE.Mesh(
        
          new THREE.CubeGeometry( 0.5, 0.5, 120 ), 
          cubeMat
        
        );

        cube.datum = data[i];
        cube.position = position;
        cube.lookAt( new THREE.Vector3( 0, 0, 0 ) );
        _ENGINE.addToPlot( cube );
    
    }
};

DDDD.GeoChart.prototype._latLongToVector3 = function ( lat, lon, radius, heigth ) {
    var phi = lat * Math.PI / 180;
    var theta = (lon - 180) * Math.PI / 180;

    var x = -(radius + heigth) * Math.cos(phi) * Math.cos(theta);
    var y = (radius + heigth) * Math.sin(phi);
    var z = (radius + heigth) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3( x, y, z );
}

DDDD.GeoChart.prototype.drawLabels = function () {

  // no additional label helpers for geo chart

  return null;

};

/** 
 *  KNN class.
 *  Defines all the methods associated with construction and handling
 *  of the k-nearest neighbors classifier.
 *  @inherits DDDD.Plot
 */

DDDD.KNN = function (data, options) {

  var options = typeof options !== "undefined" ? options : {};
  this.neighborhoodSize = "neighborhoodSize"  in options ? options.neighborhoodSize : 10;
  this.clusterNum = data.length;
  this.size = data[0].length;
  this.K = "K" in options ? options.K : 5;

  DDDD.Plot.call( this, data, options );

}

DDDD.KNN.prototype = Object.create( DDDD.Plot.prototype );

DDDD.KNN.prototype.loadData = function (data) {

  //_ENGINE.clearScene();

  var maxDataValue = Math.max.apply( Math, [].concat.apply( [], data ) );

  for (var i = 0; i < data.length; i++) {
      var material = new THREE.MeshPhongMaterial( { color: this.COLORS[i], shading: THREE.FlatShading, emissive: 0x555555, ambient: 0x333333, transparent: true, opacity: 0.9 } );
      var text = new THREE.TextGeometry(
          "Series " + i, 
          { size: 16, height: 0.1, curveSegments: 6, font: "helvetiker", weight: "normal", style: "normal" } 
      );
      var textLabelMesh = new THREE.Mesh( text, material );
      textLabelMesh.position.y += 20 + i * 30;
      textLabelMesh.position.x -= 60;
      textLabelMesh.rotation.z = Math.PI;
      _ENGINE.addToScene( textLabelMesh );
  }

  for ( var i = 0; i < data.length; i++ ) {        
      for ( var j = 0; j < data[i].length; j++ ) {

          var mat = new THREE.MeshBasicMaterial( { color: this.COLORS[i], transparent: true, opacity: 0.85 } );
          
          var dot = new THREE.Mesh (
              new THREE.SphereGeometry( 1.5, 32, 32 ), 
              mat
          );

          dot.datum = { x: data[i][j][0], y: data[i][j][1], z: data[i][j][2] };

          dot.position.x = data[i][j][0];
          dot.position.y = data[i][j][1];
          dot.position.z = data[i][j][2];

          dot.tooltipMessage = "(" + dot.position.x.toFixed(3) + ", " + dot.position.y.toFixed(3) + ", " + dot.position.z.toFixed(3) + ")";

          _ENGINE.addToPlot( dot );

      }
  }

  for ( var i = 0; i < 150; i += this.neighborhoodSize ) {
    for ( var j = 0; j < 150; j += this.neighborhoodSize ) {
      for ( var k = 0; k < 150; k += this.neighborhoodSize ) {

        dot = { x: i, y: j, z: k };
        var color = this._classify(dot);
        var mat = new THREE.MeshBasicMaterial( { color: this.COLORS[color], transparent: true, opacity: 0.1 } );
        var cubeDim = this.neighborhoodSize * 0.75;
        var region = new THREE.Mesh( new THREE.CubeGeometry( cubeDim, cubeDim, cubeDim ), mat );
        region.position.x = i;
        region.position.y = j;
        region.position.z = k;
        _ENGINE.addToScene( region );

      }
    }
  }

};

DDDD.KNN.prototype.drawLabels = function () {

  var grid_material = new THREE.LineBasicMaterial( { color: 0xeeeeee, transparent: true, opacity: 0.2 } );
  var gridLines = new THREE.Object3D();
  var gridSize = 10;

  for (var i = 0; i <= 150; i += gridSize) {

      var line = new THREE.Geometry();
      line.vertices.push( new THREE.Vector3( i, 0, 0 ) );
      line.vertices.push( new THREE.Vector3( i, 150, 0 ) );
      gridLines.add( new THREE.Line( line, grid_material ) );

      line = new THREE.Geometry();
      line.vertices.push( new THREE.Vector3( 0, i, 0 ) );
      line.vertices.push( new THREE.Vector3( 150, i, 0 ) );
      gridLines.add( new THREE.Line(line, grid_material ) );
  
  }

  _ENGINE.addToScene( gridLines );

};

DDDD.KNN.prototype._dist = function ( dot, train ) {

    return Math.sqrt(
        (dot.x - train[0])*(dot.x - train[0]) +
        (dot.y - train[1])*(dot.y - train[1]) +
        (dot.z - train[2])*(dot.z - train[2])
    );

}

DDDD.KNN.prototype._classify = function ( dot ) {
    
    var distances = [];
    
    for ( var i = 0; i < this.size; i++ ) {
      for ( var j = 0; j < this.clusterNum; j++ ) {

        distances.push( { d: this._dist( dot, data[j][i] ), cl: j } );
      
      }
    }

    distances.sort( function ( a, b ) {

        k1 = a.d; k2 = b.d;
        return (k1 > k2) ? 1 : ( (k2 > k1) ? -1 : 0 );

    });

    counts = [];

    for ( var i = 0; i < this.size; i++ ) {

      counts.push( 0 );

    }


    for (var i = 0; i < this.K; i++) {

        counts[ distances[i].cl ] += 1;
    
    }

    return counts.indexOf( Math.max.apply( Math, counts ) );

}



/** 
 *  Function plotter class.
 *  Defines all the methods associated with construction and handling
 *  of the function plots.
 *  @inherits DDDD.Plot
 */

DDDD.FunctionPlotter = function (data, options) {

  this.func = data.func;
  DDDD.Plot.call( this, data, options );

}

DDDD.FunctionPlotter.prototype = Object.create( DDDD.Plot.prototype );

DDDD.FunctionPlotter.prototype.loadData = function (data) {

  this._createGraph ()
  
};

DDDD.FunctionPlotter.prototype._createGraph = function () {

  _ENGINE.addToScene( new THREE.AxisHelper() );

  var wireTexture = new THREE.ImageUtils.loadTexture( 'images/square.png' );
  wireTexture.wrapS = wireTexture.wrapT = THREE.RepeatWrapping; 
  wireTexture.repeat.set( 40, 40 );
  var wireMaterial = new THREE.MeshBasicMaterial( { map: wireTexture, vertexColors: THREE.VertexColors, side:THREE.DoubleSide } );

  var vertexColorMaterial  = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

  var segments = 20, 
      xMin = -10, xMax = 10, xRange = xMax - xMin,
      yMin = -10, yMax = 10, yRange = yMax - yMin,
      zMin = -10, zMax = 10, zRange = zMax - zMin;

  xRange = xMax - xMin;
  yRange = yMax - yMin;
  zFunc = Parser.parse( this.func ).toJSFunction( ['x','y'] );
  
  var meshFunction = function ( x, y ) {
      
      x = xRange * x + xMin;
      y = yRange * y + yMin;
      var z = zFunc( x, y );
      if ( isNaN(z) ) {

        return new THREE.Vector3( 0, 0, 0 );
      
      } else {
      
        return new THREE.Vector3( x, y, z );
      
      }
  };
  
  graphGeometry = new THREE.ParametricGeometry( meshFunction, segments, segments, true );
  graphGeometry.computeBoundingBox();
  
  zMin = graphGeometry.boundingBox.min.z;
  zMax = graphGeometry.boundingBox.max.z;
  zRange = zMax - zMin;
  var color, point, face, numberOfSides, vertexIndex;
  
  var faceIndices = [ 'a', 'b', 'c', 'd' ];
  
  for ( var i = 0; i < graphGeometry.vertices.length; i++ ) {
      
    point = graphGeometry.vertices[ i ];
    color = new THREE.Color( 0x0000ff );
    color.setHSL( 0.7 * (zMax - point.z) / zRange, 1, 0.5 );
    graphGeometry.colors[i] = color; // use this array for convenience

  }
  
  for ( var i = 0; i < graphGeometry.faces.length; i++ ) {
  
    face = graphGeometry.faces[ i ];
    numberOfSides = ( face instanceof THREE.Face3 ) ? 3 : 4;
    
    for ( var j = 0; j < numberOfSides; j++ ) {

        vertexIndex = face[ faceIndices[ j ] ];
        face.vertexColors[ j ] = graphGeometry.colors[ vertexIndex ];
    
    }
  
  }
  
  wireMaterial.map.repeat.set( segments, segments );
  
  graphMesh = new THREE.Mesh( graphGeometry, wireMaterial );
  graphMesh.doubleSided = true;
  graphMesh.tooltipMessage = "F(x, y) = " + this.func;
  _ENGINE.addToPlot( graphMesh );
};

DDDD.FunctionPlotter.prototype.drawLabels = function () {

  // no additional label helpers for geo chart

  return null;

};
