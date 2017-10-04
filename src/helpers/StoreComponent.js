
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { findDOMNode } from 'react-dom'
import { fillKeys, fromPair } from '../lib/object'


export function createStore(componentToProps, options={}) {
	return {...options, componentToProps};
}

export function createStoreComponent(stores={}) {

	return class StoreComponent extends Component
	{
		static contextTypes = fillKeys(stores, PropTypes.object.isRequired);

		constructor(props, context) {
			super();
			this.handler = {};
			this.state = fillKeys(stores, (key, store) => {
				if (context[key] && context[key].initial) {
					return context[key].initial(store.componentToProps(props, null));
				}
			}, true);
		}

		componentDidMount() { this.connect(this.props, this.state); }
		componentWillReceiveProps(nextProps) { this.reconnect(nextProps, this.state); this.connect(nextProps, this.state); }
		componentWillUpdate(nextProps, nextState) { this.connect(nextProps, nextState); }

		reconnect(nextProps, nextState) {
			Object.keys(stores).
				filter(store => this.handler[store]).
				forEach(store => {
					const props = stores[store].componentToProps(nextProps, findDOMNode(this));
					this.handler[store].reconnect(props);
				});
		}

		connect(nextProps, nextState) {
			Object.keys(stores).
				filter(store => this.handler[store]===undefined).
				filter(store => this.context[store] && this.context[store].connect).
				filter(store => stores[store].shouldConnect===undefined || stores[store].shouldConnect(nextProps, nextState)).
				forEach(store => {
					const props = stores[store].componentToProps(nextProps, findDOMNode(this));
					this.handler[store] = this.context[store].connect(props);
					this.handler[store].then(state => this.setState(fromPair(store, state)));
				});
		}

		componentWillUnmount() {
			Object.values(this.handler).forEach(handler => handler());
			this.handler = {};
		}
	}
}
