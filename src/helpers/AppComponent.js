
import React, { Component } from 'react'
import { dispatch } from '../api/channel'

const context = {};
const contextTypes = {};

context.dispatch = dispatch;
contextTypes.dispatch = React.PropTypes.func;


export function addStore(name, store) {
	context[name] = store;
	contextTypes[name] = React.PropTypes.object;
}

export class AppComponent extends Component {

	static childContextTypes = contextTypes;

	getChildContext() {
		return context;
	}

	render() {
		const { children } = this.props;
		return children;
	}

}
