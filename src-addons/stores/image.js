
import { createConnector } from '../../lib/helpers/createConnector'
import loadImage from '../loadImage'


const images = {};
const connector = createConnector(onTick, 0);


export function initial(src) {
	return images[src] || {
		image: src ? null : false,
		width: 'auto',
	}
}


export function connect(src) {
	images[src] = undefined || images[src];
	return connector.connect(src);
}


function publish(src, width, height) {
	images[src] = {
		image: width>1 ? src : false,
		width: ratio => width>1 ? Math.min(width, height*ratio).toString() + 'px' : 'auto',
	}

	publishSrc(src);
}


function publishSrc(src) {
	connector.
		filter(handler => handler.props===src).
		filter(handler => handler.resolved===0).
		forEach(handler => handler.resolve(images[src]));
}


function onTick() {
	Object.keys(images)
		.filter(src => images[src]===undefined)
		.forEach(src => {
			images[src] = false;
			loadImage(src, publish.bind(null, src));
		});

	Object.keys(images).
		filter(src => images[src]).
		forEach(src => publishSrc(src));
}
