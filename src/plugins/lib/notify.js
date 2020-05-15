

let $notifier;
export default function notify($node) {
	if (process.env.NODE_ENV==='development') {
		if (typeof $node === "string") {
			const $dom = document.createElement('div');
			$dom.textContent = $node;
			$dom.style.padding = '6px 3px';

			return notify($dom);
		}

		$notifier = $notifier || createNotifier();
		$notifier.appendChild($node);

		if (document.body && !$notifier.parentNode) {
			document.body.appendChild($notifier);
		}

		setTimeout(function() {
			$notifier.removeChild($node);

			if ($notifier.children.length===0 && $notifier.parentNode) {
				$notifier.parentNode.removeChild($notifier);
			}
		}, 2000);
	}
}


function createNotifier()
{
	const $notifier = document.createElement('div');
	$notifier.style.position = 'fixed';
	$notifier.style.top = '0';
	$notifier.style.left = '0';
	$notifier.style.zIndex = '9998';
	$notifier.style.backgroundColor = '#FAFAFA';
	$notifier.style.width = '600px';
	$notifier.style.fontSize = '18px';
	$notifier.style.lineHeight = '24px';

	return $notifier;
}
