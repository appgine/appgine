

export default function parser(str) {
	return str.split('$').filter(attrValue => attrValue).map(function(attrValue) {
		let [pluginAttr, ..._pluginVar] = attrValue.split(':');

		const matched = pluginAttr.match(/^(?:([^\[]*)(?:\[([^\]]*)\])?@)?(([^\[]*)(?:\[([^\]]*)\])?)$/);
		const target = matched[1]||'';
		const targetId = matched[2]||'';
		const name = matched[3] + (matched[5]===undefined ? "[]" : "");
		const pluginName = matched[4];
		const pluginId = matched[5]||'';
		const pluginVar = _pluginVar.join(':');

		return { pluginAttr, pluginName, pluginId, pluginVar, target, targetId, name };
	});
}
