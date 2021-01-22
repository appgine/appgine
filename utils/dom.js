

export function getDocumentScrollElement()
{
	return document.scrollingElement || (document.compatMode !== 'CSS1Compat' && document.body || document.documentElement);
}


export function compareNodeOrder(node1, node2)
{
	if (node1 == node2) {
	  return 0;
	}

	if (node1.compareDocumentPosition) {
	  return node1.compareDocumentPosition(node2) & 2 ? 1 : -1;
	}

	return 0;
}


export function findNodes($root, matcher)
{
	const $nodes = [];
	$root && findNodes_($root, matcher, $nodes, false);
	return $nodes;
}


function findNodes_($root, matcher, $nodes) {
	let $child = $root.firstChild;
	while ($child) {
		matcher($child) && $nodes.push($child);
		findNodes_($child, matcher, $nodes);
		$child = $child.nextSibling;
	}
}


export function getAncestor($target, tagName)
{
	tagName = String(tagName||'').toUpperCase();

	if ($target.target instanceof HTMLElement) {
		$target = $target.target;
	}

	while ($target) {
		if ($target.tagName===tagName) {
			return $target;
		}

		if ($target.nodeType===11) { // shadow-root
			$target = $target.parentNode || $target.host;

		} else {
			$target = $target.parentNode;
		}
	}

	return null;
}


export function getLink($target)
{
	return getAncestor($target, 'a');
}


export function getSubmitter($form, $submitter)
{
	if ($submitter.target instanceof HTMLElement) {
		$submitter = $submitter.target;
	}

	while ($submitter) {
		if (String($submitter.type||'').toLowerCase()==='submit') {
			return ($submitter.form===$form || !$form) ? $submitter : null;
		}

		$submitter = $submitter.parentNode;
	}

	return null;
}
