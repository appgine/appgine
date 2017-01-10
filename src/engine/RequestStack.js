
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
		var pos = history.getCurrentPos();

		if (this._active[pos]) {
			this._active[pos].dispose();
		}

		request.start();
		this._active[pos] = request;
		this._history[pos] = request;

		if (this._order.indexOf(pos)===-1) {
			this._order.push(pos);
		}

		this.clear();
		return request;
	}


	findRequest($element) {
		const request = Object.keys(this._active)
			.map(pos => this._active[pos])
			.filter(request => $element && request.$fragment.contains($element))
			.pop();

		return request || this.loadRequest();
	}


	loadRequest() {
		return this._active[history.getCurrentPos()];
	}


	loadHistoryRequest(pos) {
		return this._history[pos];
	}


	clear() {
		const pos = history.getCurrentPos();
		const order = this._order.filter(id => id==pos || this._active[id]);
		const index = order.indexOf(pos);

		this._clear(order.filter((id, i) => i>index+this._forward));
		this._clear(order.filter((id, i) => i<index-this._back));
	}


	clearForward() {
		const index = this._order.indexOf(history.getCurrentPos());
		this._clear(this._order.filter((id, i) => i>index));
	}


	clearHistory() {
		const index = this._order.indexOf(history.getCurrentPos());
		this._clear(this._order.filter((id, i) => i!==index));
	}


	_clear(keys) {
		keys.filter(id => this._active[id]).forEach(id => this._active[id].dispose());
		keys.filter(id => this._active[id]).forEach(id => delete this._active[id]);
	}

}
