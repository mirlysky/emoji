/**
* Unifies event handling across browsers
*
* - Allows registering and unregistering of event handlers
* - Injects event object and involved DOM element to listener
*
* @author Mark Rolich <mark.rolich@gmail.com>
*/
var Event = function () {
    "use strict";
    var self = this;
    this.attach = function (evtName, element, listener, capture) {

        var evt         = '',
            useCapture  = (capture === undefined) ? true : capture,
            handler     = null;

        if (window.addEventListener === undefined) {
            evt = 'on' + evtName;
            handler = function (evt, listener) {
                element.attachEvent(evt, listener);
                return listener;
            };
        } else {
            evt = evtName;
            handler = function (evt, listener, useCapture) {
                element.addEventListener(evt, listener, useCapture);
                return listener;
            };
        }

        return handler.apply(element, [evt, function (ev) {
            var e   = ev || event,
                src = e.srcElement || e.target;

            listener(e, src);
        }, useCapture]);
    };

    this.detach = function (evtName, element, listener, capture) {
        var evt         = '',
            useCapture  = (capture === undefined) ? true : capture;

        if (window.removeEventListener === undefined) {
            evt = 'on' + evtName;
            element.detachEvent(evt, listener);
        } else {
            evt = evtName;
            element.removeEventListener(evt, listener, useCapture);
        }
    };

    this.stop = function (evt) {
        evt.cancelBubble = true;

        if (evt.stopPropagation) {
            evt.stopPropagation();
        }
    };

    this.prevent = function (evt) {
        if (evt.preventDefault) {
            evt.preventDefault();
        } else {
            evt.returnValue = false;
        }
    };
};

////////////////////////////////////////////////////////////////////////////////////////////////////

/**
* This Javascript package implements drag-n-drop functionality in a browser.
*
* Supports:
* - Moving an element horizontally, vertically and in both directions
* - Snap to grid functionality
* - Limitation of moving distance
* - Registering of user-defined function on start, move and stop
*
* Tested in the following browsers: IE 6.0, FF 17, Chrome 22, Safari 5.1.1
*
* Dragdrop.js requires Event.js package, which can be acquired at the following links:
* Github - https://github.com/mark-rolich/Event.js
* JS Classes - http://www.jsclasses.org/package/212-JavaScript-Handle-events-in-a-browser-independent-manner.html
*
* @author Mark Rolich <mark.rolich@gmail.com>
*/
var Dragdrop = function (evt) {
    "use strict";
    var elem        = null,
        started     = 0,
        self        = this,
        moveHandler = null,
        doc         = document.documentElement,
        body        = document.body,
        gWidth      = (document.body.scrollWidth > document.documentElement.clientWidth)
                      ? document.body.scrollWidth
                      : document.documentElement.clientWidth,
        gHeight     = Math.max(body.scrollHeight, body.offsetHeight, doc.clientHeight, doc.scrollHeight, doc.offsetHeight),
        move        = function (e) {
            var xDiff   = e.clientX - elem.posX,
                yDiff   = e.clientY - elem.posY,
                x       = xDiff - (xDiff % elem.snap) + 'px',
                y       = yDiff - (yDiff % elem.snap) + 'px';

            if (started === 1) {
                switch (elem.mode) {
                case 0:
                    elem.style.top = y;
                    elem.style.left = x;
                    break;
                case 1:
                    elem.style.left = x;
                    break;
                case 2:
                    elem.style.top = y;
                    break;
                }

                if (elem.mode !== 2) {
                    if (xDiff <= elem.minX) {
                        elem.style.left = elem.minX + 'px';
                    }
                    
                    if (elem.offsetLeft + elem.offsetWidth >= elem.maxX) {
                        elem.style.left = (elem.maxX - elem.offsetWidth) + 'px';
                    }
                }

                if (elem.mode !== 1) {
                    if (yDiff <= elem.minY) {
                        elem.style.top = elem.minY + 'px';
                    }

                    if (elem.offsetTop + elem.offsetHeight >= elem.maxY) {
                        elem.style.top = (elem.maxY - elem.offsetHeight) + 'px';
                    }
                }

                elem.onMove(elem);
            }
        },
        start       = function (e, src) {
            if (src.className.indexOf('draggable') !== -1) {

                evt.prevent(e);

                moveHandler = evt.attach('mousemove', document, move, true);
                started = 1;

                elem = src;
                elem.posX = e.clientX - elem.offsetLeft;
                elem.posY = e.clientY - elem.offsetTop;

                if (elem.mode === undefined) {
                    self.set(elem);
                }

                elem.onStart(elem);

                if (elem.setCapture) {
                    elem.setCapture();
                }
            }
        },
        stop        = function () {
            if (started === 1) {
                started = 0;
                elem.onStop(elem);
                evt.detach('mousemove', document, moveHandler);

                if (elem.releaseCapture) {
                    elem.releaseCapture();
                }
            }
        };

    evt.attach('mousedown', document, start, false);
    evt.attach('mouseup', document, stop, false);

    this.start = start;

    this.set = function (element, elemOptions) {
        var options = elemOptions       || {};

        elem = (typeof element === 'string')
                ? document.getElementById(element)
                : element;

        elem.mode           = options.mode      || 0;
        elem.minX           = options.minX      || 0;
        elem.maxX           = options.maxX      || gWidth;
        elem.minY           = options.minY      || 0;
        elem.maxY           = options.maxY      || gHeight;
        elem.snap           = options.snap      || 1;
        elem.onStart        = options.onstart   || function () {};
        elem.onMove         = options.onmove    || function () {};
        elem.onStop         = options.onstop    || function () {};

        elem.style.left     = elem.offsetLeft + 'px';
        elem.style.top      = elem.offsetTop + 'px';

        elem.unselectable   = 'on';
    };
};