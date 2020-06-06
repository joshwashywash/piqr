import _ from 'lodash';
import qrcode from 'qrcode';

import { range, maxElementIndex, nearest } from './util';

const createPalette = (pixels, iterations = 0) => {
	const ranges = _.zip(...pixels).map(range);

	const maxRangeIndex = maxElementIndex(ranges);

	const sorted = [...pixels].sort(
		(a, b) => a[maxRangeIndex] - b[maxRangeIndex]
	);

	const halves = _.chunk(sorted, Math.ceil(sorted.length / 2));

	return iterations <= 0
		? halves.map(half => _.zip(...half).map(_.mean))
		: halves.flatMap(half => createPalette(half, iterations - 1));
};

const createQR = async data => {
	try {
		const qr = await qrcode.toDataURL([{ data, mode: 'byte' }], {
			errorCorrectionLevel: 'low',
		});
	} catch (error) {
		const div = document.createElement('div');
		div.textContent = error.message;
		document.body.appendChild(div);
	}
};

const loadImage = path =>
	new Promise(resolve => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.src = path;
	});

const reader = new FileReader();

const createCanvas = (width, height) => {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
};

reader.addEventListener('load', async () => {
	const image = await loadImage(reader.result);
	const { width, height } = image;

	const canvas = createCanvas(width, height);

	const context = canvas.getContext('2d');

	context.drawImage(image, 0, 0, width, height);
	document.body.appendChild(canvas);

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
