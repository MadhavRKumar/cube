import * as THREE from 'three'

let camera, scene, renderer, cubeMaterials; 
const cube = [], centers = [];
const cubeSize = 3, spacing = 0.25, dimension = 3, increment = cubeSize + spacing;
const colors = [ 
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
const ROTATE_FACTOR = 0.15;

let isDragging = false, isMouseOnCube = false, isTurning = false;
const prevMouse = { 
	x: 0,
	y: 0
}, 
deltaMove = {
	x: 0,
	y: 0
};

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let intersected;

let  t = 0.0, turnFace, turnDir, currentSelection;
const turnSpeed = 1/(8.0); 
init();
animate();

/*** INITIALIZATION ***/
function init() {
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
	camera.position.z = 40;

	scene = new THREE.Scene();
	
	initMaterials();
	createCubies();

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );	
	
	renderer.domElement.onmousedown = handleMouseDown; 
	renderer.domElement.onmousemove = handleMouseMove;
	renderer.domElement.onmouseup   = handleMouseUp; 

	renderer.domElement.ontouchstart = handconstouchStart;
	renderer.domElement.ontouchmove = handconstouchMove;
	renderer.domElement.ontouchend = handleMouseUp; 
	
	window.onresize = handleResize;
}

function handleResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleMouseUp(event) {
	if(isMouseOnCube && !isTurning && !isDragging) {
		handleCubeTurn(deltaMove);
	}	
	isDragging = false;
	isMouseOnCube = false;
}

function handconstouchStart(event) {
	event.preventDefault();
	prevMouse.x = event.touches[0].pageX;
	prevMouse.y = event.touches[0].pageY;
	
	
	mouse.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.touches[0].pageY / window.innerHeight) * 2 + 1

	
	handleMouseDown(event.touches[0]);
}

function handleMouseDown(event) {
	raycaster.setFromCamera(mouse, camera);

	const intersects = raycaster.intersectObjects(scene.children);
	isMouseOnCube = intersects.length > 0;
	isDragging = !isMouseOnCube;
	if(isMouseOnCube) {
		intersected = intersects[0];
	}
}

function handconstouchMove(event) { 
	event.preventDefault(); 
	handleMouseMove(event.touches[0]);
}

function handleMouseMove(event) {
	//console.log(event);
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = (event.pageX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.pageY / window.innerHeight) * 2 + 1

	deltaMove.x = event.pageX - prevMouse.x;
	deltaMove.y = event.pageY - prevMouse.y;
	
	if (isDragging && !isTurning) {
		const xMat = makeRotationMatrix(U, deltaMove.x*ROTATE_FACTOR);
		const yMat = makeRotationMatrix(R, deltaMove.y*ROTATE_FACTOR);

		cube.forEach((qb) => {
			qb.applyMatrix4(xMat);
			qb.applyMatrix4(yMat);
		});
	}

	prevMouse.x = event.pageX;
	prevMouse.y =  event.pageY;
}

function makeRotationMatrix(dir, angle, isRadians=false) {
	angle = isRadians ? angle : toRadians(angle);
	const quat = new THREE.Quaternion();
	quat.setFromAxisAngle(dir, angle);
	const mat = new THREE.Matrix4();
	mat.makeRotationFromQuaternion(quat);
	return mat;
}


function initMaterials() {
	cubeMaterials = colors.map( (c) => new THREE.MeshBasicMaterial({color: c}));
}

function createCubies() {
	const positionOffset = (dimension - 1) / 2;
	for(let i = 0; i < dimension; i++) {
		const offI = (i-positionOffset);
		const x = offI * increment;
		for(let j = 0; j < dimension; j++) {
			const offJ = (j - positionOffset);
			const y = offJ * increment;
			for(let k = 0; k < dimension; k++) {
				const materials = cubeMaterials.map(m => new THREE.MeshBasicMaterial({color: m.color}));
				const offK = (k - positionOffset);
				const z = offK * increment;
				setHiddenSidesToBlack(materials, offI, offJ, offK);
				const qb = newCubie(x,y,z, materials);
				if(isCenter(offI, offJ, offK)) {
					centers.push(qb);	
				}	
				scene.add(qb);
				cube.push(qb);
			}
		}
	}
}

function newCubie(x,y,z, materials) {
	const cubeGeometry = new THREE.CubeGeometry(cubeSize, cubeSize, cubeSize);
	const qb = new THREE.Mesh(cubeGeometry, materials);	
	qb.position.set(x,y,z);
	return qb;
}

function setHiddenSidesToBlack(materials, offI, offJ, offK) {
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
}

function setToBlack(materials, side) {
	materials[side].color.setHex(0x000000);
}

function isCenter(i,j,k) {
	return (( i == 0 && j == 0) || (i == 0 && k == 0) || (j == 0 && k == 0)) &&!(i == 0 && j == 0 && k == 0);
}

/*** TURNING ***/
function handleCubeTurn(deltaMove) {
		const norm = intersected.face.normal.clone();
		const mat = new THREE.Matrix4();
		mat.extractRotation(intersected.object.matrix);
		norm.applyMatrix4(mat);
		norm.normalize();

		const proj = project(deltaMove);

		const face = new THREE.Vector3();
		face.crossVectors(norm, proj);
		face.normalize();

		const pos = intersected.point.normalize();
		const dot = face.dot(pos);
		// a negative dot product tells us that the chosen face is on the
		// opposite side of the cube 
		if(dot < 0) {
			face.negate();
		}
		
		let dir = (proj.x === 0) ? -Math.sign(proj.y) : Math.sign(proj.x);
		// clockwise and counter-clockwise are oppposite for R and D faces 
		if(face.x > 0 || face.y < 0) {
			dir *= -1;
		}

		turn(face, dir);
}

function turn(face, dir) {
	const center = selectCenter(face);
	turnFace = center.position.clone();
	turnFace.normalize();	
	const selection = select(turnFace);
	currentSelection = selection;
	isTurning = true;
	turnDir = dir;
}

function selectCenter(face) {
	let selectCenter;
	let maxDot  = -1000;
	for(const qb of centers) {
		const pos = qb.position.clone();
		pos.normalize();
		const dot = face.dot(pos);
		if(dot > maxDot) {
			selectCenter = qb;
			maxDot = dot;
		}	
	}	
	return selectCenter;
}

function select(face) {
	const selection = [];
	for(const qb of cube) {
		const pos = qb.position.clone();
		pos.normalize();
		const dot = face.dot(pos);	
		if(dot > 0.1) {
			selection.push(qb)
		}
	}
	return selection;	
}

/*** ANIMATION LOOP ***/
function animate() {
	requestAnimationFrame( animate );
	if(isTurning) {
		const rot = makeRotationMatrix(turnFace, turnSpeed*turnDir*Math.PI/2, true); 
		for(const qb of currentSelection) {
			qb.applyMatrix4(rot);
		}
		t += turnSpeed;
	}
	
	if(t >= 1) {
		isTurning = false;
		isMouseOnCube = false;
		t = 0;
	}

	renderer.render( scene, camera );

}

/*** MISC UTILS ***/

function project(vec) {
	const x = Math.abs(vec.x);
	const y = Math.abs(vec.y);	
	if(x > y) {
		return new THREE.Vector3(vec.x, 0, 0);
	}
	else {
		return new THREE.Vector3(0, vec.y, 0);
	}
}

function toRadians(deg) {
	return deg * (Math.PI / 180);
}
