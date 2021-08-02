/**
 *
 * Simple Context Menu
 * http://www.webtoolkit.info/
 *
 * The website above links to the following license: Attribution 2.0 UK: England & Wales (CC BY 2.0 UK)
 *
 * On 21st July 2021 The license statement on the website says:
 *
 * As long as you leave the copyright notice of the original script, or link back to this website, you can use any of
 * the content published on this website free of charge for any use: commercial or noncommercial. However, under the
 * license they are released through there are limitations to what you may or may not do.
 *
 * You Can:
 * Use the resources in your personal work, in whole or part.
 * Use the resources in your commercial work, in whole or part.
 * Modify the work to your personal preference.
 * Share the resources with others, under the following terms:
 *   Link to the resource webpage, not the download file.
 *   Use an excerpt from the webpage if necessary (don’t copy the full article and display it on your site)
 *
 * You Can Not:
 * You can NOT sell the resources directly for profit (eg. Selling the items on stock resource websites)
 * You can NOT copy the full webpage and display it on your own website. (Use an excerpt by all means, but please
 * link to the original resource download page – not the actual file.)
 *
 *
 * The code has been adapted to allow more flexible use in this software. Adaptations include generating menus and menu
 * functions on the fly, corrections of menu position.
 * The license terms requires that this adaptation is noted here.
 **/

var SimpleContextMenu = {

  // private attributes
  _menus: [],
  _attachedElement: null,
  _menuElement: null,
  _preventDefault: true,
  _preventForms: true,
  _target_element: null,


  // public method. Sets up whole context menu stuff..
  setup: function(conf) {
    if (document.all && document.getElementById && !window.opera) {
      SimpleContextMenu.IE = true;
    }
    if (!document.all && document.getElementById && !window.opera) {
      SimpleContextMenu.FF = true;
    }
    if (document.all && document.getElementById && window.opera) {
      SimpleContextMenu.OP = true;
    }
    if (SimpleContextMenu.IE || SimpleContextMenu.FF) {
      document.oncontextmenu = SimpleContextMenu._show;
      document.onclick = SimpleContextMenu._hide;
      if (conf && typeof(conf.preventDefault) != "undefined") {
        SimpleContextMenu._preventDefault = conf.preventDefault;
      }
      if (conf && typeof(conf.preventForms) != "undefined") {
        SimpleContextMenu._preventForms = conf.preventForms;
      }
    }
  },

  detach_all: function() {
    SimpleContextMenu._menus = [];
  },

  // public method. Attaches context menus to specific class names
  attach: function(classNames, menuId) {
    if (typeof(classNames) == "string") {
      SimpleContextMenu._menus[classNames] = menuId;
    }
    if (typeof(classNames) == "object") {
      for (x = 0; x < classNames.length; x += 1) {
        SimpleContextMenu._menus[classNames[x]] = menuId;
      }
    }
  },


  // private method. Get which context menu to show
  _getMenuElementId: function(e) {
    if (SimpleContextMenu.IE) {
      SimpleContextMenu._attachedElement = event.srcElement;
    } else {
      SimpleContextMenu._attachedElement = e.target;
    }
    while (SimpleContextMenu._attachedElement != null) {
      var className = SimpleContextMenu._attachedElement.className;
      if (typeof(className) != "undefined") {
        className = className.replace(/^\s+/g, "").replace(/\s+$/g, "");
        var classArray = className.split(/[ ]+/g);
        for (i = 0; i < classArray.length; i += 1) {
          if (SimpleContextMenu._menus[classArray[i]]) {
            return SimpleContextMenu._menus[classArray[i]];
          }
        }
      }
      if (SimpleContextMenu.IE) {
        SimpleContextMenu._attachedElement = SimpleContextMenu._attachedElement.parentElement;
      } else {
        SimpleContextMenu._attachedElement = SimpleContextMenu._attachedElement.parentNode;
      }
    }
    return null;
  },


  // private method. Shows context menu
  _getReturnValue: function(e) {
    var el;
    var returnValue = true;
    var evt = SimpleContextMenu.IE ? window.event : e;
    if (evt.button != 1) {
      if (evt.target) {
        el = evt.target;
      } else if (evt.srcElement) {
        el = evt.srcElement;
      }
      var tname = el.tagName.toLowerCase();
      if ((tname == "input" || tname == "textarea")) {
        if (!SimpleContextMenu._preventForms) {
          returnValue = true;
        } else {
          returnValue = false;
        }
      } else {
        if (!SimpleContextMenu._preventDefault) {
          returnValue = true;
        } else {
          returnValue = false;
        }
      }
    }
    return returnValue;
  },

  // private method. Shows context menu
  _show: function(e) {
    var menuElementId, m, s, element, div, row_elem, row, type, subrow;
    SimpleContextMenu._hide();
    menuElementId = SimpleContextMenu._getMenuElementId(e);
    if (menuElementId !== null) {
      menuElementId = menuElementId();
      if (menuElementId) {
        m = SimpleContextMenu._getMousePosition(e);
        s = SimpleContextMenu._getScrollPosition(e);
        SimpleContextMenu._menuElement = document.getElementById(menuElementId);
        SimpleContextMenu._menuElement.style.left = (m.x - 10) + s.x + 'px';
        //110 here is the hard coded width set in simplecontextmenu in css
        if (parseInt(SimpleContextMenu._menuElement.style.left) - document.getElementById('scroller').scrollLeft +
                                                                  110 > window.innerWidth) {
          SimpleContextMenu._menuElement.style.left = window.innerWidth +
                                                      document.getElementById('scroller').scrollLeft -
                                                      (110 + 35) + 'px';
        }
        SimpleContextMenu._menuElement.style.top = (m.y - 70) + s.y + 'px';
        element = document.elementFromPoint(m.x, m.y);

        SimpleContextMenu._target_element = element;
        SimpleContextMenu._menuElement.style.display = 'block';
        return false;
      }
      return SimpleContextMenu._getReturnValue(e);
    }
  },

  // private method. Hides context menu
  _hide: function() {

    if (SimpleContextMenu._menuElement) {
      SimpleContextMenu._menuElement.style.display = 'none';
    }
  },

  _getMousePosition: function(e) {
    e = e ? e : window.event;
    var position = {
      'x': e.clientX,
      'y': e.clientY
    };
    return position;
  },

  _getScrollPosition: function() {
    var x = 0;
    var y = 0;
    if (document.getElementById('scroller') &&
            (document.getElementById('scroller').scrollLeft ||
                document.getElementById('scroller').scrollTop)) {
      x = document.getElementById('scroller').scrollLeft;
      y = document.getElementById('scroller').scrollTop;
    } else if (typeof(window.pageYOffset) == 'number') {
      x = window.pageXOffset;
      y = window.pageYOffset;
    } else if (document.documentElement &&
                  (document.documentElement.scrollLeft ||
                      document.documentElement.scrollTop)) {
      x = document.documentElement.scrollLeft;
      y = document.documentElement.scrollTop;
    } else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
      x = document.body.scrollLeft;
      y = document.body.scrollTop;
    }
    var position = {
      'x': x,
      'y': y
    };
    return position;
  }
};
