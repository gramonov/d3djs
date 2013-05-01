var container;
var camera, scene, renderer;
var plot;
var projector, raycaster, renderer;
var mouse = new THREE.Vector2(), INTERSECTED;
var tooltip_sprite;
var tooltip_canvas, tooltip_context, tooltip_texture;

var FUNCTION = "sqrt(x^(3/2) + y^(3/2))";

var data = { 
    series: [
        "Canada",
        "Sweden",
        "Mexico",
    ],
    columns: [
        "2010",
        "2011",
        "2012",
        "2013",
    ],
    values: [
        [ 15, 20, 25, 30 ],
        [ 20, 32, 68, 82 ],
        [ 50, 15, 55, 72 ]
    ]
};

var COLORS = [
    0xff0000,
    0x00ff00,
    0x0000ff,
    0xffff00,
    0xff00ff,
    0x00ffff
];

var BASE_WIDTH = 3.0;
var BASE_MULTIPLIER = 2.5;

var AXES = {
    X: {
        len: 50
    },
    Y: {
        len: 50
    },
    Z: {
        len: 50
    }
};

var SPACING = {
    series: AXES.X.len / data.series.length,
    columns: AXES.Y.len / data.columns.length
};

var OFFSET = {
    X: 30,
    Y: 10
};

var zFuncText = "c * (x^2 / a^2 - y^2 / b^2)";
var zFunc = Parser.parse(zFuncText).toJSFunction( ['x','y'] );

var a = -2.0, b = -3.0, c = -1.0, d = 1;

var meshFunction;
var segments = 20, 
    xMin = -10, xMax = 10, xRange = xMax - xMin,
    yMin = -10, yMax = 10, yRange = yMax - yMin,
    zMin = -10, zMax = 10, zRange = zMax - zMin;
    
var graphGeometry;
var gridMaterial, wireMaterial, vertexColorMaterial;
var graphMesh;

init();
animate();

function createGraph() {
    xRange = xMax - xMin;
    yRange = yMax - yMin;
    zFunc = Parser.parse(zFuncText).toJSFunction( ['x','y'] );
    meshFunction = function(x, y) 
    {
        x = xRange * x + xMin;
        y = yRange * y + yMin;
        var z = zFunc(x,y);
        if ( isNaN(z) )
            return new THREE.Vector3(0,0,0); // TODO: better fix
        else
            return new THREE.Vector3(x, y, z);
    };
    
    // true => sensible image tile repeat...
    graphGeometry = new THREE.ParametricGeometry( meshFunction, segments, segments, true );
    console.log(graphGeometry);
    
    ///////////////////////////////////////////////
    // calculate vertex colors based on Z values //
    ///////////////////////////////////////////////
    graphGeometry.computeBoundingBox();
    zMin = graphGeometry.boundingBox.min.z;
    zMax = graphGeometry.boundingBox.max.z;
    zRange = zMax - zMin;
    var color, point, face, numberOfSides, vertexIndex;
    // faces are indexed using characters
    var faceIndices = [ 'a', 'b', 'c', 'd' ];
    // first, assign colors to vertices as desired
    for ( var i = 0; i < graphGeometry.vertices.length; i++ ) 
    {
        point = graphGeometry.vertices[ i ];
        color = new THREE.Color( 0x0000ff );
        color.setHSL( 0.7 * (zMax - point.z) / zRange, 1, 0.5 );
        graphGeometry.colors[i] = color; // use this array for convenience
    }
    // copy the colors as necessary to the face's vertexColors array.
    for ( var i = 0; i < graphGeometry.faces.length; i++ ) 
    {
        face = graphGeometry.faces[ i ];
        numberOfSides = ( face instanceof THREE.Face3 ) ? 3 : 4;
        for( var j = 0; j < numberOfSides; j++ ) 
        {
            vertexIndex = face[ faceIndices[ j ] ];
            face.vertexColors[ j ] = graphGeometry.colors[ vertexIndex ];
        }
    }
    ///////////////////////
    // end vertex colors //
    ///////////////////////
    
    // material choices: vertexColorMaterial, wireMaterial , normMaterial , shadeMaterial
    
    if (graphMesh) 
    {
        scene.remove( graphMesh );
        // renderer.deallocateObject( graphMesh );
    }

    wireMaterial.map.repeat.set( segments, segments );
    
    graphMesh = new THREE.Mesh( graphGeometry, wireMaterial );
    graphMesh.doubleSided = true;
    scene.add(graphMesh);
}

