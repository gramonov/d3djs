var container;
var camera, scene, renderer;
var plot;
var projector, raycaster, renderer;
var mouse = new THREE.Vector2(), INTERSECTED;
var tooltip_sprite;
var tooltip_canvas, tooltip_context, tooltip_texture;

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

var POS_X = 1800;
var POS_Y = 500;
var POS_Z = 1800;

init();
animate();


function addEarth() {
    var spGeo = new THREE.SphereGeometry(100,50,50);
    var planetTexture = THREE.ImageUtils.loadTexture( "images/earth2.jpg" );
    var mat2 =  new THREE.MeshPhongMaterial( {
        map: planetTexture,
        shininess: 0.2 } );
    sp = new THREE.Mesh(spGeo,mat2);
    scene.add(sp);
}

function addLights() {
    light = new THREE.DirectionalLight(0x3333ee, 3.5, 500 );
    scene.add( light );
    light.position.set(POS_X,POS_Y,POS_Z);
}

function latLongToVector3(lat, lon, radius, heigth) {
    var phi = (lat)*Math.PI/180;
    var theta = (lon-180)*Math.PI/180;

    var x = -(radius+heigth) * Math.cos(phi) * Math.cos(theta);
    var y = (radius+heigth) * Math.sin(phi);
    var z = (radius+heigth) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x,y,z);
}

function addDensity ( data ) {
    
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

        var cubeMat = new THREE.MeshPhongMaterial( { color: color, emissive: 0x222222 } );
        var position = this._latLongToVector3( data[i].lat, data[i].lng, 50, 2 );

        // create the cube
        var cube = new THREE.Mesh(new THREE.CubeGeometry(0.5,0.5,110), cubeMat);

        cube.datum = data[i];
        // position the cube correctly
        cube.position = position;
        cube.lookAt( new THREE.Vector3( 0, 0, 0 ) );
        plot.add(cube);
    }
    // and add the total mesh to the scene
    scene.add(plot);
}

function loadData() {
    plot = new THREE.Object3D();

}

function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    
    camera.up = new THREE.Vector3( 0, 0, 1 );
    camera.position.set( 150, 150, 200 );

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

    loadData();
    scene.add(group);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x000000, 1 );
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMapWidth = 1024;
    renderer.shadowMapHeight = 1024;
    renderer.shadowCameraFov = 35;
    
    addEarth();
    addLights();
    addDensity(data_source);

    document.body.appendChild( renderer.domElement ); 

    window.addEventListener( 'resize', onWindowResize, false );

    projector = new THREE.Projector();
    raycaster = new THREE.Raycaster();
    
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    console.log(plot);

    tooltip_canvas = document.createElement('canvas');
    console.log(tooltip_canvas);
    tooltip_context = tooltip_canvas.getContext('2d');
    tooltip_context.font = "Bold 11px Arial";
    tooltip_context.fillStyle = "rgba(0,0,0,0.95)";
    
    // canvas contents will be used for a texture
    tooltip_texture = new THREE.Texture(tooltip_canvas) 
    tooltip_texture.needsUpdate = true;
    
    var spriteMaterial = new THREE.SpriteMaterial( { map: tooltip_texture, useScreenCoordinates: true, alignment: THREE.SpriteAlignment.topLeft } );
    
    tooltip_sprite = new THREE.Sprite( spriteMaterial );
    tooltip_sprite.scale.set( 400, 200, 1.0 );
    tooltip_sprite.position.set( 50, 50, 0 );
    scene.add( tooltip_sprite );   
    console.log(scene);
}

function render() {
    camera.lookAt( scene.position );
    light.position = camera.position;
    light.lookAt(scene.position);
    renderer.render( scene, camera );
    requestAnimationFrame( render );
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
    var intersects = raycaster.intersectObjects( plot.children );

    if ( intersects.length > 0 ) {


        if ( INTERSECTED != intersects[0].object ) {

            if ( INTERSECTED ) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

            INTERSECTED = intersects[0].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex( 0x666666 );

            tooltip_context.clearRect( 0, 0, 640, 480 );
            var message = "Date: " + INTERSECTED.datum.date + ", " +
                "Disease: " + INTERSECTED.datum.keyword
            console.log(INTERSECTED.datum);
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