const dist = (a, b) =>
	Math.hypot(..._.zip(a, b).map(c => c.reduce((prev, curr) => prev - curr)));

const maxElementIndex = array => array.indexOf(Math.max(...array));

const nearest = (pixel, palette) => {
	const distances = palette.map(color => dist(pixel, color));
	return palette[distances.indexOf(Math.min(...distances))];
};

const range = array => Math.max(...array) - Math.min(...array);

export { dist, maxElementIndex, nearest, range };
