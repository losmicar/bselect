# Bselect - jQuery Select Plugin

jQuery Select Plugin - Alternative to Chozen Jquery Plugin

## Getting Started

Bselect is a plugin that builds custom HTML selectbox with search and inpouts selected value into the input field for further use. To implement please see demo.html page.

### Prerequisites

jQuery 2.X


## How to implement


### Basic example

```
<div id="custom-select"></div>
<script>
$('#custom-select').bselect({
		data : {1 : "Belgrade", 2 : "New York", 3 : "Viena", 4 : "Budapest"}, 
		search : true, 
		width : '200px',
		defaultText : "Select..."
	});
</script>
```

### Events supported

```
	//Open started
	$('#custom-select-search-events').on('open.bselect', function(e,params){
		...
	});

	//Open finished (After open)
	$('#custom-select-search-events').on('opened.bselect', function(e,params){
		...
	});

	//Close triggered
	$('#custom-select-search-events').on('close.bselect', function(e,params){
		...
	});

	//Close finished (After close)
	$('#custom-select-search-events').on('closed.bselect', function(e,params){
		...
	});
	
	//Toggle started
	$('#custom-select-search-events').on('toggle.bselect', function(e,params){
		...
	});

	//Toggle finished
	$('#custom-select-search-events').on('toggled.bselect', function(e,params){
		...
	});

	//Item selected
	$('#custom-select-search-events').on('select.bselect', function(e,params){
		
		...  params.element.data('id')  .... params.element.text()
	});
```

### Methods supported

```
	//Open selectbox
	$('#select-box').bselect("open");

	//Close selectbox
	$('#select-box').bselect("close");
	
	//Toggle
	$('#select-box').bselect("toggle");
	
	//Set selected value
	$('#select-box').bselect("selectById", 2);

	//Get selected value
	$('#select-box').bselect("getSelected")

```

### Options supported

```
$('#select-box-preselect').bselect({
				data : {1 : "Belgrade", 2 : "New York", 3 : "Viena", 4 : "Budapest"}, 
				search : true, 
				width : "200px",
				defaultText : "Select me",
				className : "", //Append custom class name
				inputName : "bselect-input", //Name of the hidden input
				selected : 0,	//Pre select value
				closeOnSelect : true,
				elipsis : true,
				focusDelay : 100, //ms
				doneTypingInterval : 180 //ms
			});
```

