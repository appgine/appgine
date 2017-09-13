
import { destroy } from 'plugin-macro-loader/lib/lib/destroy'


export default class TargetList
{

	constructor(pluginObj, ...queries) {
		this.pluginObj = pluginObj;
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
		this._document = [];
		this._completed = false;
		this._documented = false;
	}


	destroy() {
		this.uncompleteTargets();
		Object.keys(this._targets).forEach(id => this.removeTarget(id));
	}


	addTarget(id, targetObj) {
		const { $element, target, data } = targetObj;
		const state = this.pluginObj.state('target', target, $element);
		this.uncompleteTargets();

		if (this._targets[id]===undefined && this.containsElement($element)===false) {
			this._targets[id] = { id, state, instances: [], $element, $target: $element, ...targetObj };
			targetObj = this._targets[id];

			for (let first of this._first) {
				if (first.id===undefined && (first.target==='' || first.target===target)) {
					first.id = id;
					first.result = first($element, targetObj)||{};
					targetObj.instances.push(first.result);
				}
			}

			for (let every of this._every) {
				if (every.target==='' || every.target===target) {
					every.ids[id] = every($element, targetObj)||{};
					targetObj.instances.push(every.ids[id]);
				}
			}
		}
	}

	removeTarget(id) {
		if (this._targets[id]) {
			this.uncompleteTargets();

			const targetObj = this._targets[id];
			delete this._targets[id];

			for (let every of this._every) {
				const instance = every.ids[id];
				delete every.ids[id];
				targetObj.instances.splice(targetObj.instances.indexOf(instance), 1);
				destroy(instance);
			}

			for (let first of this._first) {
				if (first.id===id) {
					const instance = first.result;
					delete first.id;
					delete first.result;
					targetObj.instances.splice(targetObj.instances.indexOf(instance), 1);
					destroy(instance);

					for (let target of Object.values(this._targets)) {
						if (first.target==='' || first.target===target.target) {
							first.id = target.id;
							first.result = first(target.$element, target);
							target.instances.push(first.result);
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

		if (this._documented===false) {
			this._documented = true;

			for (let complete of this._document) {
				complete.result = complete();
			}
		}
	}

	uncompleteTargets() {
		this.uncompleteDocument();

		if (this._completed) {
			this._completed = false;

			for (let complete of this._complete) {
				destroy(complete.result);
				complete.result = undefined;
			}
		}
	}


	uncompleteDocument() {
		if (this._documented) {
			this._documented = false;

			for (let complete of this._document) {
				destroy(complete.result);
				complete.result = undefined;
			}
		}
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
		return this.findAll(target)[0] || null;
	}

	findElement(target) {
		return this.findAllElement(target)[0] || null;
	}

	findAll(target='', fn) {
		const found = [];
		for (let _target of Object.values(this._targets)) {
			if (target==='' || _target.target===target) {
				found.push(_target);
				fn && fn(_target);
			}
		}

		return found;
	}

	findAllElement(target='', fn) {
		const _fn = fn && (({ $element }) => fn($element));
		return this.findAll(target, _fn).map(target => target.$element);
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

	document(createFn) {
		this._document.push(createFn);
		return this;
	}

	complete(createFn) {
		this._complete.push(createFn);
		return this;
	}

}
