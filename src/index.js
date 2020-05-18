import _ from 'lodash';

const loadImage = path =>
	new Promise(resolve => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.src = path;
	});

const readFile = (file, callback) =>
	new Promise(resolve => {
		const reader = new FileReader();
		reader.addEventListener('load', () =>
			callback(reader.result).then(resolve)
		);
		reader.readAsDataURL(file);
	});

const createImage = input =>
	new Promise(resolve => {
		input.addEventListener('change', () => {
			const { files } = input;
			if (files.length !== 0) readFile(files.item(0), loadImage).then(resolve);
		});
	});

const createCanvas = (width, height) => {
	const canvas = document.createElement('canvas');
	[canvas.width, canvas.height] = [width, height];
	return canvas;
};

const createPalette = (pixels, iterations) => {
	const ranges = _.zip(...pixels).map(c => Math.max(...c) - Math.min(...c));

	const maxRangeIndex = ranges.indexOf(Math.max(...ranges));

	[...pixels].sort((a, b) => a[maxRangeIndex] - b[maxRangeIndex]);

	const halves = _.chunk(pixels, Math.ceil(pixels.length / 2));

	if (iterations !== 0)
		return halves.flatMap(half => createPalette(half, iterations - 1));
	return halves.map(half =>
		_.zip(...half).map(color => Math.round(_.mean(color)))
	);
};

const dist = (a, b) =>
	Math.hypot(..._.zip(a, b).map(c => c.reduce((prev, curr) => prev - curr)));

const nearest = (pixel, palette) => {
	const distances = palette.map(color => dist(pixel, color));
	return palette[distances.indexOf(Math.min(...distances))];
};

const main = async () => {
	const image = await createImage(document.querySelector('input'));

	const canvas = createCanvas(image.width, image.height);
	const { width, height } = canvas;

	const context = canvas.getContext('2d');
	context.drawImage(image, 0, 0, width, height);

	const { data } = context.getImageData(0, 0, width, height);
	const pixels = _.chunk(Array.from(data), 4).map(_.initial);
	const palette = createPalette(pixels, 2);

	const newPixels = pixels.map((pixel, i) => [
		...nearest(pixel, palette),
		data[4 * i + 3],
	]);

	const imageData = new ImageData(
		new Uint8ClampedArray(newPixels.flat()),
		width,
		height
	);

	context.putImageData(imageData, 0, 0);
	document.body.appendChild(canvas);
};

main();
