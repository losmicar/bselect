(function($) {
	if (typeof JSON.clone !== "function") {
	    JSON.clone = function(obj) {
	        return JSON.parse(JSON.stringify(obj));
	    };
	}
	var Bselect = function(element, options) {
		this.defaultSettings = {
			debug : true,
			search : true,
			width : "200px",
			defaultText : "Select me",
			className : "",
			inputName : "bselect-input",
			selected : 0,
			checkInView : true,
			opened : false,
			multiple : false,
			closeOnSelect : true,
			elipsis : true,
			focusDelay : 100, // ms
			doneTypingInterval : 0,
			removeItemsButton : false, //Display X button next to every item in drop down list
			/* Maximum items to preview in drop down list (increasing this value can slow down page rendering)
			 * Even not listed in a dropdown UI search will go through settings.data and list results
			 */
			preview : 100, //Num of items in dropdown UI to be displayed
		};
		this.settings = $.extend(this.defaultSettings, options);
		this.element = element;
		this.selectedItems = []; // null;
		this.disabledItems = [];
		this.elipsis = this.settings.elipsis ? 'elipsis' : '';
		this.searchInputValue = "";
		this.jsonData = this.settings.data ? JSON.clone(this.settings.data) : null;
		this.id = $(element).attr('id');
		this.typingTimer = null;
		this.build();
	}
	/**
	 * For debuging purpose
	 */
	Bselect.prototype.log = function() {
		if(this.settings.debug){
			console.log("Bselect", Array.prototype.slice.call(arguments));
		}
	}
	/**
	 * Start building Bselect, create html template and bind events
	 */
	Bselect.prototype.build = function() {
		this.log('build', {"djoka":"runda"}, ['aa']);
		this.build_template();
		this.bind_events();
	}
	/**
	 * Build HTML template
	 */
	Bselect.prototype.build_template = function() {
		this.log('build_template');
		var template = '<div class="bselect ' + this.settings.className
				+ '" id="' + this.id + '-bselect">';

		var input = $("input[value='" + this.settings.inputName + "']");

		if (this.settings.input != undefined) {
			template += this.settings.search;
		} else {
			if (input.length) {
				input.addClass('bselect-input');
			} else {
				template += "<input type='text' name='"
						+ this.settings.inputName
						+ "' value='' class='bselect-input' />";
			}
		}
		var elipsis = this.settings.multiple ? '' : 'elipsis';

		template += "<div class='bselect-active " + elipsis + "'>"
				+ this.wrapSelected(this.settings.defaultText) + "</div>";

		template += "<div class='bselect-content'>"

		if (this.settings.search) {

			template += "<div class='bselect-search'><input type='text' placeholder='Search...' autocomplete='off'/></div>";
		}
		if (this.jsonData) {
			template += "<ul class='bselect-list'>";
			var t=1;
			for ( var i in this.jsonData) {
				if(t>=this.settings.preview){
					break;
				}else{
					template += this.buildOption(i);
					t++;
				}
			}
			template += "</ul>";
		}
		
		template += "</div>";
		template += "</div>";

		var elem = this.elem = $('#' + this.id);

		elem.html(template);
		
		this.bselect = elem.find('.bselect');
		this.active = elem.find('.bselect-active');
		this.search = elem.find('.bselect-search');
		this.searchInput = this.search.find('input');
		this.content = elem.find('.bselect-content');
		this.input = elem.find('.bselect-input');
		this.list = elem.find('.bselect-list');
		this.list_items = this.list.children();

		// var width = this.settings.width!=undefined ? this.settings.width :
		// $(this.bselect).width();

		this.bselect.css('width', this.settings.width);
		var width = $(this.bselect).width();
		$(this.content).css('width', width);

		// Preselect values
		if (this.settings.selected) {

			if ($.isArray(this.settings.selected)) {
				var _self = this;
				$.each(this.settings.selected, function(key, val) {
					_self.selectById(val, false);
				});

			} else {
				this.selectById(this.settings.selected);
			}
		}

	}
	Bselect.prototype.isElementInViewport = function() {
		this.log('isElementInViewport');
		var rect = this.content[0].getBoundingClientRect();

		return (rect.top >= 0
				&& rect.left >= 0
				&& rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*
																									 * or
																									 * $(window).height()
																									 */
		rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*
																					 * or
																					 * $(window).width()
																					 */
		);
	}
	Bselect.prototype.wrapSelected = function(text) {
		this.log('wrapSelected');
		if (this.settings.formatSelected) {
			text = this.settings.formatSelected(text);
		}
		return "<div class='bselect-default-text'>" + text + "</div>";
	}

	/**
	 * Check Promise to prevent UI block
	 */
	Bselect.prototype.promise = function(delay) {
		return new Promise(function(resolve, reject) {

			if (delay) {
				setTimeout(function() {
					resolve()
				}, delay);
			} else {
				resolve();
			}

		});
	}
	/**
	 * Open Bselect
	 */
	Bselect.prototype.open = function(e) {
		var _self = this;
		_self.element.trigger("open.bselect", {
			bselect : _self.id,
			obj : _self
		});
		_self.content.css("visibility", "visible");

		if (_self.settings.checkInView && !_self.isElementInViewport()) {
			_self.content.css("top", "-" + ($(_self.content).height() + 1)
					+ 'px');
		}
		_self.settings.opened = true;
		_self.promise(_self.settings.focusDelay).then(function() {
			_self.searchInput.focus();
		});
		$(document).on(
				'click.bselect.document',
				function(evnt) {
					if (!jQuery.contains(_self.element[0], evnt.target)
							&& e != undefined) {
						_self.close();
					}
				});

		_self.element.trigger("opened.bselect", {
			bselect : _self.id,
			obj : _self
		});
	}
	/**
	 * Close Bselect
	 */
	Bselect.prototype.close = function(e) {
		this.log('close');
		if (this.settings.opened) {
			this.element.trigger("close.bselect", {
				bselect : this.id,
				obj : this
			});
			this.content.css("visibility", "hidden");
			this.settings.opened = false;
			$(document).off('click.bselect.document');
			this.element.trigger("closed.bselect", {
				bselect : this.id,
				obj : this
			});
		}
	}
	/**
	 * Toggle bSelect
	 */
	Bselect.prototype.toggle = function(e) {
		this.log('toggle');
		var _self = this;
		_self.element.trigger("toggle.bselect", {
			bselect : _self.id,
			obj : _self
		});

		if (this.settings.opened) {
			this.close(e);

		} else {
			this.open(e);
		}

		_self.element.trigger("toggled.bselect", {
			bselect : _self.id,
			obj : _self
		});

	}
	/**
	 * Prepend new item in bSelect
	 */
	Bselect.prototype.prepend = function(id, name) {
		this.log('prepend');
		this.add("prepend", id, name)
	}
	/**
	 * Append new item in bSelect
	 */
	Bselect.prototype.append = function(id, name) {
		this.log('append');
		this.add("append", id, name)
	}
	/**
	 * Add item to bSelect
	 */
	Bselect.prototype.add = function add(method, id, name) {
		this.log('add');
		
		if (!this.jsonData[id]) {
			this.jsonData[id] = name;
			var option = this.buildOption(id);
			method == "append" ? this.list.append(option) : this.list.prepend(option);
			this.list_items = this.list.children();
			this.bindClick();
			this.element.trigger("updated.bselect", {
				bselect : this.id,
				obj : this
			});
		}

	}
	/**
	 * Select by ID (value of the selectbox)
	 */
	Bselect.prototype.selectById = function(id, doNotTriggerEvents) {
		this.log('selectById');
		var item = this.find(id);
		if (item != undefined) {
			this.select(item, doNotTriggerEvents);
		}

	}
	/**
	 * Find element in list
	 */
	Bselect.prototype.findSelected = function(id) {
		this.log('findSelected');
		var selected = false;
		if (this.selectedItems) {
			if (this.selectedItems) {
				this.selectedItems.filter(function(k, v) {
					if (k == id) {
						selected = true;
						return false;
					}
				});
			}
		}
		return selected;

	}
	/**
	 * Grab selected value / values For single selectbox it will return one
	 * value For multiple selectbox it will return csv of the values
	 */
	Bselect.prototype.getSelected = function() {
		this.log('getSelected');
		return this.selectedItems != null ? this.selectedItems.join(',') : this.selectedItems;
	}
	Bselect.prototype.getDisabled = function() {
		this.log('getDisabled');
		return this.disabledItems != null ? this.disabledItems.join(',') : this.disabledItems;
	}
	/**
	 * Select item
	 */
	Bselect.prototype.select = function(elem, triggerEvents) {
		this.log('select', triggerEvents, elem);
		if (elem.hasClass('bselect-disabled')) {
			return false;
		}
		if (!triggerEvents)
			this.element.trigger("select.bselect", {
				bselect : this.id,
				element : elem,
				obj : this
			});

		this.element.trigger("bselect", {
			bselect : this.id,
			element : elem,
			obj : this
		});

		this.selectElement(elem);

		if (!triggerEvents)
			this.element.trigger("selected.bselect", {
				bselect : this.id,
				element : elem,
				obj : this
			});

		if (this.settings.closeOnSelect) {
			this.close();
		}

	}
	/**
	 * Execute select element logic, append to input field, mark selected item
	 * etc.
	 */
	Bselect.prototype.selectElement = function(elem) {
		
		var id = elem.data('id');
		
		this.log('selectElement', id, elem);
		
		if (this.settings.multiple) {
			// if(this.selectedItems==null || this.selectedItems==''){
			if (this.selectedItems.length == 0) {
				this.active.html('');
			}

			this.active.append(this.addItem(elem));
			this.appendSelectedValue(id);
			this.disable(id);
			// elem.addClass('bselect-disabled');

			// this.doneTyping(this, $(this.searchInput).val());

		} else {

			this.input.val('');
			this.deselectAll();

			this.appendSelectedValue(id);
			this.active.html(this.wrapSelected(elem.children().first().text()));

		}

		this.element.trigger("bselected", {
			bselect : this.id,
			element : elem,
			obj : this
		});
	}
	/**
	 * Remove selected element from the list
	 */
	Bselect.prototype.removeSelected = function(elem) {
		this.log('removeSelected');
		this.removeItem($(elem));
		this.doneTyping(this, $(this.searchInput).val());
		this.element.trigger("unselected.bselect", {
			bselect : this.id,
			element : $(elem),
			obj : this
		});
	}

	/**
	 * Check is element disabled
	 */
	Bselect.prototype.disabled = function(id) {
		this.log('disabled');
		var item = this.find(id);
		return (item) ? item.hasClass('bselect-disabled') : false;
	}
	/**
	 * Check is element disabled
	 */
	Bselect.prototype.selected = function(id) {
		this.log('selected');
		return this.findSelected(id);
	}

	/**
	 * Add item (html) for multiple select box
	 */
	Bselect.prototype.addItem = function(elem) {
		this.log('addItem');
		return '<div class="bselect-multiple-item" id="bselect-multiple-'
				+ elem.data('id') + '" data-id="' + elem.data('id') + '">'
				+ elem.children().first().text() + ' <div class="bselect-remove" data-id="'
				+ elem.data('id') + '">X</div></div>';
	}
	/**
	 * Remove item compleatley
	 */
	Bselect.prototype.remove = function(id) {
		this.log('remove');
		if(this.jsonData[id]){
			this.elem.find(".bselect-list li[data-id='" + id + "']").remove();
			this.list_items = this.list.children();
			delete(this.jsonData[id]);
		}
	}
	/**
	 * Remove item called on click of the X button
	 */
	Bselect.prototype.removeItem = function(elem) {
		this.log('removeItem');
		var id = elem.data('id');
		this.removeSelectedValue(id);
		this.enable(id);
		elem.parent().remove();
		// if(this.selectedItems=='' || this.selectedItems==null){
		if (this.selectedItems.length == 0) {
			this.active.html(this.wrapSelected(this.settings.defaultText));
		}
	}
	/**
	 * Remove selected value from the input field
	 */
	Bselect.prototype.removeSelectedValue = function(value) {
		this.log('removeSelectedValue');
		var v = this.input.val();
		v = v.split(',');
		this.selectedItems = this.removeA(v, value.toString());
		this.input.val(this.selectedItems.join(','));
	}
	/**
	 * Remove item from array bu value
	 */
	Bselect.prototype.removeA = function(arr) {
		this.log('removeA');
		if (!arr || arr.length == undefined) {
			return arr;
		}
		var what, a = arguments, L = a.length, ax;
		while (L > 1 && arr.length) {
			what = a[--L];
			while ((ax = arr.indexOf(what)) !== -1) {
				arr.splice(ax, 1);
			}
		}
		return arr;
	}
	/**
	 * Append selected value to the input field csv
	 */
	Bselect.prototype.appendSelectedValue = function(value) {
		this.log('appendSelectedValue');
		var v = this.input.val();
		if (v != "") {
			v = v.split(',');
		} else {
			v = [];
		}
		for ( var i in v) {
			if (v[i] == value) {
				console.warn('Item value already exists');
				return false;
			}
		}
		v.push(value);
		this.selectedItems = v; // v.join(',');
		this.input.val(this.selectedItems.join(','));

	}
	/**
	 * Build single option
	 */
	Bselect.prototype.buildOption = function(id) {
		this.log('buildOption');
		// disabled = (this.selected(id) || this.disabled(id) ||
		// this.disabledItems.includes(id)) ? ' bselect-disabled' : '';
		disabled = (this.selectedItems.includes(id) || this.disabledItems.includes(id)) ? ' bselect-disabled' : '';
		remove = '';
		if(this.settings.removeItemsButton){
			remove = "<div class='bselect-remove' data-id='"+id+"'>X</div>";
		}
		
		return "<li data-id='" + id + "' class='bselect-item " + this.elipsis
				+ disabled + "'><div class='bselect-text'>" + this.jsonData[id] + "</div>"+remove+"</li>";
	}
	/**
	 * Done search typing
	 */
	Bselect.prototype.doneTyping = function(_self, searchInputValue) {
		this.log('doneTyping start');
		var results = '';
		//_self.list_items.addClass('hidden');
		var t = 1;
		for ( var i in _self.jsonData) {
			if (_self.settings.search == false || _self.jsonData[i].toLowerCase().indexOf(searchInputValue.toLowerCase()) !== -1) {
				if(t<=_self.settings.preview){
					results += _self.buildOption(i);
					t++;
				}else{
					break;
				}
			}

		}
		if (results == '') {
			 results = '<div class="bselect-no-results">No results.</div>';
		}
		_self.list.html(results);
		_self.bindClick();
		this.log('doneTyping end');
	}
	/**
	 * Disable selecting item by id/value
	 */
	Bselect.prototype.disable = function(id) {
		var item = this.find(id);
		this.log('disable', id, item);
		if (item) {
			this.disabledItems = this.removeA(this.disabledItems, id);
			this.disabledItems.push(id.toString());
			item.addClass('bselect-disabled');
		}
	}
	/**
	 * Enable selecting item by id/value
	 */
	Bselect.prototype.enable = function(id) {
		this.log('enable');
		var item = this.find(id);
		if (item && !this.findSelected(id)) {
			this.disabledItems = this
					.removeA(this.disabledItems, id.toString());
			item.removeClass('bselect-disabled');
		}
	}
	/**
	 * Enable all
	 */
	Bselect.prototype.enableAll = function() {
		this.log('enableAll');
		//this.list_items = $('#'+this.id).find('.bselect-list').children();
		var _self = this;
		this.list.children().each(function(k, v) {
			// $(v).removeClass('bselect-disabled');
			_self.enable($(v).data('id'))
		})
	}
	/**
	 * Disable all
	 */
	Bselect.prototype.disableAll = function() {
		this.log('disableAll');
		// this.list_items = $('#'+this.id).find('.bselect-list').children();
		var _self = this;
		this.list.children().each(function(k, v) {
			_self.disable($(v).data('id'))
		})
	}

	/*
	 * Select all data by puting this.jsonData to hidden input in csv format
	 */
	Bselect.prototype.selectAll = function() {
		this.log('selectAll');
		if (this.settings.multiple) {
			// this.list_items =
			// $('#'+this.id).find('.bselect-list').children();
			var _self = this;
			$.each(this.list.children(), function(key, val) {
				if (!$(val).hasClass('bselect-disabled')) {

					_self.select($(val))
				}
			});
		}

	}

	/*
	 * Remove all data from hidden input
	 */
	Bselect.prototype.removeAll = function() {
		this.log('removeAll');
		this.deselectAll();

	}
	/*
	 * Deselect all data from hidden input
	 */
	Bselect.prototype.deselectAll = function() {
		this.log('deselectAll');
		if (this.selectedItems) {

			var selected = this.selectedItems; // .split(',');
			var _self = this;

			if (this.settings.multiple) {

				$.each(selected,
						function(index, id) {
							_self.removeSelected($('#' + _self.id
									+ ' #bselect-multiple-' + id
									+ ' .bselect-remove'));
						});
			} else {
				var selected = this.selectedItems; // .split(',');
				$.each(selected, function(index, id) {
					_self.deselect(_self.find(id));
				});
			}
		}

	}

	Bselect.prototype.deselect = function(elem, doNotTriggerEvents) {
		this.log('deselect');
		if (typeof elem != 'object') {
			elem = this.find(elem);
		}
		if (elem != null) {
			var id = elem.data('id');
			this.removeSelectedValue(id);
			this.enable(id);
		}
	}
	/**
	 * Find element in list
	 */
	Bselect.prototype.find = function(id) {
		this.log('find');
		// regrab new list_items
		//this.list_items = $('#'+this.id).find('.bselect-list').children();
		this.list_items = this.list.children();
		var item = null;
		if (this.list_items) {
			this.list_items.filter(function() {
				if ($(this).data('id') == id) {
					item = $(this);
					return false;
				}
			});
		}
		return item;

	}
	/**
	 * On item click
	 */
	Bselect.prototype.bindClick = function() {
		this.log('bindClick');
		var _self = this;
		this.list.children().off('click.bselect.click').on(
				'click.bselect.click', function(e) {
					if($(e.target).hasClass('bselect-remove')){
						_self.removeSelected(e.target);
					}else{
						_self.select($(this));
					}
				});
	}
	/**
	 * Bind necessary events
	 */
	Bselect.prototype.bind_events = function() {
		this.log('bind_events');
		var _self = this;

		// Open/Close
		$(this.active).on(
				'mousedown.bselect.open',
				function(e) {
					if ($(e.target).hasClass('bselect-remove')
							&& _self.settings.multiple) {
						_self.removeSelected(e.target);
					} else {
						_self.toggle(e);
					}
				});

		// Click item in list
		this.bindClick();

		// Search
		$(this.searchInput).on('keyup', function(event) {
			_self.log('keyup');
			// clearTimeout(_self.typingTimer);
			var searchInputValue = $(this).val();
			// _self.typingTimer = setTimeout(_self.doneTyping,
			// _self.doneTypingInterval,_self, searchInputValue);
			_self.doneTyping(_self, searchInputValue);

		});
		// $(this.searchInput).on('keydown', function () {
		// clearTimeout(_self.typingTimer);
		// });

	}

	$.fn.bselect = function() {

		var args = arguments, option = args[0];

		if (typeof option == 'string') {

			var data = $(this).data('bselect'), params = Array.prototype.slice
					.call(args, 1);
			return data[option].apply(data, params);

		}

		this.each(function() {

			var $this = $(this), data = $this.data('bselect'), id = $(this)
					.attr('id');

			if (typeof option == 'object') {
				$this.data('bselect', (data = new Bselect($this, option)));
				if (window['bselect'] == undefined) {
					window['bselect'] = [];
				}
				if (window['bselect'][id] == undefined) {

					window['bselect'][id] = data;
				}
			}

		});

	};

}(jQuery));