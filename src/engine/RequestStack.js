
import * as history from './history'


export default class RequestStack {


	constructor(back=3, forward=1) {
		this._back = Math.max(0, back);
		this._forward = Math.max(0, forward);
		this._active = {};
		this._history = {};
		this._order = [];
	}


	createRequest(request) {
		var id = history.getCurrentId();

		if (this._active[id]) {
			this._active[id].dispose();
		}

		request.start();
		this._active[id] = request;
		this._history[id] = request;

		if (this._order.indexOf(id)===-1) {
			this._order.push(id);
		}

		this.clear();
		return request;
	}


	findRequest($element) {
		const request = Object.keys(this._active)
			.map(id => this._active[id])
			.filter(request => $element && request.$fragment.contains($element))
			.pop();

		return request || this.loadRequest();
	}


	loadRequest() {
		return this._active[history.getCurrentId()];
	}


	loadHistoryRequest(id) {
		return this._history[id];
	}


	clear() {
		const id = history.getCurrentId();
		const order = this._order.filter(id => id==id || this._active[id]);
		const index = order.indexOf(id);

		this._clear(order.filter((id, i) => i>index+this._forward));
		this._clear(order.filter((id, i) => i<index-this._back));
	}


	clearForward() {
		const index = this._order.indexOf(history.getCurrentId());
		this._clear(this._order.filter((id, i) => i>index));
	}


	clearHistory() {
		const index = this._order.indexOf(history.getCurrentId());
		this._clear(this._order.filter((id, i) => i!==index));
	}


	_clear(keys) {
		keys.filter(id => this._active[id]).forEach(id => this._active[id].dispose());
		keys.filter(id => this._active[id]).forEach(id => delete this._active[id]);
	}

}
