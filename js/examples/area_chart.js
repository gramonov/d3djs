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

init();
animate();

function loadData() {
    plot = new THREE.Object3D();

    for (var i = 0; i < data.series.length; i++) {
        var material = new THREE.MeshBasicMaterial( { color: COLORS[i], shading: THREE.FlatShading, transparent: true, opacity: 0.9 } );
        var text = new THREE.TextGeometry(
            data.series[i], 
            { size: 5, height: 0.1, curveSegments: 6, font: "helvetiker", weight: "normal", style: "normal" } 
        );
        var textLabelMesh = new THREE.Mesh( text, material );
        textLabelMesh.position.x += SPACING.series * (i + 1);
        textLabelMesh.position.y -= OFFSET.X;
        textLabelMesh.rotation.x = 0 * Math.PI / 180;
        textLabelMesh.rotation.y = 0 * Math.PI / 180;
        textLabelMesh.rotation.z = 90 * Math.PI / 180;

        group.add(textLabelMesh);

        var line = new THREE.Geometry();
        
        line.vertices.push( new THREE.Vector3( SPACING.series * (i + 1) + SPACING.series / 2, -35, 0 ) );
        line.vertices.push( new THREE.Vector3( SPACING.series * (i + 1) + SPACING.series / 2, 75, 0 ) );
        var grid_material = new THREE.LineBasicMaterial( { color: 0xeeeeee, transparent: true, opacity: 0.2 } );
        
        group.add(new THREE.Line(line, grid_material));
    }

    for (var i = 0; i < data.columns.length; i++) {
        var material = new THREE.MeshBasicMaterial( { color: 0xeeeeee, shading: THREE.FlatShading, transparent: true, opacity: 0.9 } );
        var text = new THREE.TextGeometry(
            data.columns[i], 
            { size: 5, height: 0.1, curveSegments: 6, font: "helvetiker", weight: "normal", style: "normal" } 
        );
        var textLabelMesh = new THREE.Mesh( text, material );
        textLabelMesh.position.y += SPACING.columns * (i + 1);
        textLabelMesh.position.x -= OFFSET.Y;
        textLabelMesh.rotation.x = 0 * Math.PI / 180;
        textLabelMesh.rotation.y = 0 * Math.PI / 180;
        textLabelMesh.rotation.z = 180 * Math.PI / 180;
        
        group.add(textLabelMesh);
    
        var line = new THREE.Geometry();
        
        line.vertices.push( new THREE.Vector3( -35, SPACING.columns * (i + 1) + SPACING.columns / 2, 0 ) );
        line.vertices.push( new THREE.Vector3( 75, SPACING.columns * (i + 1) + SPACING.columns / 2, 0 ) );
        var grid_material = new THREE.LineBasicMaterial( { color: 0xeeeeee, transparent: true, opacity: 0.2 } );

        group.add(new THREE.Line(line, grid_material));
    }

    var max_data_value = Math.max.apply(Math, [].concat.apply([], data.values));

    var extrusionSettings = {
        size: 1, height: 1, curveSegments: 6,
        bevelThickness: 0.5, bevelSize: 2, bevelEnabled: false,
        material: 0, extrudeMaterial: 1
    };

    for (var i = 0; i < data.values.length; i++) {
        var bar_solid_material = new THREE.MeshPhongMaterial( { color: COLORS[i], transparent: true, opacity: 0.85 } );
        var bar_foundation_material = new THREE.MeshBasicMaterial( { color: COLORS[i], shading: THREE.FlatShading, transparent: true, opacity: 0.5, wireframe: false } );
        var bar_wireframe_material = new THREE.MeshBasicMaterial( { color: 0xffffff, shading: THREE.FlatShading, wireframe: true, transparent: true } );

        var areaPoints = [ new THREE.Vector2( 0, 0), new THREE.Vector2( 0, 25), new THREE.Vector2( 23, 1), new THREE.Vector2( 27, 0)  ];

        for (var j = 0; j < data.values[i].length; j++) {
            var val = data.values[i][j] * AXES.Z.len / max_data_value;

            var bar_solid = new THREE.Mesh ( 
                new THREE.CubeGeometry( BASE_WIDTH, BASE_WIDTH, val ), 
                bar_solid_material
            );

            bar_solid.datum = { series: i, column: j };

            var bar_wireframe = new THREE.Mesh (
                new THREE.CubeGeometry( BASE_WIDTH, BASE_WIDTH, val ), 
                bar_wireframe_material
            );

            var bar_foundation = new THREE.Mesh (
                new THREE.CubeGeometry( BASE_WIDTH * BASE_MULTIPLIER, BASE_WIDTH * BASE_MULTIPLIER, -0.5 ),
                bar_foundation_material
            );
            
            //areaPoints.push( new THREE.Vector2( SPACING.series * (j + 1), val ) );
            //areaPoints.push( new THREE.Vector2( SPACING.series * (j + 1) + 1, val ) );

            bar_wireframe.position.x = SPACING.series * (i + 1);
            bar_wireframe.position.y = SPACING.columns * (j + 1);
            bar_wireframe.position.z = val / 2;

            bar_foundation.position.x = SPACING.series * (i + 1);
            bar_foundation.position.y = SPACING.columns * (j + 1);
            
            //scene.add(bar_wireframe);
            scene.add(bar_foundation);
        }

        //areaPoints.push( new THREE.Vector2( SPACING.series * (data.values[i].length + 1), val ) );
        var areaShape = new THREE.Shape( areaPoints );
        var areaGeometry = new THREE.ExtrudeGeometry( areaShape, extrusionSettings );
        var areaPlot = new THREE.Mesh( areaGeometry, bar_solid_material );
        plot.add(areaPlot);
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

    drawGrid(100);
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
            var message = "Series: " + data.series[INTERSECTED.datum.series] + " " +
                "Column: " + data.columns[INTERSECTED.datum.column] + " " +
                "Value : " + data.values[INTERSECTED.datum.series][INTERSECTED.datum.column];
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