spinner = (function () {

  showLoadingOverlay = function(message) {
    if (!document.getElementById('overlay')) {
      overlay = document.createElement('div');
      overlay.id = 'overlay';
      message_div = document.createElement('div');
      message_div.id = 'overlay_message';
      if (typeof message !== 'undefined') {
        message_div.innerHTML = '<p class="center">' + message + '</p>';
      }
      spinner_div = document.createElement('div');
      spinner_div.id = 'spinner';
      spinner_div.innerHTML = '<span class="flower-12l-48x48" />';

      overlay.appendChild(message_div);
      overlay.appendChild(spinner_div);
      document.getElementsByTagName('body')[0].appendChild(overlay);
    }
  };

  removeLoadingOverlay =function(message) {
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

}  () );
