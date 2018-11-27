
import { style } from '../../lib/closure'
import { createConnector } from '../../lib/helpers/createConnector'
import { onTick } from '../../lib/tick'


const connectors = {};
const observers = {};
let buckets = {};

if (!window.IntersectionObserver) {
	let lastScreen = null;
	onTick((screen, updated) => {
		if (updated) buckets = {};
		sortBuckets();
		loadBuckets(screen, lastScreen===null || lastScreen.top!==screen.top);
		lastScreen = screen;
	});
}


export function connect($node, bucket, paddings) {
	let props = $node;
	if (props instanceof Element) {
		props = { $node, bucket, paddings };

	} else {
		$node = props.$node;
		bucket = props.bucket;
		paddings = props.paddings;
	}

	if (window.IntersectionObserver) {
		connectors[paddings] = connectors[paddings] || createConnector();

		observers[paddings] = observers[paddings] || new window.IntersectionObserver(onIntersectionObserver.bind(null, connectors[paddings]), {
			root: null,
			rootMargin: paddings ? String(paddings) + 'px' : '0px',
			threshold: 0.01,
		});

		return connectors[paddings].connect(props, {
			onConnect: observers[paddings].observe.bind(observers[paddings], $node),
			onDisconnect: observers[paddings].unobserve.bind(observers[paddings], $node),
		});

	} else {
		connectors[bucket] = connectors[bucket] || createConnector(function() {
			delete buckets[bucket];
		});

		return connectors[bucket].connect(props, { state: { resolved: 0 } });
	}
}


function onIntersectionObserver(handlers, entries, observer) {
	const observed = [];
	for (let entry of entries) {
		if (entry.isIntersecting) {
			observed.push(entry.target);
			observer.unobserve(entry.target);
		}
	}

	if (observed.length) {
		window.requestIdleCallback(function() {
			for (let handler of handlers) {
				if (observed.indexOf(handler.props.$node)!==-1) {
					handler.resolve();
				}
			}
		});
	}
}


function sortBuckets() {
	Object.keys(connectors).
		filter(bucket => !buckets[bucket]).
		forEach(bucket => {
			const visible = connectors[bucket].
				filter(({props}) => document.contains(props.$node));

			visible.forEach(({props}) => {
				props.size = style.getSize(props.$node);
				props.offset = style.getPageOffsetTop(props.$node);
			})

			buckets[bucket] = visible.sort((a, b) => a.props.offset-b.props.offset);
		});
}


function loadBuckets({top, height, left, width}, scrolling) {
	const removed = {};
	const resolved = [];
	const now = Date.now();

	Object.keys(connectors).
		filter(bucket => buckets[bucket].length).
		forEach(bucket => {
			removed[bucket] = [];

			let checkVisibility = true;
			for (let handler of buckets[bucket]) {
				if (checkVisibility) {
					const props = handler.props;
					const offsetTop = style.getPageOffsetTop(props.$node);
					const offsetLeft = style.getPageOffsetLeft(props.$node);

					const isTop = offsetTop+props.size.height+props.paddings>=top;
					const isBottom = offsetTop-props.paddings<=top+height;
					const isLeft = offsetLeft+props.size.width+props.paddings>=left;
					const isRight = offsetLeft-props.paddings<=left+width;

					if (isTop && isBottom && isLeft && isRight) {
						handler.state.resolved = handler.state.resolved || now;

						if (now-handler.state.resolved >= (handler.props.delay||0)) {
							if (handler.props.whilescrolling!==false || scrolling===false) {
								removed[bucket].push(handler);
								resolved.push(handler);
							}
						}

					} else {
						handler.state.resolved = 0;

						if (bucket && isBottom===false && isRight===false) {
							checkVisibility = false;
						}
					}

				} else {
					handler.state.resolved = 0;
				}
			}
		});

	Object.keys(removed).
		forEach(bucket => {
			const newbucket = buckets[bucket].filter(handler => removed[bucket].indexOf(handler)===-1);

			removed[bucket].forEach(handler => handler());
			buckets[bucket] = newbucket.length ? newbucket : undefined;
		});

	resolved.forEach(handler => handler.resolve(true));

}
