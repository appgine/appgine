

export const locale = {
	error: {
		request: {
			ajax: true,
			page: true,
			abort: true,
			empty: true,
			timeout: true,
			status500: true,
			status400: true,
			nointernet: true,
		}
	}
}


function fillLocale(locale, path) {
	Object.keys(locale).forEach(key => {
		const keypath = path ? (path+'.'+key) : key;

		if (typeof locale[key]==='object') {
			fillLocale(locale[key], keypath)

		} else {
			locale[key] = keypath;
		}
	});
}

fillLocale(locale, '');


export const en = {
	[locale.error.request.ajax]: 'Failed to handle request.',
	[locale.error.request.page]: 'Failed to load requested page.',
	[locale.error.request.abort]: 'Request aborted.',
	[locale.error.request.empty]: 'Request did not respond.',
	[locale.error.request.timeout]: 'Server did not respond in time.',
	[locale.error.request.status500]: 'Server responded with unexpected error.',
	[locale.error.request.status400]: 'Server denied this request.',
	[locale.error.request.nointernet]: 'Check your Internet connection.',
}


export const cs = {
	[locale.error.request.ajax]: 'Požadavek se nepodařilo vykonat.',
	[locale.error.request.page]: 'Stránku se nepodařilo načíst.',
	[locale.error.request.abort]: 'Požadavek byl přerušen.',
	[locale.error.request.empty]: 'Požadavek nevrátil odpověď.',
	[locale.error.request.timeout]: 'Server neodpověděl v časovém limitu.',
	[locale.error.request.status500]: 'Neočekávaná chyba, akci prosím opakujte.',
	[locale.error.request.status400]: 'Server tento požadavek zamítnul.',
	[locale.error.request.nointernet]: 'Zkontrolujte prosím své internetové připojení.',
}
