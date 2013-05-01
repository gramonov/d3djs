var container;
var camera, scene, renderer;
var plot;
var projector, raycaster, renderer;
var mouse = new THREE.Vector2(), INTERSECTED;
var tooltip_sprite;
var tooltip_canvas, tooltip_context, tooltip_texture;

var data = [
    [],
    [],
    []
];

var SIZE = 15;
var MAX = 75;

for (var i = 0; i < 3; i++) {
    for (var j = 0; j < SIZE; j++) {
        data[0].push( [ Math.random() * 25, Math.random() * 25, Math.random() * MAX ] );
        data[1].push( [ Math.random() * 25 + 25, Math.random() * MAX, Math.random() * 25 + 25 ] );
        data[2].push( [ Math.random() * MAX, Math.random() * 25 + 25, Math.random() * MAX ] );
    }
}

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

var COLORS = [
    0xff0000,
    0x00ff00,
    0x0000ff,
    0xffff00,
    0xff00ff,
    0x00ffff
];

var OFFSET = {
    X: 30,
    Y: 10
};

var K = 5;

init();
animate();

function dist(dot1, train) {
    return Math.sqrt(
        (dot1.x - train[0])*(dot1.x - train[0]) +
        (dot1.y - train[1])*(dot1.y - train[1]) +
        (dot1.z - train[2])*(dot1.z - train[2])
    );
}

function classify(dot) {
    distances = [];
    for (var i = 0; i < SIZE; i++) {
        distances.push( { d: dist( dot, data[0][i] ), cl: 0 } );
        distances.push( { d: dist( dot, data[1][i] ), cl: 1 } );
        distances.push( { d: dist( dot, data[2][i] ), cl: 2 } );
    }

    distances.sort(function(a,b) {
        k1 = a.d; k2 = b.d;
        return (k1 > k2) ? 1 : ( (k2 > k1) ? -1 : 0 );
    });

    counts = [ 0, 0, 0 ];

    for (var i = 0; i < K; i++) {
        counts[ distances[i].cl ] += 1;
    }

    return counts.indexOf(Math.max.apply(Math, counts));
}

function loadData() {
    plot = new THREE.Object3D();

    var max_data_value = Math.max.apply(Math, [].concat.apply([], data.values));

    for (var i = 0; i < data.length; i++) {
        var material = new THREE.MeshPhongMaterial( { color: COLORS[i + 2], shading: THREE.FlatShading, emissive: 0x555555, ambient: 0x333333, transparent: true, opacity: 0.9 } );
        var text = new THREE.TextGeometry(
            "Series " + i, 
            { size: 16, height: 0.1, curveSegments: 6, font: "helvetiker", weight: "normal", style: "normal" } 
        );
        var textLabelMesh = new THREE.Mesh( text, material );
        textLabelMesh.position.y += 20 + i * 30;
        textLabelMesh.position.x -= 60;
        textLabelMesh.rotation.z = Math.PI;
        scene.add(textLabelMesh);
    }

    for (var i = 0; i < data.length; i++) {        
        for (var j = 0; j < data[i].length; j++) {
            var mat = [
                new THREE.MeshPhongMaterial( { color: COLORS[i + 2], transparent: true, opacity: 0.85 } ),
                new THREE.MeshPhongMaterial( { color: COLORS[i + 2], transparent: true, opacity: 0.85 } ),
                new THREE.MeshPhongMaterial( { color: COLORS[i + 2], transparent: true, opacity: 0.85 } )
            ];

            var dot = new THREE.Mesh ( 
                new THREE.SphereGeometry( 1, 32, 32 ), 
                mat[i]
            );

            dot.datum = { x: data[i][j][0], y: data[i][j][1], z: data[i][j][2] };

            dot.position.x = data[i][j][0];
            dot.position.y = data[i][j][1];
            dot.position.z = data[i][j][2];

            plot.add(dot);
        }
    }

    for (var i = 0; i < 75; i+=4) {
        for (var j = 0; j < 75; j+=4) {
            for (var k = 0; k < 75; k+=4) {
                dot = { x: i, y: j, z: k };
                var color = classify(dot);
                var mat = new THREE.MeshBasicMaterial( { color: COLORS[color + 2], transparent: true, opacity: 0.1 } );
                var region = new THREE.Mesh( new THREE.CubeGeometry( 3, 3, 3 ), mat );
                region.position.x = i;
                region.position.y = j;
                region.position.z = k;
                scene.add(region);
            }
        }
    }

    scene.add(plot);
}


