import _ from 'lodash';
// import qrcode from 'qrcode';

const createPalette = (pixels, iterations = 2) => {
	const ranges = _.zip(...pixels).map(c => Math.max(...c) - Math.min(...c));

	const maxRangeIndex = ranges.indexOf(Math.max(...ranges));

	[...pixels].sort((a, b) => a[maxRangeIndex] - b[maxRangeIndex]);

	const halves = _.chunk(pixels, Math.ceil(pixels.length / 2));

	return iterations === 0
		? halves.map(half => _.zip(...half).map(color => Math.round(_.mean(color))))
		: halves.flatMap(half => createPalette(half, iterations - 1));
};

const dist = (a, b) =>
	Math.hypot(..._.zip(a, b).map(c => c.reduce((prev, curr) => prev - curr)));

const nearest = (pixel, palette) => {
	const distances = palette.map(color => dist(pixel, color));
	return palette[distances.indexOf(Math.min(...distances))];
};

const reader = new FileReader();

const loadImage = path =>
	new Promise(resolve => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.src = path;
	});

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

reader.addEventListener('load', () => {
	loadImage(reader.result).then(image => {
		const { width, height } = image;
		[canvas.width, canvas.height] = [width, height];
		context.drawImage(image, 0, 0, width, height);

		const { data } = context.getImageData(0, 0, width, height);
		const pixels = _.chunk(Array.from(data), 4).map(_.initial);
		const palette = createPalette(pixels);

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
	});
});

const input = document.body.querySelector('input');

input.addEventListener('change', () => {
	const { files } = input;
	if (files.length !== 0) reader.readAsDataURL(files.item(0));
});
