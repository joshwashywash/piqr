const max = array => array.reduce((prev, curr) => Math.max(prev, curr));

const min = array => array.reduce((prev, curr) => Math.min(prev, curr));

const mean = array =>
	Math.ceil(array.reduce((prev, curr) => prev + curr) / array.length);

const dist = (a, b) =>
	Math.hypot(...zip([a, b]).map(c => c.reduce((prev, curr) => prev - curr)));

const maxElementIndex = array => array.indexOf(max(array));

const nearest = (pixel, palette) => {
	const distances = palette.map(color => dist(pixel, color));
	return palette[distances.indexOf(min(distances))];
};

const range = array => max(array) - min(array);

const removeEveryNth = (array, n) => array.filter((_, i) => (i + 1) % n);

const chunk = (array, n) => {
	const length = Math.ceil(array.length / n);
	return Array.from({ length }, (_, i) => array.slice(n * i, n * i + n));
};

const zip = arrays => {
	const length = min(arrays.map(array => array.length));
	return Array.from({ length }, (_, i) => arrays.map(array => array[i]));
};

const createPalette = (pixels, iterations = 2) => {
	const ranges = zip(pixels).map(range);
	const maxRangeIndex = maxElementIndex(ranges);
	const sorted = [...pixels].sort(
		(a, b) => a[maxRangeIndex] - b[maxRangeIndex]
	);
	const halves = chunk(sorted, Math.ceil(sorted.length / 2));
	return iterations <= 0
		? halves.map(half => zip(half).map(mean))
		: halves.flatMap(half => createPalette(half, iterations - 1));
};

const loadImage = path =>
	new Promise(resolve => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.src = path;
	});

const createCanvas = (width, height) => {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
};

const reader = new FileReader();
reader.addEventListener('load', async () => {
	const image = await loadImage(reader.result);
	const { width, height } = image;

	const canvas = createCanvas(width, height);
	const context = canvas.getContext('2d');

	context.drawImage(image, 0, 0, width, height);
	document.body.appendChild(canvas);

	const { data } = context.getImageData(0, 0, width, height);

	const noAlphas = removeEveryNth(data, 4);
	const pixels = chunk(noAlphas, 3);

	const palette = createPalette(pixels);

	const newData = pixels
		.map((pixel, i) => [...nearest(pixel, palette), data[4 * i + 3]])
		.flat();

	const imageData = new ImageData(
		new Uint8ClampedArray(newData),
		width,
		height
	);

	const pixelatedCanvas = createCanvas(width, height);
	const pixelatedContext = pixelatedCanvas.getContext('2d');

	pixelatedContext.putImageData(imageData, 0, 0);
	document.body.appendChild(pixelatedCanvas);
});

const input = document.body.querySelector('input');

input.addEventListener('change', () => {
	document.body.querySelectorAll('canvas').forEach(canvas => canvas.remove());
	const { files } = input;
	if (files.length !== 0) reader.readAsDataURL(files.item(0));
});
