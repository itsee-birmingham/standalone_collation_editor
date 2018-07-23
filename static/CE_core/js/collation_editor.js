collation_editor = (function() {

  //function called on document ready
  var init = function(callback) {
    $.when(
      $.getScript( staticUrl + 'CE_core/js/collation_forms.js'),
      $.getScript( staticUrl + 'CE_core/js/fileDownload.js'),
      $.Deferred(function( deferred ){
          $( deferred.resolve );
      })
    ).done(function(){
      $.when(
        $.getScript( staticUrl + 'CE_core/js/collation.js' ),
        $.getScript( staticUrl + 'CE_core/js/regularise.js' ),
        $.getScript( staticUrl + 'CE_core/js/set_variants.js' ),
        $.getScript( staticUrl + 'CE_core/js/order_readings.js' ),
        $.getScript( staticUrl + 'CE_core/js/spin.js' ),
        $.getScript( staticUrl + 'CE_core/js/spinner_controller.js' ),
        $.getScript( staticUrl + 'CE_core/js/default_settings.js' ),
        $.getScript( staticUrl + 'CE_core/js/context_menu.js' ),
        $.getScript( staticUrl + 'CE_core/js/redips-drag-source.js' ),
        $.getScript( staticUrl + 'CE_core/js/md5.js' ),
        $.getScript( staticUrl + 'CE_core/js/divdrag.js' ),
        $.getScript( staticUrl + 'CE_core/js/subreadings.js' ),
        $.Deferred(function( deferred ){
            $( deferred.resolve );
        })
      ).done(function (){
        $.when(
          $.getScript( staticUrl + servicesFile ),
          $.Deferred(function( deferred ){
              $( deferred.resolve );
          })
        ).done(function () {
          $('head').append($('<link rel="stylesheet" type="text/css" href="' + staticUrl + 'CE_core/css/collation.css">'));
          $('head').append($('<link rel="stylesheet" type="text/css" href="' + staticUrl + 'CE_core/css/structure.css">'));
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

} () );
