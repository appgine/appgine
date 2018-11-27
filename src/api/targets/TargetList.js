
import { destroy } from 'plugin-macro-loader/lib/lib/destroy'


export default class TargetList
{

	constructor(pluginApi, ...queries) {
		this._pluginApi = pluginApi;
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
		this._targetsComplete = [];
		this._first = [];
		this._every = [];
		this._parent = [];
		this._parents = [];
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
		const state = this._pluginApi.state('target', target, $element);
		this.uncompleteTargets();

		if (this._targets[id]===undefined && this.containsElement($element)===false) {
			this._targets[id] = { id, state, instances: [], $element, $target: $element, ...targetObj };
			targetObj = this._targets[id];
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
				this._pluginApi.pluginObj.internalCall('targets.every:destroy', true, () => destroy(instance));
			}

			for (let first of this._first) {
				if (first.id===id) {
					const instance = first.result;
					delete first.id;
					delete first.result;
					targetObj.instances.splice(targetObj.instances.indexOf(instance), 1);
					this._pluginApi.pluginObj.internalCall('targets.first:destroy', true, () => destroy(instance));
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
		const $element = this._pluginApi.pluginObj.$element;
		const state = this._pluginApi.state('complete');

		this._pluginApi.pluginObj.internalCall('targets.first', false, () => {
			for (let first of this._first) {
				for (let targetId of Object.keys(this._targets)) {
					const targetObj = this._targets[targetId];
					const { $element, target } = this._targets[targetId];

					if (first.id===undefined && (first.target==='' || first.target===target)) {
						first.id = targetId;
						first.result = first($element, targetObj)||{};
						targetObj.instances.push(first.result);
					}
				}
			}
		});

		this._pluginApi.pluginObj.internalCall('targets.every', false, () => {
			for (let every of this._every) {
				for (let targetId of Object.keys(this._targets)) {
					const targetObj = this._targets[targetId];
					const { $element, target } = this._targets[targetId];

					if (every.target==='' || every.target===target) {
						every.ids[targetId] = every($element, targetObj)||{};
						targetObj.instances.push(every.ids[targetId]);
					}
				}
			}
		});

		this._pluginApi.pluginObj.internalCall('complete.parent', false, () => {
			$element && this._parent.forEach(createFn => {
				let $parent = $element;
				while ($parent = $parent.parentNode) {
					if ($parent.matches && $parent.matches(createFn.selector)) {
						createFn.result = createFn($parent)||{};
						this._targetsComplete.push(createFn.result);
						break;
					}
				}
			});
		});

		this._pluginApi.pluginObj.internalCall('complete.parents', false, () => {
			$element && this._parents.forEach(createFn => {
				let $parent = $element;
				while ($parent = $parent.parentNode) {
					if ($parent.matches && $parent.matches(createFn.selector)) {
						const result = createFn($parent)||{};
						createFn.results.push(result);
						this._targetsComplete.push(result);
					}
				}
			});
		});

		if (this._completed===false) {
			this._completed = true;

			this._pluginApi.pluginObj.internalCall('targets.complete', false, () => {
				for (let complete of this._complete) {
					complete.result = complete();
				}
			});
		}

		if (this._documented===false) {
			this._documented = true;

			this._pluginApi.pluginObj.internalCall('targets.complete.document', false, () => {
				for (let complete of this._document) {
					complete.result = complete();
				}
			});
		}
	}

	uncompleteTargets() {
		this.uncompleteDocument();

		if (this._completed) {
			this._completed = false;

			for (let complete of this._complete) {
				this._pluginApi.pluginObj.internalCall('targets.complete:destroy', true, () => destroy(complete.result));
				complete.result = undefined;
			}
		}

		for (let parents of this._parents) {
			parents.results.forEach(instance => {
				this._targetsComplete.splice(this._targetsComplete.indexOf(instance), 1);
				this._pluginApi.pluginObj.internalCall('complete.parents:destroy', true, () => destroy(instance));
			});

			parents.results = [];
		}

		for (let parent of this._parent) {
			const instance = parent.result;
			delete parent.result;
			this._targetsComplete.splice(this._targetsComplete.indexOf(instance), 1);
			this._pluginApi.pluginObj.internalCall('complete.parent:destroy', true, () => destroy(instance));
		}
	}


	uncompleteDocument() {
		if (this._documented) {
			this._documented = false;

			for (let complete of this._document) {
				this._pluginApi.pluginObj.internalCall('targets.complete.document:destroy', true, () => destroy(complete.result));
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

	isCompleted() {
		return this._completed;
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

	parent(selector, createFn) {
		createFn.selector = selector;
		this._parent.push(createFn);
		return this;
	}

	parents(selector, createFn) {
		createFn.selector = selector;
		createFn.results = [];
		this._parents.push(createFn);
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
