
import React from 'react'
import ReactDOM from 'react-dom'
import { AppComponent } from './AppComponent'


export function createAsyncComponent(Component, fn) {
	return function create($element, data) {
		const instance = {
			$element, data,
			$container: $element,
			render(newData, $container) {
				this.data = newData || this.data;
				this.$container = $container || this.$container;
				ReactDOM.render(<AppComponent><Component {...this.data} /></AppComponent>, this.$container);
			},
			destroy() { ReactDOM.unmountComponentAtNode(this.$container); },
		}

		return {
			parent: instance,
			...instance,
			...fn.call(instance, $element, data)||{},
		}
	}
}

