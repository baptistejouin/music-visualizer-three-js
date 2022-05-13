const file = document.querySelector("#js-audio-input")
const audio = document.querySelector("#js-audio-source")
const fileLabel = document.querySelector("#js-audio-label")
const canvas = document.querySelector("#canvas")

file.addEventListener("change", onFileChange)

async function onFileChange(event) {
	// when a user loads an audio file
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
	scene.background = new THREE.Color(0x111111)
	scene.add(camera)

	// setup geometry and line
	const geometry = new THREE.BufferGeometry().setFromPoints(1, 1, 1, 1, 1, 1)
	const material = new THREE.LineBasicMaterial({ color: 0xffffff })
	const line = new THREE.Line(geometry, material)
	scene.add(line)

	// setup ThreeJS renderer
	const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth, window.innerHeight)

	// on window resize, update the visualization
	window.addEventListener("resize", () => onWindowResize(camera, renderer), false)

	return { renderer, scene, camera, line }
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

function startNewVisualization() {
	const { analyser, dataArray } = initContext()
	const { renderer, scene, camera, line } = initThree()

	audio.play()

	function render() {
		requestAnimationFrame(render)

		analyser.getByteFrequencyData(dataArray, scene)

		const vertices = getVertices(dataArray)

		line.geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))

		renderer.render(scene, camera)
	}

	requestAnimationFrame(render)
}

function onWindowResize(camera, renderer) {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
}