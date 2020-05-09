

export default function createConnector(onTick, tickdelay=null) {
	let defaultDirty = true;
	let handlers = [];
	let pendingTick = null;

	const _onTick = function() {
		if (onTick && tickdelay===null) {
			onTick(handlers);

		} else if (onTick) {
			pendingTick = pendingTick || setTimeout(function() {
				pendingTick = null;
				onTick(handlers);
			}, tickdelay);
		}
	}

	handlers.setDefaultDirty = function(dirty) {
		defaultDirty = dirty;
	};

	handlers.connect = function(props, { onConnect, onDisconnect, state={} }={}) {
		const handler = createHandler(handlers, function() {
			[_onTick, onDisconnect].forEach(fn => fn&&fn());
		});

		handler.reconnect = props => {
			handler.props = onConnect && onConnect(props);
			handler.props = handler.props===undefined ? props : handler.props;
			handler.dirty = defaultDirty;
			_onTick();
		}

		handler.state = state;
		handler.reconnect(props)
		return handler;
	}

	return handlers;
}


function createHandler(handlers, onDisconnect) {
	const handler = () => {
		if (handlers.indexOf(handler)!==-1) {
			handlers.splice(handlers.indexOf(handler), 1);
			onDisconnect && onDisconnect();
		}
	}

	handler.promises = [];
	handler.then = fn => handler.promises.push(fn);
	handler.resolved = 0;
	handler.makeDirty = () => handler.dirty = true;
	handler.resolve = function(state) {
		handler.resolved++;
		handler.promises.forEach(fn => fn(state))
	}

	handlers.push(handler);
	return handler;
}
