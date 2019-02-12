
var SPN = (function () {

	//TODO: consider updating spin.js or moving to something else
    return {
	

	_spinner: null,

     show_loading_overlay: function (message) {
	 var overlay, opts, target, message_el;
	 if (!document.getElementById('overlay')) {
	     overlay = document.createElement('div');
	     overlay.id = 'overlay';
	     message_el = document.createElement('div');
	     message_el.id = 'overlay_message';
	     if (typeof message !== 'undefined') {
		 message_el.innerHTML = '<p class="center">' + message + '</p>';
	     }
	     document.getElementsByTagName('body')[0].appendChild(overlay);
	     document.getElementsByTagName('body')[0].appendChild(message_el);
	     opts = {
		     lines: 13, // The number of lines to draw
		     length: 20, // The length of each line
		     width: 10, // The line thickness
		     radius: 30, // The radius of the inner circle
		     corners: 1, // Corner roundness (0..1)
		     rotate: 0, // The rotation offset
		     direction: 1, // 1: clockwise, -1: counterclockwise
		     color: '#000', // #rgb or #rrggbb or array of colors
		     speed: 1, // Rounds per second
		     trail: 60, // Afterglow percentage
		     shadow: false, // Whether to render a shadow
		     hwaccel: false, // Whether to use hardware acceleration
		     className: 'spinner', // The CSS class to assign to the spinner
		     zIndex: 2e9, // The z-index (defaults to 2000000000)
		     top: '50%', // Top position relative to parent
		     left: '50%' // Left position relative to parent
	     };
	     target = document.getElementsByTagName('body')[0];
	     CL._spinner = new Spinner(opts).spin(target);
	 }
	 return;
     },

     remove_loading_overlay: function () {
	 CL._spinner.stop();
	 if (document.getElementById('overlay')) {
	     document.getElementsByTagName('body')[0].removeChild(document.getElementById('overlay'));
	 }
	 if (document.getElementById('overlay_message')) {
	     document.getElementsByTagName('body')[0].removeChild(document.getElementById('overlay_message'));
	 }
	 return;
     },


    };

}());
