
import Request from './Request'
import * as history from './history'


export default class RequestStack {


	constructor(back=3, forward=1) {
		this.back = Math.max(0, back);
		this.forward = Math.max(0, forward);
		this.history = {}
		this.order = [];
	}


	createRequest(endpoint, fragment, scrollTo) {
		var pos = history.getCurrentPos();

		if (this.history[pos]) {
			this.history[pos].dispose();
		}

		let request = new Request(endpoint, fragment, scrollTo);
		this.history[pos] = request;

		if (this.order.indexOf(pos)===-1) {
			this.order.push(pos);
		}

		this.clear();
		return request;
	}


	findRequest($element) {
		if (document.contains($element)) {
			return this.loadRequest();

		} else if ($element) {
			return this.history
				.filter(request => request.$fragment.contains($element))
				.pop();
		}
	}


	loadRequest() {
		return this.history[history.getCurrentPos()];
	}


	clear() {
		const pos = history.getCurrentPos();
		const order = this.order.filter(id => id==pos || this.history[id]);
		const index = order.indexOf(pos);

		this._clear(order.filter((id, i) => i>index+this.forward));
		this._clear(order.filter((id, i) => i<index-this.back));
	}


	clearForward() {
		const index = this.order.indexOf(history.getCurrentPos());
		this._clear(this.order.filter((id, i) => i>index));
	}


	clearAll() {
		const pos = history.getCurrentPos();
		if (this.history[pos]) {
			this.history[pos].dispose();
		}

		const index = this.order.indexOf(history.getCurrentPos());
		this._clear(this.order.filter((id, i) => i!==index));
	}


	_clear(keys) {
		keys.filter(id => this.history[id]).forEach(id => this.history[id].dispose());
		keys.filter(id => this.history[id]).forEach(id => delete this.history[id]);
	}

}
