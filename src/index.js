import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let camera, controls, scene, renderer; 
let cube = [], centers = [], cubeMaterials;
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

const FACES = [L, R, U, D, F, B];

let isDragging = false, isMouseOnCube = false;
let prevMouse = { 
	x: 0,
	y: 0
};
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

let t = 0.0, currentSelection = [], isTurning = false, turnFace, turnDir, turnSpeed = 1/(12.0);

init();
animate();


function init() {
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
	camera.position.z = 40;

	scene = new THREE.Scene();
	
	initMaterials();
	createCubies();

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );	

	document.addEventListener("keydown", onKeyDown, false);
	
	renderer.domElement.onmousedown = handleMouseDown; 
	renderer.domElement.onmouseup   = (e) => { isDragging = false;}
	renderer.domElement.onmousemove = handleMouseMove;
}

function handleMouseDown(event) {
	raycaster.setFromCamera(mouse, camera);

	let intersects = raycaster.intersectObjects(scene.children);
	isMouseOnCube = intersects.length > 0;
	isDragging = !isMouseOnCube;
	if(isMouseOnCube) {
		let norm = intersects[0].face.normal;
		let mat = new THREE.Matrix4();
		mat.extractRotation(intersects[0].object.matrix);
		norm.applyMatrix4(mat);
		console.log(norm);
	}
}

function handleMouseMove(event) {
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

	let deltaMove = { 
		x: event.offsetX - prevMouse.x,
		y: event.offsetY - prevMouse.y	
	};
	
	if (isDragging) {
		let xQuat = new THREE.Quaternion();
		xQuat.setFromAxisAngle(U, toRadians(deltaMove.x));
		let xMat = new THREE.Matrix4();
		xMat.makeRotationFromQuaternion(xQuat);		

		let yQuat = new THREE.Quaternion();
		yQuat.setFromAxisAngle(R, toRadians(deltaMove.y));
		let yMat = new THREE.Matrix4();
		yMat.makeRotationFromQuaternion(yQuat);

		cube.forEach((qb) => {
			qb.applyMatrix4(xMat);
			qb.applyMatrix4(yMat);
		});
	}
	
	prevMouse = {
		x: event.offsetX,
		y: event.offsetY
	}
}


function onKeyDown(event) {
	let keyCode = event.key;
	if(!isTurning) {
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

				let qb = newCubie(x,y,z, materials);
				if(isCenter(offI, offJ, offK)) {
					centers.push(qb);	
				}	
				scene.add(qb);
				cube.push(qb);
			}
		}
	}
}

function setToBlack(materials, side) {
	materials[side].color.setHex(0x000000);
}

function isCenter(i,j,k) {
	return (( i == 0 && j == 0) || (i == 0 && k == 0) || (j == 0 && k == 0)) &&!(i == 0 && j == 0 && k == 0);
}

function newCubie(x,y,z, materials) {
	let cubeGeometry = new THREE.CubeGeometry(cubeSize, cubeSize, cubeSize);
	let qb = new THREE.Mesh(cubeGeometry, materials);	
	qb.position.set(x,y,z);
	return qb;
}

function turn(face, dir) {
	let center = selectCenter(face);
	turnFace = center.position.clone();
	turnFace.normalize();	
	let selection = select(turnFace);
	currentSelection = selection;
	isTurning = true;
	turnDir = dir;
}

function selectCenter(face) {
	let selectCenter;
	let maxDot  = -1000;
	for(let qb of centers) {
		let pos = qb.position.clone();
		pos.normalize();
		let dot = face.dot(pos);
		if(dot > maxDot) {
			selectCenter = qb;
			maxDot = dot;
		}	
	}	
	return selectCenter;
}

function select(face) {
	let selection = [];
	for(let qb of cube) {
		let pos = qb.position.clone();
		pos.normalize();
		let dot = face.dot(pos);	
		if(dot > 0.1) {
			selection.push(qb)
		}
	}
	return selection;	
}

function animate() {
	//controls.update();	
	requestAnimationFrame( animate );
/*	if(isTurning) {
		let quaternion = new THREE.Quaternion();
		quaternion.setFromAxisAngle(turnFace, turnSpeed*turnDir*Math.PI/2);
		let rot = new THREE.Matrix4();
		rot.makeRotationFromQuaternion(quaternion);
		for(let qb of currentSelection) {
			qb.applyMatrix4(rot);
		}
		t += turnSpeed;
	}
	
	if(t >= 1) {
		isTurning = false;
		t = 0;
	}
*/
	renderer.render( scene, camera );

}

function toRadians(deg) {
	return deg * (Math.PI / 180);
}
