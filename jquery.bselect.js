(function ( $ ) {
	
	var Bselect = function(element, options){
		
		this.defaultSettings = {
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
				focusDelay : 100, //ms
				doneTypingInterval : 180 //ms
		};
		this.settings = $.extend(this.defaultSettings, options);
		this.element = element;
		this.selectedItems = []; //null;
		this.disabledItems = [];
		this.elipsis = this.settings.elipsis ? 'elipsis' : '';
		this.searchInputValue = "";
		this.jsonData = this.settings.data ? this.settings.data : null;
		this.id = $(element).attr('id');
		this.typingTimer = null;
		this.build();
	}
	/**
	 * Start building Bselect, create html template and bind events
	 */
	Bselect.prototype.build = function(){
		this.build_template();
		this.bind_events();
	}
	/**
	 * Build HTML template
	 */
	Bselect.prototype.build_template = function(){
		
		var template = '<div class="bselect '+this.settings.className+'" id="'+this.id+'-bselect">';
		
		template += this.settings.input!=undefined ? this.settings.search : "<input type='hidden' name='"+this.settings.inputName+"' value='' class='bselect-input' />";
		
		var elipsis = this.settings.multiple ? '' : 'elipsis';
		
		template += "<div class='bselect-active "+elipsis+"'>"+this.wrapSelected(this.settings.defaultText)+"</div>";
		
			template += "<div class='bselect-content'>"
		
				if(this.settings.search){
					
					template += "<div class='bselect-search'><input type='text' name='s' placeholder='Search...' autocomplete='off'/></div>";
				}
				if(this.jsonData){
					
					template += "<ul class='bselect-list'>";
					
					for(var i in this.jsonData){
						template += this.buildOption(i);
					}
					
					template +="</ul>";
					
				}
		
			template +="</div>";
		template +="</div>";
		
		var elem = $('#'+this.id);
		
		elem.html(template);
		
		this.bselect = elem.find('.bselect');
		this.active = elem.find('.bselect-active');
		this.search = elem.find('.bselect-search');
		this.searchInput = this.search.find('input');
		this.content = elem.find('.bselect-content');
		this.input = elem.find('.bselect-input');
		this.list = elem.find('.bselect-list');
		this.list_items = this.list.children();
		
		//var width = this.settings.width!=undefined ? this.settings.width : $(this.bselect).width();

		this.bselect.css('width', this.settings.width);
		var width = $(this.bselect).width();
		$(this.content).css('width', width);
		
		//Preselect values
		if(this.settings.selected){
			
			if($.isArray(this.settings.selected)){
				var _self = this;
				$.each(this.settings.selected, function(key, val){
					_self.selectById(val, false);
				});
				
			}else{
				this.selectById(this.settings.selected);
			}
		}
		
		
	}
	Bselect.prototype.isElementInViewport = function() {

	    var rect = this.content[0].getBoundingClientRect();

	    return (
	        rect.top >= 0 &&
	        rect.left >= 0 &&
	        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
	        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
	    );
	}
	Bselect.prototype.wrapSelected = function(text){
		return "<div class='bselect-default-text'>"+text+"</div>";
	}
	
	/**
	 * Check Promise to prevent UI block
	 */
	Bselect.prototype.promise = function(delay){

		return new Promise(function(resolve, reject) { 
		
			if(delay){
				setTimeout(function(){resolve()}, delay);
			}else{
				resolve();
			}
			
		});
	}
	/**
	 * Open Bselect
	 */
	Bselect.prototype.open = function(e){
		
		var _self = this;
		_self.element.trigger("open.bselect", {bselect : _self.id, obj : _self});
		_self.content.css("display","block");
		
		if(_self.settings.checkInView && !_self.isElementInViewport()){
			_self.content.css("top","-"+($(_self.content).height()+1)+'px');
		}
		_self.settings.opened = true;
		_self.promise(_self.settings.focusDelay).then(function(){
			_self.searchInput.focus();
		});
		$(document).on('click.bselect.document', function(evnt){
			if(!jQuery.contains(_self.element[0], evnt.target) && e!=undefined){
				_self.close(); 
			}
		});
		
		_self.element.trigger("opened.bselect", {bselect : _self.id, obj : _self});
	}
	/**
	 * Close Bselect
	 */
	Bselect.prototype.close = function(e){

		if(this.settings.opened){
			
			this.element.trigger("close.bselect", {bselect : this.id, obj : this});
			
			this.content.css("display","none");
			var _self = this;
			
			_self.promise().then(function(){
				
				_self.settings.opened = false;
				_self.searchInput.val("");
				_self.doneTyping(_self, "");
				$(document).off('click.bselect.document');
				
			})
			
			
			this.element.trigger("closed.bselect", {bselect : this.id, obj : this});
		}
	}
	/**
	 * Toggle bSelect
	 */
	Bselect.prototype.toggle = function(e){
		
		var _self = this;
		_self.element.trigger("toggle.bselect", {bselect : _self.id, obj : _self});
		
		if(this.settings.opened){
			this.close(e);
			
		}else{
			this.open(e);  
		}
		
		_self.element.trigger("toggled.bselect", {bselect : _self.id, obj : _self});
		
	}
	/**
	 * Prepend new item in bSelect
	 */
	Bselect.prototype.prepend = function(id, name){
		
		this.add("prepend", id, name)
	}
	/**
	 * Append new item in bSelect
	 */
	Bselect.prototype.append = function(id, name){
		
		this.add("append", id, name)
	}
	/**
	 * Add item to bSelect
	 */
	Bselect.prototype.add = function add(method, id, name){
		
		if(this.jsonData[id]==undefined){
			this.jsonData[id] = name;
			var option = this.buildOption(id);
			method=="append" ? this.list.append(option) : this.list.prepend(option);
			this.list_items = this.list.children();
			this.bindClick();
			this.element.trigger("updated.bselect", {bselect : this.id, obj : this});
		}
	}
	/**
	 * Select by ID (value of the selectbox)
	 */
	Bselect.prototype.selectById = function(id, doNotTriggerEvents){
		
		var item = this.find(id);
		if(item!=undefined){
			this.select(item, doNotTriggerEvents);
		}
		
	}
	/**
	 * Find element in list
	 */
	Bselect.prototype.findSelected = function(id){
		
		var selected = false;
		if(this.selectedItems){
			if(this.selectedItems){
				this.selectedItems.filter(function(k,v){
					if(k==id){
						selected =  true;
						return false;
					}
				});
			}
		}
		return selected;
		
	}
	/**
	 * Grab selected value / values
	 * For single selectbox it will return one value
	 * For multiple selectbox it will return csv of the values
	 */
	Bselect.prototype.getSelected = function(){
		
		//return this.selectedItems;
		return this.selectedItems!=null ? this.selectedItems.join(',') : this.selectedItems;
	}
	Bselect.prototype.getDisabled = function(){
		
		return this.disabledItems!=null ? this.disabledItems.join(',') : this.disabledItems;
	}
	/**
	 * Select item
	 */
	Bselect.prototype.select = function(elem, doNotTriggerEvents){
				
		if(elem.hasClass('bselect-disabled')){
			return false;
		}
		
		if(!doNotTriggerEvents)
			this.element.trigger("select.bselect", {bselect : this.id, element : elem, obj : this});
		
		this.selectElement(elem);
		
		if(this.settings.closeOnSelect){
			this.close();
		}
		
		if(!doNotTriggerEvents)
			this.element.trigger("selected.bselect", {bselect : this.id, element : elem, obj : this});
		
	}
	/**
	 * Execute select element logic, append to input field, mark selected item etc.
	 */
	Bselect.prototype.selectElement = function(elem){
		
		console.log('selectElement', elem)
		var id = elem.data('id');
		if(this.settings.multiple){
			//if(this.selectedItems==null || this.selectedItems==''){
			if(this.selectedItems.length==0){
				this.active.html('');
			}

			this.active.append(this.addItem(elem));
			this.appendSelectedValue(id);
			this.disable(id);
			//elem.addClass('bselect-disabled');
			
			//this.doneTyping(this, $(this.searchInput).val());
			
		}else{
			
			this.input.val('');
			this.deselectAll();
			
			this.appendSelectedValue(id);
			this.active.html(this.wrapSelected(elem.text()));
		
		}
		
		
	}
	/**
	 * Remove selected element from the list
	 */
	Bselect.prototype.removeSelected = function(elem){
		
		this.removeItem($(elem));
		this.doneTyping(this, $(this.searchInput).val());
		this.element.trigger("unseleced.bselect", {bselect : this.id, element : elem, obj : this});
	}
	
	/**
	 * Check is element disabled
	 */
	Bselect.prototype.disabled = function(id){
		var item = this.find(id);
		return (item) ? item.hasClass('bselect-disabled') : false;
	}
	/**
	 * Check is element disabled
	 */
	Bselect.prototype.selected = function(id){
		return this.findSelected(id);
	}
	
	/**
	 * Add item (html) for multiple select box
	 */
	Bselect.prototype.addItem = function(elem){
		return '<div class="bselect-multiple-item" id="bselect-multiple-'+elem.data('id')+'" data-id="'+elem.data('id')+'">'+elem.text()+' <div class="bselect-remove" data-id="'+elem.data('id')+'">X</div></div>';
	}
	/**
	 * Remove item called on click of the X button
	 */
	Bselect.prototype.removeItem = function(elem){
	
		var id = elem.data('id');
		this.removeSelectedValue(id);
		this.enable(id);
		elem.parent().remove();
		//if(this.selectedItems=='' || this.selectedItems==null){
		if(this.selectedItems.length==0){
			this.active.html(this.wrapSelected(this.settings.defaultText));
		}
	}
	/**
	 * Remove selected value from the input field
	 */
	Bselect.prototype.removeSelectedValue = function(value){
		var v = this.input.val();
		v = v.split(',');
		this.selectedItems = this.removeA(v, value.toString());
		this.input.val(this.selectedItems.join(','));
	}
	/**
	 * Remove item from array bu value
	 */
	Bselect.prototype.removeA = function(arr){
		if(!arr || arr.length==undefined){
			return arr;
		}
		var what, a = arguments, L = a.length, ax;
	    while (L > 1 && arr.length) {
	        what = a[--L];
	        while ((ax= arr.indexOf(what)) !== -1) {
	            arr.splice(ax, 1);
	        }
	    }
	    return arr;
	}
	/**
	 * Append selected value to the input field csv
	 */
	Bselect.prototype.appendSelectedValue = function(value){
		
		var v = this.input.val();
		if(v!=""){
			v = v.split(',');
		}else{
			v = [];
		}
		for(var i in v){
			if(v[i]==value){
				console.warn('Item value already exists');
				return false;
			}
		}
		v.push(value);
		this.selectedItems = v; //v.join(',');
		this.input.val(this.selectedItems.join(','));
		
	}
	/**
	 * Build single option
	 */
	Bselect.prototype.buildOption = function(id){
		
		//disabled = (this.selected(id) || this.disabled(id) || this.disabledItems.includes(id)) ? ' bselect-disabled' : '';
		disabled = (this.selectedItems.includes(id) || this.disabledItems.includes(id)) ? ' bselect-disabled' : '';
		return "<li data-id='"+id+"' class='bselect-item "+this.elipsis+disabled+"'>"+this.jsonData[id]+"</li>";
	}
	/**
	 * Done search typing
	 */
	Bselect.prototype.doneTyping = function(_self, searchInputValue){
		
		 var results = '';
		 for(var i in _self.jsonData){


			  if (_self.settings.search==false || _self.jsonData[i].toLowerCase().indexOf(searchInputValue.toLowerCase()) !== -1) {

		            results += _self.buildOption(i);
		        }

		  }
		 if(results==''){
			 results = '<div class="bselect-no-results">No results.</div>';
		 }
		 	
		 _self.list.html(results);
		 _self.bindClick();
		 
		
	}
	/**
	 * Disable selecting item by id/value
	 */
	Bselect.prototype.disable = function(id){
		
		var item = this.find(id);
		if(item){
			this.disabledItems = this.removeA(this.disabledItems, id);
			this.disabledItems.push(id.toString());
			item.addClass('bselect-disabled');
		}
	}
	/**
	 * Enable selecting item by id/value
	 */
	Bselect.prototype.enable = function(id){
		var item = this.find(id);
		if(item && !this.findSelected(id)){
			this.disabledItems = this.removeA(this.disabledItems, id.toString());
			item.removeClass('bselect-disabled');
		}
	}
	/**
	 * Enable all
	 */
	Bselect.prototype.enableAll = function(){
		this.list_items = $('#'+this.id).find('.bselect-list').children();
		var _self = this;
		this.list_items.each(function(k,v){
			//$(v).removeClass('bselect-disabled');
			_self.enable($(v).data('id'))
		})
	}
	/**
	 * Disable all
	 */
	Bselect.prototype.disableAll = function(){
		this.list_items = $('#'+this.id).find('.bselect-list').children();
		var _self = this;
		this.list_items.each(function(k,v){
			_self.disable($(v).data('id'))
		})
	}

	/*
	 * Select all data by puting this.jsonData to hidden input in csv format
	 */
	Bselect.prototype.selectAll = function(){
		
		if(this.settings.multiple){
			this.list_items = $('#'+this.id).find('.bselect-list').children();
			var _self = this;
			$.each(this.list_items, function (key, val) {
				if(!$(val).hasClass('bselect-disabled')){
					
					_self.select($(val))
				}
		    });
		}
		
	}
	
	/*
	 * Remove all data from hidden input
	 */
	Bselect.prototype.removeAll = function(){
		
		this.deselectAll();
		
	}
	/*
	 * Deselect all data from hidden input
	 */
	Bselect.prototype.deselectAll = function(){
		
		if(this.selectedItems){
			
			var selected = this.selectedItems; //.split(',');
			var _self = this;
			
			if(this.settings.multiple){
				
				$.each(selected, function( index, id ){
					_self.removeSelected($('#'+_self.id + ' #bselect-multiple-'+id + ' .bselect-remove'));
				});
			}else{
				var selected = this.selectedItems; //.split(',');
				$.each(selected, function( index, id ){
					_self.deselect(_self.find(id));
				});
			}
		}
		
	}
	
	Bselect.prototype.deselect = function(elem, doNotTriggerEvents){
		
		if(typeof elem != 'object'){
			elem = this.find(elem);
		}
		if(elem != null){
			var id = elem.data('id');
			this.removeSelectedValue(id);
			this.enable(id);
		}
	}
	/**
	 * Find element in list
	 */
	Bselect.prototype.find = function(id){
		//regrab new list_items
		this.list_items = $('#'+this.id).find('.bselect-list').children();
		var item = null;
		if(this.list_items){
			this.list_items.filter(function(){
				if($(this).data('id')==id){
					item =  $(this);
					return false;
				}
			});
		}
		return item;
		
	}
	/**
	 * On item click
	 */
	Bselect.prototype.bindClick = function(){
		
		var _self = this;
		this.list.children().off('click.bselect.click').on('click.bselect.click', function(e){
			_self.select($(this));
		});
	}
	/**
	 * Bind necessary events
	 */
	Bselect.prototype.bind_events = function(){
		
		var _self = this;
		
		//Open/Close
		$(this.active).on('mousedown.bselect.open', function(e){
			if($(e.target).hasClass('bselect-remove') && _self.settings.multiple){
				_self.removeSelected(e.target);
			}else{
				_self.toggle(e);
			}
		});
		
		//Click item in list
		this.bindClick();
		
		//Search
		$(this.searchInput).on('keyup', function(event) {
			clearTimeout(_self.typingTimer);
			var searchInputValue = $(this).val();
			 _self.typingTimer = setTimeout(_self.doneTyping, _self.doneTypingInterval,_self, searchInputValue);
			  
		});
		$(this.searchInput).on('keydown', function () {
			  clearTimeout(_self.typingTimer);
		});
		
		
	}
	
	
	 $.fn.bselect = function() {
		 
		 var args = arguments, option = args[0];

		 if (typeof option == 'string') {
			
			var data = $(this).data('bselect'), params = Array.prototype.slice.call(args, 1);
			return data[option].apply(data, params);
					
		 }
		 
		 this.each(function() {
			 	
			 var $this = $(this), data = $this.data('bselect'), id = $(this).attr('id');
			 
				if (typeof option == 'object') {
					$this.data('bselect', (data = new Bselect($this, option)));
					if(window['bselect']==undefined){
						window['bselect'] = [];
					}
					if(window['bselect'][id]==undefined){
		        		
						window['bselect'][id] = data;
		        	}
				}
				
				
			
			});
		
		};
	
 
}( jQuery ));
