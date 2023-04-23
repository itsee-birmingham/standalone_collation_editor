collation_editor = (function() {

  //must be called when system is ready to load and critically *after* staticUrl has been set
  var init = function(callback) {
    $.when(
      $.getScript(staticUrl + 'CE_core/js/collation_forms.js'),
      $.Deferred(function(deferred) {
        $(deferred.resolve);
      })
    ).done(function() {
      $.when(
        $.getScript(staticUrl + 'CE_core/js/collation.js'),
        $.getScript(staticUrl + 'CE_core/js/regularise.js'),
        $.getScript(staticUrl + 'CE_core/js/set_variants.js'),
        $.getScript(staticUrl + 'CE_core/js/order_readings.js'),
        $.getScript(staticUrl + 'CE_core/js/spinner.js'),
        $.getScript(staticUrl + 'CE_core/js/default_settings.js'),
        $.getScript(staticUrl + 'CE_core/js/context_menu.js'),
        $.getScript(staticUrl + 'CE_core/js/redips-drag-5.3.min.js'),
        $.getScript(staticUrl + 'CE_core/js/md5.js'),
        $.getScript(staticUrl + 'CE_core/js/draggable.js'),
        $.getScript(staticUrl + 'CE_core/js/selectable.min.js'),
        $.getScript(staticUrl + 'CE_core/js/subreadings.js'),
        $.Deferred(function(deferred) {
          $(deferred.resolve);
        })
      ).done(function() {
        $.when(
          $.getScript(staticUrl + servicesFile),
          $.Deferred(function(deferred) {
            $(deferred.resolve);
          })
        ).done(function() {
          $('head').append($('<link rel="stylesheet" type="text/css" href="' + staticUrl +
                             'CE_core/css/collation.css">'));
          $('head').append($('<link rel="stylesheet" type="text/css" href="' + staticUrl +
                             'CE_core/css/structure.css">'));
          $('head').append($('<link rel="stylesheet" type="text/css" href="' + staticUrl +
                             'CE_core/css/spinner.css">'));
          if (callback !== undefined) {
            callback();
          }
        });
      });
    });
  };

  return {
    init: init,
  };

}());
