var DND = (function () {
    "use strict";
    return {

        _startX: 0,
        _startY: 0,
        _offsetX: 0,
        _offsetY: 0,
        _dragElement: null,
        _oldZIndex: 0,
        //_horizontal: true,
        //_vertical: true,
        _dragElementId: undefined,
        _behaviours: {},
        //TODO: the behaviours stuff here could probably be a lot more efficient

        InitDragDrop: function (id, x, y) {
            document.onmousedown = DND.OnMouseDown;
            document.onmouseup = DND.OnMouseUp;
            DND._behaviours[id] = {};
            if (typeof x !== 'undefined') {
            	DND._behaviours[id]['horizontal'] = x; //= DND._horizontal = x;
            }
            if (typeof y !== 'undefined') {
            	DND._behaviours[id]['vertical'] = y; //DND._vertical = y;
            }
        },

        inheritsDrag: function (node) {
            while (node.parentNode.tagName !== 'BODY') {
            	if (node.tagName === 'FORM') {
            		return false;
            	}
                if ($(node.parentNode).hasClass('dragdiv')) {
                    return true;
                } else {
                    node = node.parentNode;
                }
            }
            return false;
        },


        OnMouseDown: function (e) {
            var target;
            if (e === null) {
                e = window.event;
            }
            target = e.target != null ? e.target : e.srcElement;
            if ((e.button == 1 && window.event != null || e.button == 0) && ($(target).hasClass('dragdiv') || DND.inheritsDrag(target))) {
                while (!$(target).hasClass('dragdiv')) {
                    target = target.parentNode;
                }


                // grab the mouse position
                DND._startX = e.clientX;
                DND._startY = e.clientY;

                // grab the clicked element's position
                DND._offsetX = DND.ExtractNumber(target.style.left);
                DND._offsetY = DND.ExtractNumber(target.style.top);

                // bring the clicked element to the front while it is being dragged
                DND._oldZIndex = target.style.zIndex;
                target.style.zIndex = 10000;

                // we need to access the element in OnMouseMove
                DND._dragElement = target;
                DND._dragElementId = target.id;

                // tell our code to start moving the element with the mouse
                document.onmousemove = DND.OnMouseMove;

                // cancel out any text selections
                document.body.focus();

                // prevent text selection in IE
                document.onselectstart = function () { return false; };
                // prevent IE from trying to drag an image
                target.ondragstart = function() { return false; };

                // prevent text selection (except IE)
                return false;
            }
        },

        ExtractNumber: function (value) {
            var n;
            n = parseInt(value);
            return n === null || isNaN(n) ? 0 : n;
        },

        OnMouseMove: function (e) {
        	var newleft, newright, newtop, newbase;
            if (e === null) {
                e = window.event;
            }
            // this is the actual "drag code"
            if (DND._behaviours[DND._dragElementId].horizontal === true) {//(DND._horizontal === true) {
            	newleft = DND._offsetX + e.clientX - DND._startX;
            	newright = newleft + DND._dragElement.offsetWidth;
            	if (newleft > 0 && newright < window.innerWidth) {
            		DND._dragElement.style.left = newleft + 'px';
            	}
            }
            if (DND._behaviours[DND._dragElementId].vertical === true) {
            	newtop = DND._offsetY + e.clientY - DND._startY;
            	newbase = newtop + DND._dragElement.offsetHeight;
            	if (newtop > 0 && newbase < window.innerHeight) {
            		DND._dragElement.style.top = (DND._offsetY + e.clientY - DND._startY) + 'px';
            	}
            }
        },

        OnMouseUp: function (e) {
            if (DND._dragElement !== null) {
                DND._dragElement.style.zIndex = DND._oldZIndex;
                SV.messagePosLeft = DND._dragElement.style.left;
                SV._message_pos_top = DND._dragElement.style.top;
             // we're done with these events until the next OnMouseDown
                document.onmousemove = null;
                document.onselectstart = null;
                DND._dragElement.ondragstart = null;

                // this is how we know we're not dragging
                DND._dragElement = null;

            }
        }
    };
}());
