// /**
//  * @typedef {[number]} pixel
//  */

import _ from 'lodash';

/**
 * returns a promise that resolves with the loaded image
 * @param {string} path to the image file
 * @return {Promise<HTMLImageElement>}
 */
const loadImage = path =>
	new Promise(resolve => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.src = path;
	});

/**
 * reads the file and returns a promise resolving with the result of the callback
 * @param {string} file
 * @param {function} callback
 * @return {Promise<any>}
 */
const readFile = (file, callback) =>
	new Promise(resolve => {
		const reader = new FileReader();
		reader.addEventListener('load', () =>
			callback(reader.result).then(res => resolve(res))
		);
		reader.readAsDataURL(file);
	});

/**
 * reads the file when the input changes and returns a promise holding the image
 * @param {HTMLInputElement} input
 * @return {Promise<HTMLImageElement}
 */
const createImage = input =>
	new Promise(resolve => {
		input.addEventListener('change', () => {
			const { files } = input;
			if (files.length !== 0)
				readFile(files.item(0), loadImage).then(res => resolve(res));
		});
	});

/**
 * @type {HTMLInputElement}
 */
const input = document.getElementById('input');

/**
 * returns an HTML canvas with the provided width and height
 * @param {number} width
 * @param {number} height
 * @return {HTMLCanvasElement}
 */
const createCanvas = (width, height) => {
	const canvas = document.createElement('canvas');
	[canvas.width, canvas.height] = [width, height];
	return canvas;
};

/**
 * creates palette containing iterations^2 colors
 * @param {pixel[]} pixels
 * @param {number} iterations
 * @return {pixel[]}
 */
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

/**
 * returns the Euclidean distance from point a to point b
 * @param {pixel} a
 * @param {pixel} b
 * @return {number}
 */
const dist = (a, b) =>
	Math.hypot(..._.zip(a, b).map(c => c.reduce((prev, curr) => prev - curr)));

/**
 * returns the a pixel from the palette nearest to the provided pixel
 * @param {pixel} pixel
 * @param {pixel[]} palette
 * @return {pixel}
 */
const nearest = (pixel, palette) => {
	const distances = palette.map(color => dist(pixel, color));
	return palette[distances.indexOf(Math.min(...distances))];
};

const main = async () => {
	const image = await createImage(input);
	const canvas = createCanvas(image.width, image.height);
	const context = canvas.getContext('2d');
	context.drawImage(image, 0, 0, canvas.width, canvas.height);
	const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
	// put pixels in array of this form [[r, g, b],...]
	const pixels = _.chunk(Array.from(data), 4).map(_.initial);
	const palette = createPalette(pixels, 2);
	// calculate nearest color in palette and pull alphas from original data
	const newPixels = pixels.map((pixel, i) => [
		...nearest(pixel, palette),
		data[4 * i + 3],
	]);
	const imageData = new ImageData(
		new Uint8ClampedArray(newPixels.flat()),
		canvas.width,
		canvas.height
	);
	context.putImageData(imageData, 0, 0);
	document.body.appendChild(canvas);
};

main();
