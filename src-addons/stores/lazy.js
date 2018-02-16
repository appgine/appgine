
import { createConnector } from '../../lib/helpers'
import { onTick } from '../../lib/tick'


const connectors = {};
let buckets = {};

onTick((screen, updated) => {
	if (updated) buckets = {};
	sortBuckets();
	loadBuckets(screen);
});


export function connect(props) {
	const { bucket } = props;

	connectors[bucket] = connectors[bucket] || createConnector(function() {
		delete buckets[bucket];
	});

	return connectors[bucket].connect(props);
}


function sortBuckets() {
	Object.keys(connectors).
		filter(bucket => !buckets[bucket]).
		forEach(bucket => {
			const visible = connectors[bucket].
				filter(({props}) => document.contains(props.$node));

			visible.forEach(({props}) => {
				props.size = closure.style.getSize(props.$node);
				props.offset = closure.style.getPageOffsetTop(props.$node);
			})

			buckets[bucket] = visible.sort((a, b) => a.props.offset-b.props.offset);
		});
}


function loadBuckets({top, height, left, width}) {
	const removed = {};
	const resolved = [];

	Object.keys(connectors).
		filter(bucket => buckets[bucket].length).
		forEach(bucket => {
			removed[bucket] = [];

			buckets[bucket].some(handler => {
				const props = handler.props;
				const offsetTop = closure.style.getPageOffsetTop(props.$node);
				const offsetLeft = closure.style.getPageOffsetLeft(props.$node);

				const isTop = offsetTop+props.size.height+props.paddings>=top;
				const isBottom = offsetTop-props.paddings<=top+height;
				const isLeft = offsetLeft+props.size.width+props.paddings>=left;
				const isRight = offsetLeft-props.paddings<=left+width;

				if (isTop && isBottom && isLeft && isRight) {
					removed[bucket].push(handler);
					resolved.push(handler);
					return false;

				} else if (bucket==='' || isBottom || isRight) {
					return false;
				}

				return true;
			});
		});

	Object.keys(removed).
		forEach(bucket => {
			const newbucket = buckets[bucket].filter(handler => removed[bucket].indexOf(handler)===-1);

			removed[bucket].forEach(handler => handler());
			buckets[bucket] = newbucket.length ? newbucket : undefined;
		});

	resolved.forEach(handler => handler.resolve(true));

}