function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    
    camera.up = new THREE.Vector3( 0, 0, 1 );
    camera.position.set( 25, 25, 30 );

    controls = new THREE.TrackballControls( camera );
    
    controls.rotateSpeed = 1.5;
    controls.zoomSpeed = 0.4;
    controls.panSpeed = 1.0;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.keys = [ 65, 83, 68 ];

    controls.addEventListener( 'change', render );

    group = new THREE.Object3D();
    
    var x_axis = new THREE.Geometry();
    x_axis.vertices.push(new THREE.Vector3(0, 0, 0));
    x_axis.vertices.push(new THREE.Vector3(100, 0, 0));

    var y_axis = new THREE.Geometry();
    y_axis.vertices.push(new THREE.Vector3(0, 0, 0));
    y_axis.vertices.push(new THREE.Vector3(0, 100, 0));

    var z_axis = new THREE.Geometry();
    z_axis.vertices.push(new THREE.Vector3(0, 0, 0));
    z_axis.vertices.push(new THREE.Vector3(0, 0, 100));

    var white_line_material = new THREE.LineBasicMaterial( { color: 0xffffff } );

    //group.add(new THREE.Line(x_axis, white_line_material));
    //group.add(new THREE.Line(y_axis, white_line_material));
    //group.add(new THREE.Line(z_axis, white_line_material));

    //group.rotation.x = -90 * Math.PI / 180;
    //group.rotation.y = 0 * Math.PI / 180;
    //group.rotation.z = 180 * Math.PI / 180;

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x000000, 1 );
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMapWidth = 1024;
    renderer.shadowMapHeight = 1024;
    renderer.shadowCameraFov = 35;
    
    // LIGHT
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0,250,0);
    scene.add(light);
    // SKYBOX/FOG
    // scene.fog = new THREE.FogExp2( 0x888888, 0.00025 );
    
    ////////////
    // CUSTOM //
    ////////////
    
    scene.add( new THREE.AxisHelper() );

    // wireframe for xy-plane
    var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x000088, wireframe: true, side:THREE.DoubleSide } ); 
    var floorGeometry = new THREE.PlaneGeometry(1000,1000,10,10);
    var floor = new THREE.Mesh(floorGeometry, wireframeMaterial);
    floor.position.z = -0.01;
    
    //scene.add(floor);
    
    var normMaterial = new THREE.MeshNormalMaterial;
    var shadeMaterial = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
    
    // "wireframe texture"
    var wireTexture = new THREE.ImageUtils.loadTexture( 'images/square.png' );
    wireTexture.wrapS = wireTexture.wrapT = THREE.RepeatWrapping; 
    wireTexture.repeat.set( 40, 40 );
    wireMaterial = new THREE.MeshBasicMaterial( { map: wireTexture, vertexColors: THREE.VertexColors, side:THREE.DoubleSide } );

    var vertexColorMaterial  = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

    createGraph();

    document.body.appendChild( renderer.domElement ); 

    window.addEventListener( 'resize', onWindowResize, false );

    projector = new THREE.Projector();
    raycaster = new THREE.Raycaster();
    
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    console.log(plot);

    tooltip_canvas = document.createElement('canvas');
    tooltip_context = tooltip_canvas.getContext('2d');
    tooltip_context.font = "Bold 13px Arial";
    tooltip_context.fillStyle = "rgba(0,0,0,0.95)";
    
    // canvas contents will be used for a texture
    tooltip_texture = new THREE.Texture(tooltip_canvas) 
    tooltip_texture.needsUpdate = true;
    
    var spriteMaterial = new THREE.SpriteMaterial( { map: tooltip_texture, useScreenCoordinates: true, alignment: THREE.SpriteAlignment.topLeft } );
    
    tooltip_sprite = new THREE.Sprite( spriteMaterial );
    tooltip_sprite.scale.set( 300, 150, 1.0 );
    tooltip_sprite.position.set( 50, 50, 0 );
    scene.add( tooltip_sprite );   
}

function render() {
    camera.lookAt( scene.position );

    renderer.render( scene, camera );
}

function animate() {
    requestAnimationFrame( animate );
    controls.update();

    render();
    update();
}

function update() {
    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    projector.unprojectVector( vector, camera );

    raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
    var intersects = raycaster.intersectObjects( scene.children );

    if ( intersects.length > 0 ) {


        if ( INTERSECTED != intersects[0].object ) {

            if ( INTERSECTED ) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

            tooltip_context.clearRect( 0, 0, 640, 480 );
            var message = "F(x,y) = " + zFuncText;
            var metrics = tooltip_context.measureText( message );
            var width = metrics.width;
            tooltip_context.fillStyle = "rgba(255,255,255,0.95)"; // black border
            tooltip_context.fillRect( 0, 0, width + 8, 20 + 8);
            tooltip_context.fillStyle = "rgba(0,0,0,0.95)"; // white filler
            tooltip_context.fillRect( 2, 2, width + 4, 20 + 4 );
            tooltip_context.fillStyle = "rgba(255,255,255,1)"; // text color
            tooltip_context.fillText( message, 4, 20 );
            tooltip_texture.needsUpdate = true;
        }

    } else {

        if ( INTERSECTED ) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

        INTERSECTED = null;

        tooltip_context.clearRect( 0, 0, 300, 300 );
        tooltip_texture.needsUpdate = true;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    controls.handleResize();

    render();
}

function onDocumentMouseMove( event ) {
    event.preventDefault();

    tooltip_sprite.position.set( event.clientX, event.clientY, 0 );

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}