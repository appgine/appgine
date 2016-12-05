

export function isRequestCurrent() {
	return _request===_stack.loadRequest();
}
