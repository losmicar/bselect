(function ( $ ) {
	
	var Bselect = function(element, options){
		
		this.defaultSettings = {
				search : true,
				width : "200px",
				defaultText : "Select me",
				className : "",
				inputName : "bselect-input",
				selected : 0,
				opened : false,
				closeOnSelect : true,
				elipsis : true,
				focusDelay : 100, //ms
				doneTypingInterval : 180 //ms
		};
		this.settings = $.extend(this.defaultSettings, options);
		this.element = element;
		this.selected = 0;
		this.elipsis = this.settings.elipsis ? 'elipsis' : '';
		this.searchInputValue = "";
		this.jsonData = this.settings.data ? this.settings.data : null;
		this.id = $(element).attr('id');
		this.typingTimer = null;
		this.build();
	}
	
	Bselect.prototype.build = function(){
		this.build_template();
		this.bind_events();
	}
	
	Bselect.prototype.build_template = function(){
		
		var template = '<div class="bselect '+this.settings.className+'" id="'+this.id+'-bselect">';
		
		template += this.settings.input!=undefined ? this.settings.search : "<input type='hidden' name='"+this.settings.inputName+"' value='' class='bselect-input' />";
		
		template += "<div class='bselect-active elipsis'>"+this.settings.defaultText+"</div>";
		
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

		if(this.settings.selected){
			this.selected = this.settings.selected;
			this.selectById(this.settings.selected);
		}
		
		
	}
	
	Bselect.prototype.buildOption = function(id){
		
		return "<li data-id='"+id+"' class='bselect-item "+this.elipsis+"'>"+this.jsonData[id]+"</li>";
	}
	
	Bselect.prototype.promise = function(delay){

		return new Promise(function(resolve, reject) { 
		
			if(delay){
				setTimeout(function(){resolve()}, delay);
			}else{
				resolve();
			}
			
		});
	}
	Bselect.prototype.open = function(e){
		
		var _self = this;

		

		_self.element.trigger("open.bselect", {bselect : _self.id, obj : _self});
		
		_self.content.css("display","block");
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
	Bselect.prototype.close = function(e){

		console.log('close event', this);

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

	Bselect.prototype.prepend = function(id, name){
		
		this.add("prepend", id, name)
	}

	Bselect.prototype.append = function(id, name){
		
		this.add("append", id, name)
	}
	Bselect.prototype.add = function add(method, id, name){
		
		this.jsonData[id] = name;
		var option = this.buildOption(id);
		method=="append" ? this.list.append(option) : this.list.prepend(option);
		this.list_items = this.list.children();
		this.bindClick();
	}
	Bselect.prototype.selectById = function(id, doNotTriggerEvents){
		
		var item = null;
		
		this.list_items.filter(function(){
			
			if($(this).data('id')==id){
				item =  $(this);
				return false;
			}
		});
		
		
		if(item!=undefined){
			this.select(item, doNotTriggerEvents);
		}
		
	}
	Bselect.prototype.getSelected = function(){
		
		console.log('get Selected', this, this.selected);

		return this.selected;
	}
	Bselect.prototype.select = function(elem, doNotTriggerEvents){
		
		
		if(!doNotTriggerEvents)
			this.element.trigger("select.bselect", {bselect : this.id, element : elem, obj : this});
		
		this.selected = elem.data('id');

		this.input.val(this.selected);
		
		this.active.html(elem.text());
		
		if(this.settings.closeOnSelect){
			this.close();
		}
		
		if(!doNotTriggerEvents)
			this.element.trigger("selected.bselect", {bselect : this.id, element : elem, obj : this});
		
	}
	Bselect.prototype.doneTyping = function(_self, searchInputValue){
		
		  var results = '';
		  for(var i in _self.jsonData){
			  
			  
			  if (_self.jsonData[i].toLowerCase().indexOf(searchInputValue) !== -1) {
		            
		            results += _self.buildOption(i);
		        }
			  
		  }
		 if(results==''){
			 results = '<div class="bselect-no-results">No results.</div>';
		 }
		  _self.list.html(results);
		  _self.bindClick();
		
	}
	Bselect.prototype.bindClick = function(){
		
		var _self = this;
		
		this.list.children().off('click.bselect.click').on('click.bselect.click', function(e){
			
			_self.select($(this));
			
		});
	}
	Bselect.prototype.bind_events = function(){
		
		var _self = this;
		
		//Open/Close
		$(this.active).on('mousedown.bselect.open', function(e){
			_self.toggle(e);
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