import _ from 'lodash';

import { range, maxElementIndex, nearest } from './math';

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

const loadImage = path =>
	new Promise(resolve => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.src = path;
	});

const reader = new FileReader();

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

reader.addEventListener('load', () => {
	loadImage(reader.result).then(image => {
		const { width, height } = image;
		[canvas.width, canvas.height] = [width, height];
		context.drawImage(image, 0, 0, width, height);

		const { data } = context.getImageData(0, 0, width, height);
		const pixels = _.chunk(Array.from(data), 4).map(_.initial);
		const palette = createPalette(pixels, 4);

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

		// qrcode
		// 	.toDataURL([{ data: imageData.data, mode: 'byte' }], {
		// 		errorCorrectionLevel: 'low',
		// 	})
		// 	.then(console.log)
		// 	.catch(console.error);
	});
});

const input = document.body.querySelector('input');

input.addEventListener('change', () => {
	const { files } = input;
	if (files.length !== 0) reader.readAsDataURL(files.item(0));
});