function drawGrid(gridSize) {
    var grid_material = new THREE.LineBasicMaterial( { color: 0xeeeeee, transparent: true, opacity: 0.2 } );
    var gridLines = new THREE.Object3D();   

    for (var i = 0; i <= 75; i += gridSize) {

        var line = new THREE.Geometry();
        line.vertices.push(new THREE.Vector3(i, 0, 0));
        line.vertices.push(new THREE.Vector3(i, 75, 0));
        gridLines.add(new THREE.Line(line, grid_material));

        line = new THREE.Geometry();
        line.vertices.push(new THREE.Vector3(0, i, 0));
        line.vertices.push(new THREE.Vector3(75, i, 0));
        gridLines.add(new THREE.Line(line, grid_material));
/**
        line = new THREE.Geometry();
        line.vertices.push(new THREE.Vector3(0, 0, i));
        line.vertices.push(new THREE.Vector3(0, 100, i));
        gridLines.add(new THREE.Line(line, grid_material));

        line = new THREE.Geometry();
        line.vertices.push(new THREE.Vector3(0, i, 0));
        line.vertices.push(new THREE.Vector3(0, i, 100));
        gridLines.add(new THREE.Line(line, grid_material));

        line = new THREE.Geometry();
        line.vertices.push(new THREE.Vector3(i, 0, 0));
        line.vertices.push(new THREE.Vector3(i, 0, 100));
        gridLines.add(new THREE.Line(line, grid_material));

        line = new THREE.Geometry();
        line.vertices.push(new THREE.Vector3(0, 0, i));
        line.vertices.push(new THREE.Vector3(100, 0, i));
        gridLines.add(new THREE.Line(line, grid_material));
*/
        gridLines.add(new THREE.Line(line, grid_material));
    }

    group.add(gridLines);
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

    //group.add(new THREE.Line(x_axis, white_line_material));
    //group.add(new THREE.Line(y_axis, white_line_material));
    //group.add(new THREE.Line(z_axis, white_line_material));

    //group.rotation.x = -90 * Math.PI / 180;
    //group.rotation.y = 0 * Math.PI / 180;
    //group.rotation.z = 180 * Math.PI / 180;

    drawGrid(5);
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
    
    light = new THREE.SpotLight();
    light.castShadow = true;
    light.position.set(170, 300, 100);
    scene.add(light);

    ambientLight = new THREE.PointLight(0x123456);
    ambientLight.position.set(20, 150, 120);
    scene.add(ambientLight);

    ambientLight = new THREE.PointLight(0x123456);
    ambientLight.position.set(-20, -150, 120);
    scene.add(ambientLight);

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
    var intersects = raycaster.intersectObjects( plot.children );

    if ( intersects.length > 0 ) {


        if ( INTERSECTED != intersects[0].object ) {

            if ( INTERSECTED ) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

            INTERSECTED = intersects[0].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex( 0x666666 );

            tooltip_context.clearRect( 0, 0, 640, 480 );
            var message = "(" + INTERSECTED.datum.x.toFixed(3) + ", " + INTERSECTED.datum.y.toFixed(3) + ", " + INTERSECTED.datum.z.toFixed(3) + " )";
            console.log(message);
            var metrics = tooltip_context.measureText( message );
            console.log(metrics);
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