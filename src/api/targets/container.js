
import { findPlugins } from 'plugin-macro-loader'
import NodeList from './NodeList'


const containers = {};
const containersPointers = [];

let reloading = false;


export function swapDocument(fn)
{
	uncompleteDocument();
	getTargetsContainer('document').remove(document);
	fn && fn();
	getTargetsContainer('document').add(document);
	completeTargets();
}


export function reloadTargets(fn)
{
	if (reloading===false) {
		reloading = true;

		const $nodeLists = [];

		Object.values(containers).filter(container => container).forEach(function(container) {
			$nodeLists.push([container, container.nodeList.toArray()]);
		});

		$nodeLists.forEach(function([container, $nodeList]) {
			$nodeList.forEach($node => container.remove($node));
		});

		setTimeout(function() {
			$nodeLists.forEach(function([container, $nodeList]) {
				$nodeList.forEach($node => container.add($node));
			});

			completeTargets();
			reloading = false;
		}, 0);
	}

	fn && fn();
}


export function getTargetsContainer(id='')
{
	let index = containersPointers.indexOf(id);

	return containers[index] || {
		nodeList: new NodeList(),
		add($node) {
			if (index===-1) {
				index = containersPointers.push(id)-1;
			}

			containersPointers[index] = id;
			containers[index] = this;

			this.nodeList.add($node);
		},
		remove($node) {
			this.nodeList.remove($node);

			if (index!==-1 && reloading===false && this.nodeList.isEmpty()) {
				containersPointers[index] = undefined;
				containers[index] = undefined;
			}
		},
	};
}


function uncompleteDocument()
{
	findPlugins(document).
		map(({ api }) => api('targets')||[]).
		forEach(apiTargetsList => apiTargetsList.
			filter(targets => targets && targets.uncompleteDocument).
			forEach(targets => targets.uncompleteDocument())
		);
}


function completeTargets()
{
	findPlugins(document).
		map(({ api }) => api('targets')||[]).
		forEach(apiTargetsList => apiTargetsList.
			filter(targets => targets && targets.completeTargets).
			forEach(targets => targets.completeTargets())
		);
}
