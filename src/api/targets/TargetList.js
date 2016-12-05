

export default class TargetList
{

	constructor(...queries) {
		this._queries = [];
		queries.forEach(query => {
			const [target, ...selector] = String(query).split('@');

			if (selector.length) {
				this._queries.push([target, selector.join('@')]);

			} else if (target) {
				this._queries.push(['', target]);
			}
		});

		this._targets = {};
		this._first = [];
		this._every = [];
		this._complete = [];
		this._completed = false;
	}


	addTarget(id, targetObj) {
		const { $element, target, data } = targetObj;
		const state = {};
		this.uncompleteTargets();

		if (this._targets[id]===undefined && this.containsElement($element)===false) {
			this._targets[id] = { id, state, ...targetObj };
			targetObj = this._targets[id];

			for (let first of this._first) {
				if (first.id===undefined && (first.target==='' || first.target===target)) {
					first.id = id;
					first.result = first($element, targetObj);
				}
			}

			for (let every of this._every) {
				if (every.target==='' || every.target===target) {
					every.ids[id] = every($element, targetObj);
				}
			}
		}
	}

	removeTarget(id) {
		if (this._targets[id]) {
			this.uncompleteTargets();

			delete this._targets[id];

			for (let every of this._every) {
				const destroy = every.ids[id];
				delete every.ids[id];
				destroy && destroy();
			}

			for (let first of this._first) {
				if (first.id===id) {
					const destroy = first.result;
					delete first.id;
					delete first.result;
					destroy && destroy();

					for (let target of Object.values(this._targets)) {
						if (first.target==='' || first.target===target.target) {
							first.id = target.id;
							first.result = first(target.$element, target);
							break;
						}
					}
				}
			}
		}
	}

	containsElement($element) {
		for (let target of Object.values(this._targets)) {
			if (target.$element===$element) {
				return true;
			}
		}

		return false;
	}

	completeTargets() {
		if (this._completed===false) {
			this._completed = true;

			for (let complete of this._complete) {
				complete.result = complete();
			}
		}
	}

	uncompleteTargets() {
		if (this._completed) {
			for (let complete of this._complete) {
				if (typeof complete.result==='function') {
					complete.result();
					complete.result = undefined;
				}
			}
		}

		this._completed = false;
	}

	reload() {
		const targets = {...this._targets};

		for (let id of Object.keys(targets)) {
			this.removeTarget(id);
		}

		for (let id of Object.keys(targets)) {
			this.addTarget(id, targets[id]);
		}
	}

	findOne(target) {
		return this.findAll(target)[0];
	}

	findAll(target='') {
		const found = [];
		for (let _target of Object.values(this._targets)) {
			if (target==='' || _target.target===target) {
				found.push(_target);
			}
		}

		return found;
	}

	first(target, createFn) {
		if (typeof target === 'function') {
			createFn = target;
			target = '';
		}

		createFn.target = target;
		this._first.push(createFn);
		return this;
	}

	every(target, createFn) {
		if (typeof target === 'function') {
			createFn = target;
			target = '';
		}

		createFn.target = target;
		createFn.ids = {};
		this._every.push(createFn);
		return this;
	}

	complete(createFn) {
		this._complete.push(createFn);
		return this;
	}

}
