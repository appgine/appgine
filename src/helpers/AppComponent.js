
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

	constructor(props) {
		super(props);
		this.DynamicAppProps = {};
		this.componentWillReceiveProps(props);
	}

	getChildContext() {
		return context;
	}

	componentWillReceiveProps(nextProps) {
		let shouldUpdate = false;
		const { children, ...DynamicAppProps } = nextProps;

		if (Object.keys(this.DynamicAppProps).length!==Object.keys(DynamicAppProps).length) {
			shouldUpdate = true;
		}

		Object.keys(DynamicAppProps).
			filter(key => DynamicAppProps[key]!==this.DynamicAppProps[key]).
			forEach(key => shouldUpdate = true);

		if (shouldUpdate) {
			this.DynamicAppProps = DynamicAppProps;
			this.DynamicAppComponent = DynamicAppComponent(DynamicAppProps);
		}
	}

	render() {
		const DynamicAppComponent = this.DynamicAppComponent;
		const { children } = this.props;

		if (DynamicAppComponent) {
			return <DynamicAppComponent>{children}</DynamicAppComponent>

		} else {
			return children;
		}
	}

}


function DynamicAppComponent(context) {
	const contextTypes = {};

	Object.keys(context).forEach(function(key) {
		if (typeof context[key]==='function') {
			contextTypes[key] = React.PropTypes.func;

		} else {
			contextTypes[key] = React.PropTypes.object;
		}
	});

	return class DynamicAppComponent_ extends Component {
		static childContextTypes = contextTypes;

		getChildContext() {
			return context;
		}

		render() {
			return this.props.children;
		}
	}
}
