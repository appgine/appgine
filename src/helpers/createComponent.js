
import React from 'react'
import { createAsyncComponent } from './createAsyncComponent'


export function createComponent(Component, options={}) {
	return createAsyncComponent(Component, function() {
		this.render();
		return options;
	});
}
