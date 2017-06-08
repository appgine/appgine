
goog.module('autocomplete');

goog.require('goog.style');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.Uri');
goog.require('goog.ui.ac.AutoComplete');
goog.require('goog.ui.ac.InputHandler');
goog.require('goog.ui.ac.RemoteArrayMatcher');
goog.require('goog.ui.ac.Renderer');


exports = function(endpoint, onSelect, onUpdate) {
	return function create($element, $container) {
		var instance = new AutoComplete($element, $container, endpoint, onSelect, onUpdate);
		instance.defaultValue = $element.value;
		instance.disposed = false;

		return function(keepValue) {
			if (instance.disposed===false) {
				instance.disposed = true;
				instance.dispose();

				if (!keepValue) {
					$element.value = instance.defaultValue;
				}
			}
		}
	}
}


function renderRow(row, token, $node)
{
	row['data']['category'] = row['data']['category'] || 'Recommended portals';

	if (row['data']['category']!==AutoComplete.category) {
		AutoComplete.category = row['data']['category'];
		var $category = goog.dom.createDom('div', 'ac-row-category', [row['data']['category']]);
		$category.onclick = function(e) {
			e.stopPropagation();
		}

		goog.dom.append($node, [$category]);
	}

	var $container = goog.dom.createDom('a', 'ac-row-container');
	$container.onclick = function(e) {
		e.preventDefault();
	}

	var $image = goog.dom.createDom('span', 'ac-row-image');
	var $title = goog.dom.createDom('span', 'ac-row-title', [row['data']['title']]);

	if (row['data']['icon']) {
		goog.dom.classes.add($image, 'fa', row['data']['icon']);

	} else if (row['data']['image']) {
		goog.style.setStyle($image, 'background-image', 'url('+row['data']['image']+')');
	}

	goog.dom.append($container, [$image, $title]);
	goog.dom.append($node, [$container]);
};



function AutoComplete($element, $container, endpoint, onSelect, onUpdate) {
  var matcher = new RemoteArrayMatcher(endpoint);

  var renderer = new goog.ui.ac.Renderer($container, {renderRow: renderRow});

  var $input = new goog.ui.ac.InputHandler(null, null, false, 100, $element);

  goog.ui.ac.AutoComplete.call(this, matcher, renderer, $input);

  $input.attachAutoComplete(this);
  $input.attachInputs($element);
  $input.setValue = function(token) {
  	$element.value = token;
  };
  $input.selectRow = function(row) {
    this.setTokenText(row['title']);
    onSelect(row);
    return false;
  };

  this._onUpdate = onUpdate;

  if ($element.form && $element.form.hasAttribute('action')) {
  	this.setAutoHilite(false);
  	this.setAllowFreeSelect(true);
  }
};
goog.inherits(AutoComplete, goog.ui.ac.AutoComplete);


AutoComplete.prototype.renderRows = function(rows, opt_options)
{
	if (!this.isDisposed()) {
		AutoComplete.category = '';
		goog.ui.ac.AutoComplete.prototype.renderRows.call(this, rows, opt_options);

		this._onUpdate && this._onUpdate(this.token_);
	}
};


AutoComplete.prototype.dismiss = function() {
	window.clearTimeout(this.dismissTimer_);
	this.dismissTimer_ = null;
	this.renderer_.dismiss();
}


/**
 * @constructor
 * @extends {goog.ui.ac.RemoteArrayMatcher}
 */
function RemoteArrayMatcher(url) {
	goog.ui.ac.RemoteArrayMatcher.call(this, url, true);
}
goog.inherits(RemoteArrayMatcher, goog.ui.ac.RemoteArrayMatcher);


RemoteArrayMatcher.prototype.buildUrl = function(uri, token) {
  var url = new goog.Uri(uri);
  url.setParameterValue('q', token);
  return url.toString();
};
