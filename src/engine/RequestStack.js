
import Request from './Request'
import * as history from './history'


export default class RequestStack {


	constructor(back=3, forward=1) {
		this._back = Math.max(0, back);
		this._forward = Math.max(0, forward);
		this._history = {}
		this._order = [];
	}


	createRequest(endpoint, fragment, scrollTo) {
		var pos = history.getCurrentPos();

		if (this._history[pos]) {
			this._history[pos].dispose();
		}

		let request = new Request(endpoint, fragment, scrollTo);
		this._history[pos] = request;

		if (this._order.indexOf(pos)===-1) {
			this._order.push(pos);
		}

		this.clear();
		return request;
	}


	findRequest($element) {
		if (document.contains($element)) {
			return this.loadRequest();

		} else if ($element) {
			return Object.keys(this._history)
				.map(pos => this._history[pos])
				.filter(request => request.$fragment.contains($element))
				.pop();
		}
	}


	loadRequest() {
		return this._history[history.getCurrentPos()];
	}


	clear() {
		const pos = history.getCurrentPos();
		const order = this._order.filter(id => id==pos || this._history[id]);
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
		keys.filter(id => this._history[id]).forEach(id => this._history[id].dispose());
		keys.filter(id => this._history[id]).forEach(id => delete this._history[id]);
	}

}
