const file = document.querySelector("#js-audio-input")
const audio = document.querySelector("#js-audio-source")
const fileLabel = document.querySelector("#js-audio-label")
const canva = document.querySelector("#canvas")

file.addEventListener("change", onFileChange)

async function onFileChange(event) {
	const file = event.target.files[0]
	const fileURL = URL.createObjectURL(file)
	audio.src = fileURL
	await audio.load()
	startNewVisualization()
}

function initContext() {
	// create audiocontext
	const context = new AudioContext()
	const source = context.createMediaElementSource(audio)
	const analyser = context.createAnalyser()
	source.connect(analyser)
	analyser.connect(context.destination)
	analyser.fftSize = 512
	const bufferLength = analyser.frequencyBinCount
	const dataArray = new Uint8Array(bufferLength)

	return { context, analyser, dataArray }
}

function initThree() {
	// setup scene & camera
	const scene = new THREE.Scene()
	const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 80000)
	camera.position.set(0, 0, 800)
	camera.lookAt(scene.position)
	scene.background = new THREE.Color(0x000000)
	scene.add(camera)

	// setup geometry
	const geometry = new THREE.BufferGeometry()
	const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
	const geometryMesh = new THREE.Mesh(geometry, material)
	scene.add(geometryMesh)

	// setup ThreeJS renderer
	const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth, window.innerHeight)

	return { renderer, scene, camera, geometry }
}

function getVertices(arr) {
	const vertices = []

	for (let i = 0; i < arr.length; i++) {
		const r = arr[i] + 10
		const theta = (2 * Math.PI / 1024) * i * 11
		const vector = new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), 4)
		vertices.push(vector.x, vector.y, vector.z)
	}

	return vertices
}

let stop = false

function startNewVisualization() {
	const { analyser, dataArray } = initContext()
	const { renderer, scene, camera, geometry } = initThree()

	audio.play()

	function render(now) {
		// setTimeout(() => {
		// 	if(!stop) requestAnimationFrame(render)
		// }, 1000)
		requestAnimationFrame(render)

		analyser.getByteFrequencyData(dataArray, scene)
		const vertices = getVertices(dataArray)
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

		renderer.render(scene, camera)
	}

	requestAnimationFrame(render)

}
