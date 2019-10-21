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
		this.selected = null;
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
	 * Build single option
	 */
	Bselect.prototype.buildOption = function(id){
		
		return "<li data-id='"+id+"' class='bselect-item "+this.elipsis+"'>"+this.jsonData[id]+"</li>";
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
	Bselect.prototype.find = function(id){
		
		var item = null;
		this.list_items.filter(function(){
			
			if($(this).data('id')==id){
				item =  $(this);
				return false;
			}
		});
		return item;
		
	}
	/**
	 * Grab selected value / values
	 * For single selectbox it will return one value
	 * For multiple selectbox it will return csv of the values
	 */
	Bselect.prototype.getSelected = function(){
		
		return this.selected;
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
		
		if(this.settings.multiple){
			if(this.selected==null || this.selected==''){
				this.active.html('');
			}
			var id = elem.data('id');
			this.active.append(this.addItem(elem));
			this.appendSelectedValue(id);
			elem.addClass('bselect-disabled');
			
		}else{
			this.selected = elem.data('id');
			this.input.val(this.selected);
			this.active.html(this.wrapSelected(elem.text()));
		}
		
	}
	/**
	 * Remove selected element from the list
	 */
	Bselect.prototype.removeSelected = function(elem){
		
		this.removeItem($(elem));
		
		this.element.trigger("unseleced.bselect", {bselect : this.id, element : elem, obj : this});
	}
	/**
	 * Disable selecting item by id/value
	 */
	Bselect.prototype.disable = function(id){
		var item = this.find(id);
		if(item){
			item.addClass('bselect-disabled');
		}
	}
	/**
	 * Enable selecting item by id/value
	 */
	Bselect.prototype.enable = function(id){
		var item = this.find(id);
		if(item){
			item.removeClass('bselect-disabled');
		}
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
		this.enable(id)
		elem.parent().remove();
		if(this.selected=='' || this.selected==null){
			this.active.html(this.wrapSelected(this.settings.defaultText));
		}
	}
	/**
	 * Remove selected value from the input field
	 */
	Bselect.prototype.removeSelectedValue = function(value){
		var v = this.input.val();
		v = v.split(',');
		v = this.removeA(v, value.toString());
		this.selected = v.join(',');
		this.input.val(this.selected);
	}
	/**
	 * Remove item from array bu value
	 */
	Bselect.prototype.removeA = function(arr){
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
		v.push(value);
		this.selected = v.join(',');
		this.input.val(this.selected);
		
	}
	/**
	 * Done search typing
	 */
	Bselect.prototype.doneTyping = function(_self, searchInputValue){
		
		if(searchInputValue==""){
			_self.list_items.css('display', 'block');
		}else{
		
			_self.list_items.each(function(k,v){
				
				if($(v).text().toLowerCase().indexOf(searchInputValue.toLowerCase())!==-1){
					$(v).css('display', 'block');
				}else{
					$(v).css('display', 'none');
				}
			});
		}
		
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
