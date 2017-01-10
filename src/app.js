
import './shim.js'
import run from './run'
import bridgeTracy from './bridges/tracy'
import bridgeLayers from './bridges/layers'

let options = {};
options = bridgeTracy(options);
options = bridgeLayers(options, function renderLayers(_$container, $titles, $navigation, $content) {
	const $container = _$container.ownerDocument.createElement('div');

	$titles.forEach($title => $container.appendChild($title));
	$navigation && $container.appendChild($navigation);
	$container.appendChild($content);

	return $container;
});

run(options);
