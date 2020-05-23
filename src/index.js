import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let camera, controls, scene, renderer; 
let cube = [], cubeMaterials;
let cubeSize = 3, spacing = 0.25, dimension = 3, increment = cubeSize + spacing;
let colors = [ 
	0xB90000, 0xFF5900, // LEFT RIGHT 
	0xFFFFFF, 0xFFD500, // TOP BOTTOM
	0x009B48, 0x0045AD, // FRONT BACK 
];

const LEFT = 0, RIGHT = 1, TOP = 2, BOTTOM = 3, FRONT = 4, BACK = 5;

const L = new THREE.Vector3(-1,  0,  0),
	  R = new THREE.Vector3( 1,  0,  0),
	  U = new THREE.Vector3( 0,  1,  0),
	  D = new THREE.Vector3( 0, -1,  0),
	  F = new THREE.Vector3( 0,  0,  1),
	  B = new THREE.Vector3( 0,  0, -1);

init();
animate();


function init() {
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
	camera.position.z = 50;

	scene = new THREE.Scene();
	
	initMaterials();
	createCubies();

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	controls = new OrbitControls(camera, renderer.domElement);	
	
	document.addEventListener("keydown", onKeyDown, false);
}

function onKeyDown(event) {
	let keyCode = event.key;
	if(keyCode == 'l') {
		turn(L, 1);
	}
	if(keyCode == 'L') {
		turn(L,-1);
	}
	if(keyCode == 'u') {
		turn(U, 1);
	}
	if(keyCode == 'U') {
		turn(U,-1);
	}
	if(keyCode == 'r') {
		turn(R, 1);
	}
	if(keyCode == 'R') {
		turn(R,-1);
	}
	if(keyCode == 'd') {
		turn(D, 1);
	}
	if(keyCode == 'D') {
		turn(D,-1);
	}
	if(keyCode == 'f') {
		turn(F, 1);
	}
	if(keyCode == 'F') {
		turn(F,-1);
	}
	if(keyCode == 'b') {
		turn(B, 1);
	}
	if(keyCode == 'B') {
		turn(B,-1);
	}

}

function initMaterials() {
	cubeMaterials = colors.map( (c) => new THREE.MeshBasicMaterial({color: c}));
}

function createCubies() {
	const positionOffset = (dimension - 1) / 2;
	for(let i = 0; i < dimension; i++) {
		let offI = (i-positionOffset);
		let x = offI * increment;
		for(let j = 0; j < dimension; j++) {
			let offJ = (j - positionOffset);
			let y = offJ * increment;
			for(let k = 0; k < dimension; k++) {
				let materials = cubeMaterials.map(m => new THREE.MeshBasicMaterial({color: m.color}));
				let offK = (k - positionOffset);
				let z = offK * increment;

				if((offJ > -1)) {
					setToBlack(materials, BOTTOM);
				}
				if((offJ < 1)) {
					setToBlack(materials, TOP);
				}

				if((offK > -1)) {
					setToBlack(materials, BACK);
				}
				if((offK < 1)) {
					setToBlack(materials, FRONT);
				}	

				if((offI > -1)) {
					setToBlack(materials, RIGHT);
				}
				if((offI < 1)) {
					setToBlack(materials, LEFT);
				}

				newCubie(x,y,z, materials);
			}
		}
	}
}

function setToBlack(materials, side) {
	materials[side].color.setHex(0x000000);
}

function newCubie(x,y,z, materials) {
	let cubeGeometry = new THREE.CubeGeometry(cubeSize, cubeSize, cubeSize);
	let qb = new THREE.Mesh(cubeGeometry, materials);	
	qb.position.set(x,y,z);
	scene.add(qb);
	cube.push(qb);
}

function turn(face, dir) {
	let selection = select(face);
	let quaternion = new THREE.Quaternion();
	quaternion.setFromAxisAngle(face, dir*Math.PI/2);
	let rot = new THREE.Matrix4();
	rot.makeRotationFromQuaternion(quaternion);
	for(let qb of selection) {
		qb.applyMatrix4(rot);
	}
}

function select(face) {
	let selection = [];
	for(let qb of cube) {
		let pos = qb.position.clone();
		let dot = face.dot(pos);	
		if(dot > 0.5) {
			selection.push(qb)
		}
	}
	console.log(selection.length);
	return selection;	
}

function animate() {
	controls.update();	
	requestAnimationFrame( animate );
	renderer.render( scene, camera );

}
