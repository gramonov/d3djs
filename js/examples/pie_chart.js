var container;
var camera, scene, renderer;
var plot;
var projector, raycaster, renderer;
var mouse = new THREE.Vector2(), INTERSECTED;
var tooltip_sprite;
var tooltip_canvas, tooltip_context, tooltip_texture;
var piePieces = [], piece = 0;

var data = { 
    series: [
        "Canada",
        "Sweden",
        "Mexico",
        "Russia"
    ],
    values: [ 15, 20, 25, 20 ],
};

var COLORS = [
    0xff0000,
    0x00ff00,
    0x0000ff,
    0xffff00,
    0xff00ff,
    0x00ffff
];

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

init();
animate();

function pieSegment(start, end, thickness, value, color) {
    var material = new THREE.MeshPhongMaterial( { ambient: 0x808080, color: color, emissive: 0x000000 } );

    var geometry = new THREE.Shape();
    geometry.moveTo(0, 0);
    geometry.arc(0, 0, 40, start, end, false);
    geometry.lineTo(0, 0);

    piePieces[piece].geo = geometry.extrude( { amount: thickness, bevelEnabled: false, curveSegments: 50, steps: 2 } );
    piePieces[piece].geo.dynamic = true
    piePieces[piece].baseColor = material.color.getHex();
    piePieces[piece].value = value;

    var segment = new THREE.Mesh( piePieces[piece].geo, material );
    segment.name = piePieces[piece].name = piece;
    //segment.rotation.x = Math.PI / 2;
    console.log(segment);
    piePieces[piece].geo.verticesNeedUpdate = true;
    piePieces[piece].geo.normalsNeedUpdate = true;
    piePieces[piece].geo.computeFaceNormals();
    piePieces[piece].geo.computeBoundingSphere();

    //segment.rotation.y = Math.PI / 2;
    segment.datum = { idx: piece };

    return segment;
}

function pieGraph(scene, values, thickness) {
    var sum = 0;
    
    for (var i = 0; i < values.length; i++) {
        
        sum += values[i];

        var material = new THREE.MeshPhongMaterial( { color: COLORS[i], shading: THREE.FlatShading, emissive: 0x555555, ambient: 0x333333, transparent: true, opacity: 0.9 } );
        var text = new THREE.TextGeometry(
            data.series[i] + ": " + data.values[i], 
            { size: 20, height: 0.1, curveSegments: 6, font: "helvetiker", weight: "normal", style: "normal" } 
        );
        var textLabelMesh = new THREE.Mesh( text, material );
        textLabelMesh.position.y += 20 + i * 30;
        textLabelMesh.position.x -= 60;
        textLabelMesh.rotation.z = Math.PI;
        scene.add(textLabelMesh);

    }

    var cur = 0;
    
    for (var i = 0; i < values.length; i++) {

        var end = ((2*Math.PI) * values[i]) / sum;
        piePieces[piece] = [];
        scene.add( pieSegment( cur, cur + end, thickness, values[i], COLORS[i] ) );
        cur += end;
        piece++;

    }

    return pieGraph;
}

function loadData() {
    plot = new THREE.Object3D();
    pieGraph(plot, data.values, 20)
    scene.add(plot);
}

ne.add( tooltip_sprite );   
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
            var message = "Series: " + data.series[INTERSECTED.datum.idx] + ", " + "Value: " +
                data.values[INTERSECTED.datum.idx];
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