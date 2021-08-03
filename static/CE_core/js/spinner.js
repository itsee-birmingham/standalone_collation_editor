/*jshint esversion: 6 */
spinner = (function() {
  "use strict";

  var showLoadingOverlay, removeLoadingOverlay;

  showLoadingOverlay = function(message) {
    var overlay, messageDiv, spinnerDiv;
    if (!document.getElementById('overlay')) {
      overlay = document.createElement('div');
      overlay.id = 'overlay';
      messageDiv = document.createElement('div');
      messageDiv.id = 'overlay_message';
      if (typeof message !== 'undefined') {
        messageDiv.innerHTML = '<p class="center">' + message + '</p>';
      }
      spinnerDiv = document.createElement('div');
      spinnerDiv.id = 'spinner';
      spinnerDiv.innerHTML = '<span class="flower-12l-48x48" />';

      overlay.appendChild(messageDiv);
      overlay.appendChild(spinnerDiv);
      document.getElementsByTagName('body')[0].appendChild(overlay);
    }
  };

  removeLoadingOverlay = function() {
    if (document.getElementById('overlay')) {
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('overlay'));
    }
    if (document.getElementById('overlay_message')) {
      document.getElementsByTagName('body')[0].removeChild(document.getElementById('overlay_message'));
    }
  };

  return {
    showLoadingOverlay: showLoadingOverlay,
    removeLoadingOverlay: removeLoadingOverlay
  };

}());
