(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ReactDnDTouchBackend = {}));
}(this, (function (exports) { 'use strict';

  /**
   * Use invariant() to assert state which your program assumes to be true.
   *
   * Provide sprintf-style format (only %s is supported) and arguments
   * to provide information about what broke and what you were
   * expecting.
   *
   * The invariant message will be stripped in production, but the invariant
   * will remain to ensure logic does not differ in production.
   */
  function invariant(condition, format) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    {
      if (format === undefined) {
        throw new Error('invariant requires an error message argument');
      }
    }

    if (!condition) {
      var error;

      if (format === undefined) {
        error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
      } else {
        var argIndex = 0;
        error = new Error(format.replace(/%s/g, function () {
          return args[argIndex++];
        }));
        error.name = 'Invariant Violation';
      }

      error.framesToPop = 1; // we don't care about invariant's own frame

      throw error;
    }
  }

  exports.ListenerType = void 0;

  (function (ListenerType) {
    ListenerType["mouse"] = "mouse";
    ListenerType["touch"] = "touch";
    ListenerType["keyboard"] = "keyboard";
  })(exports.ListenerType || (exports.ListenerType = {}));

  // Used for MouseEvent.buttons (note the s on the end).
  var MouseButtons = {
    Left: 1,
    Right: 2,
    Center: 4
  }; // Used for e.button (note the lack of an s on the end).

  var MouseButton = {
    Left: 0,
    Center: 1,
    Right: 2
  };
  /**
   * Only touch events and mouse events where the left button is pressed should initiate a drag.
   * @param {MouseEvent | TouchEvent} e The event
   */

  function eventShouldStartDrag(e) {
    // For touch events, button will be undefined. If e.button is defined,
    // then it should be MouseButton.Left.
    return e.button === undefined || e.button === MouseButton.Left;
  }
  /**
   * Only touch events and mouse events where the left mouse button is no longer held should end a drag.
   * It's possible the user mouse downs with the left mouse button, then mouse down and ups with the right mouse button.
   * We don't want releasing the right mouse button to end the drag.
   * @param {MouseEvent | TouchEvent} e The event
   */

  function eventShouldEndDrag(e) {
    // Touch events will have buttons be undefined, while mouse events will have e.buttons's left button
    // bit field unset if the left mouse button has been released
    return e.buttons === undefined || (e.buttons & MouseButtons.Left) === 0;
  }
  function isTouchEvent(e) {
    return !!e.targetTouches;
  }

  var ELEMENT_NODE = 1;
  function getNodeClientOffset(node) {
    var el = node.nodeType === ELEMENT_NODE ? node : node.parentElement;

    if (!el) {
      return undefined;
    }

    var _el$getBoundingClient = el.getBoundingClientRect(),
        top = _el$getBoundingClient.top,
        left = _el$getBoundingClient.left;

    return {
      x: left,
      y: top
    };
  }
  function getEventClientTouchOffset(e, lastTargetTouchFallback) {
    if (e.targetTouches.length === 1) {
      return getEventClientOffset(e.targetTouches[0]);
    } else if (lastTargetTouchFallback && e.touches.length === 1) {
      if (e.touches[0].target === lastTargetTouchFallback.target) {
        return getEventClientOffset(e.touches[0]);
      }
    }
  }
  function getEventClientOffset(e, lastTargetTouchFallback) {
    if (isTouchEvent(e)) {
      return getEventClientTouchOffset(e, lastTargetTouchFallback);
    } else {
      return {
        x: e.clientX,
        y: e.clientY
      };
    }
  }

  function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(Math.abs(x2 - x1), 2) + Math.pow(Math.abs(y2 - y1), 2));
  }
  function inAngleRanges(x1, y1, x2, y2, angleRanges) {
    if (!angleRanges) {
      return false;
    }

    var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 180;

    for (var i = 0; i < angleRanges.length; ++i) {
      if ((angleRanges[i].start == null || angle >= angleRanges[i].start) && (angleRanges[i].end == null || angle <= angleRanges[i].end)) {
        return true;
      }
    }

    return false;
  }

  function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties$1(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass$1(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$1(Constructor.prototype, protoProps); if (staticProps) _defineProperties$1(Constructor, staticProps); return Constructor; }

  function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  var OptionsReader = /*#__PURE__*/function () {
    function OptionsReader(args, context) {
      _classCallCheck$1(this, OptionsReader);

      _defineProperty$1(this, "args", void 0);

      _defineProperty$1(this, "context", void 0);

      this.args = args;
      this.context = context;
    }

    _createClass$1(OptionsReader, [{
      key: "delay",
      get: function get() {
        var _this$args$delay;

        return (_this$args$delay = this.args.delay) !== null && _this$args$delay !== void 0 ? _this$args$delay : 0;
      }
    }, {
      key: "scrollAngleRanges",
      get: function get() {
        return this.args.scrollAngleRanges;
      }
    }, {
      key: "getDropTargetElementsAtPoint",
      get: function get() {
        return this.args.getDropTargetElementsAtPoint;
      }
    }, {
      key: "ignoreContextMenu",
      get: function get() {
        var _this$args$ignoreCont;

        return (_this$args$ignoreCont = this.args.ignoreContextMenu) !== null && _this$args$ignoreCont !== void 0 ? _this$args$ignoreCont : false;
      }
    }, {
      key: "enableHoverOutsideTarget",
      get: function get() {
        var _this$args$enableHove;

        return (_this$args$enableHove = this.args.enableHoverOutsideTarget) !== null && _this$args$enableHove !== void 0 ? _this$args$enableHove : false;
      }
    }, {
      key: "enableKeyboardEvents",
      get: function get() {
        var _this$args$enableKeyb;

        return (_this$args$enableKeyb = this.args.enableKeyboardEvents) !== null && _this$args$enableKeyb !== void 0 ? _this$args$enableKeyb : false;
      }
    }, {
      key: "enableMouseEvents",
      get: function get() {
        var _this$args$enableMous;

        return (_this$args$enableMous = this.args.enableMouseEvents) !== null && _this$args$enableMous !== void 0 ? _this$args$enableMous : false;
      }
    }, {
      key: "enableTouchEvents",
      get: function get() {
        var _this$args$enableTouc;

        return (_this$args$enableTouc = this.args.enableTouchEvents) !== null && _this$args$enableTouc !== void 0 ? _this$args$enableTouc : true;
      }
    }, {
      key: "touchSlop",
      get: function get() {
        return this.args.touchSlop || 0;
      }
    }, {
      key: "delayTouchStart",
      get: function get() {
        var _ref, _this$args$delayTouch, _this$args, _this$args2;

        return (_ref = (_this$args$delayTouch = (_this$args = this.args) === null || _this$args === void 0 ? void 0 : _this$args.delayTouchStart) !== null && _this$args$delayTouch !== void 0 ? _this$args$delayTouch : (_this$args2 = this.args) === null || _this$args2 === void 0 ? void 0 : _this$args2.delay) !== null && _ref !== void 0 ? _ref : 0;
      }
    }, {
      key: "delayMouseStart",
      get: function get() {
        var _ref2, _this$args$delayMouse, _this$args3, _this$args4;

        return (_ref2 = (_this$args$delayMouse = (_this$args3 = this.args) === null || _this$args3 === void 0 ? void 0 : _this$args3.delayMouseStart) !== null && _this$args$delayMouse !== void 0 ? _this$args$delayMouse : (_this$args4 = this.args) === null || _this$args4 === void 0 ? void 0 : _this$args4.delay) !== null && _ref2 !== void 0 ? _ref2 : 0;
      }
    }, {
      key: "window",
      get: function get() {
        if (this.context && this.context.window) {
          return this.context.window;
        } else if (typeof window !== 'undefined') {
          return window;
        }

        return undefined;
      }
    }, {
      key: "document",
      get: function get() {
        var _this$context;

        if ((_this$context = this.context) !== null && _this$context !== void 0 && _this$context.document) {
          return this.context.document;
        }

        if (this.window) {
          return this.window.document;
        }

        return undefined;
      }
    }, {
      key: "rootElement",
      get: function get() {
        var _this$args5;

        return ((_this$args5 = this.args) === null || _this$args5 === void 0 ? void 0 : _this$args5.rootElement) || this.document;
      }
    }, {
      key: "mouseBlockDivId",
      get: function get() {
        return this.args.mouseBlockDivId;
      }
    }]);

    return OptionsReader;
  }();

  var _eventNames;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  var eventNames = (_eventNames = {}, _defineProperty(_eventNames, exports.ListenerType.mouse, {
    start: 'mousedown',
    move: 'mousemove',
    end: 'mouseup',
    contextmenu: 'contextmenu'
  }), _defineProperty(_eventNames, exports.ListenerType.touch, {
    start: 'touchstart',
    move: 'touchmove',
    end: 'touchend'
  }), _defineProperty(_eventNames, exports.ListenerType.keyboard, {
    keydown: 'keydown'
  }), _eventNames);
  var TouchBackendImpl = /*#__PURE__*/function () {
    // React-DnD Dependencies
    // Internal State
    // Patch for iOS 13, discussion over #1585
    function TouchBackendImpl(manager, context, options) {
      var _this = this;

      _classCallCheck(this, TouchBackendImpl);

      _defineProperty(this, "options", void 0);

      _defineProperty(this, "actions", void 0);

      _defineProperty(this, "monitor", void 0);

      _defineProperty(this, "sourceNodes", void 0);

      _defineProperty(this, "sourcePreviewNodes", void 0);

      _defineProperty(this, "sourcePreviewNodeOptions", void 0);

      _defineProperty(this, "targetNodes", void 0);

      _defineProperty(this, "_mouseClientOffset", void 0);

      _defineProperty(this, "_isScrolling", void 0);

      _defineProperty(this, "listenerTypes", void 0);

      _defineProperty(this, "moveStartSourceIds", void 0);

      _defineProperty(this, "waitingForDelay", void 0);

      _defineProperty(this, "timeout", void 0);

      _defineProperty(this, "dragOverTargetIds", void 0);

      _defineProperty(this, "draggedSourceNode", void 0);

      _defineProperty(this, "draggedSourceNodeRemovalObserver", void 0);

      _defineProperty(this, "lastMoveEvent", void 0);

      _defineProperty(this, "shouldRequestMoveFrame", void 0);

      _defineProperty(this, "lastTargetTouchFallback", void 0);

      _defineProperty(this, "getSourceClientOffset", function (sourceId) {
        var element = _this.sourceNodes.get(sourceId);

        return element && getNodeClientOffset(element);
      });

      _defineProperty(this, "handleTopMoveStartCapture", function (e) {
        if (!eventShouldStartDrag(e)) {
          return;
        }

        _this.moveStartSourceIds = [];
      });

      _defineProperty(this, "handleMoveStart", function (sourceId) {
        // Just because we received an event doesn't necessarily mean we need to collect drag sources.
        // We only collect start collecting drag sources on touch and left mouse events.
        if (Array.isArray(_this.moveStartSourceIds)) {
          _this.moveStartSourceIds.unshift(sourceId);
        }
      });

      _defineProperty(this, "handleTopMoveStart", function (e) {
        if (!eventShouldStartDrag(e)) {
          return;
        } // Don't prematurely preventDefault() here since it might:
        // 1. Mess up scrolling
        // 2. Mess up long tap (which brings up context menu)
        // 3. If there's an anchor link as a child, tap won't be triggered on link


        var clientOffset = getEventClientOffset(e);

        if (clientOffset) {
          if (isTouchEvent(e)) {
            _this.lastTargetTouchFallback = e.targetTouches[0];
          }

          _this._mouseClientOffset = clientOffset;
        }

        _this.waitingForDelay = false;
      });

      _defineProperty(this, "handleTopMoveStartDelay", function (e) {
        if (!eventShouldStartDrag(e)) {
          return;
        }

        var delay = e.type === eventNames.touch.start ? _this.options.delayTouchStart : _this.options.delayMouseStart;
        _this.timeout = setTimeout(_this.handleTopMoveStart.bind(_this, e), delay);
        _this.waitingForDelay = true;
      });

      _defineProperty(this, "handleTopMove", function (e) {
        if (_this.timeout) {
          clearTimeout(_this.timeout);
        }

        if (!_this.document || _this.waitingForDelay) {
          return;
        }

        var moveStartSourceIds = _this.moveStartSourceIds;
        var clientOffset = getEventClientOffset(e, _this.lastTargetTouchFallback);

        if (!clientOffset) {
          return;
        } // If the touch move started as a scroll, or is is between the scroll angles


        if (_this._isScrolling || !_this.monitor.isDragging() && inAngleRanges(_this._mouseClientOffset.x || 0, _this._mouseClientOffset.y || 0, clientOffset.x, clientOffset.y, _this.options.scrollAngleRanges)) {
          _this._isScrolling = true;
          return;
        } // If we're not dragging and we've moved a little, that counts as a drag start


        if (!_this.monitor.isDragging() && // eslint-disable-next-line no-prototype-builtins
        _this._mouseClientOffset.hasOwnProperty('x') && moveStartSourceIds && distance(_this._mouseClientOffset.x || 0, _this._mouseClientOffset.y || 0, clientOffset.x, clientOffset.y) > (_this.options.touchSlop ? _this.options.touchSlop : 0)) {
          _this.moveStartSourceIds = undefined;

          _this.actions.beginDrag(moveStartSourceIds, {
            clientOffset: _this._mouseClientOffset,
            getSourceClientOffset: _this.getSourceClientOffset,
            publishSource: false
          });
        }

        if (!_this.monitor.isDragging()) {
          return;
        }

        var sourceNode = _this.sourceNodes.get(_this.monitor.getSourceId());

        _this.installSourceNodeRemovalObserver(sourceNode);

        _this.actions.publishDragSource();

        if (e.cancelable) e.preventDefault();
        _this.lastMoveEvent = e;

        if (_this.shouldRequestMoveFrame) {
          _this.shouldRequestMoveFrame = false;
          requestAnimationFrame(_this.handleTopMoveStream);
        }
      });

      _defineProperty(this, "handleTopMoveStream", function () {
        _this.shouldRequestMoveFrame = true;

        if (!_this.document || !_this.monitor.isDragging() || !_this.lastMoveEvent) {
          return;
        }

        var clientOffset = getEventClientOffset(_this.lastMoveEvent);

        if (!clientOffset) {
          return;
        } // If we have a drag blocking element, ignore it when finding the target element


        var dragBlocker = _this.options.mouseBlockDivId && document.getElementById(_this.options.mouseBlockDivId);

        if (dragBlocker) {
          dragBlocker.style.setProperty('pointer-events', 'none');
        }

        var targetElement = document.elementFromPoint(clientOffset.x, clientOffset.y);

        if (dragBlocker) {
          dragBlocker.style.setProperty('pointer-events', 'auto');
        }

        var targetNodes = _this.targetNodes;
        var dragOverTargetNodes = [];
        targetNodes.forEach(function (node) {
          if (targetElement === node || node !== null && node !== void 0 && node.contains(targetElement)) {
            dragOverTargetNodes.push(node);
          }
        }); // Get the a ordered list of nodes that are touched by

        var elementsAtPoint = _this.options.getDropTargetElementsAtPoint ? _this.options.getDropTargetElementsAtPoint(clientOffset.x, clientOffset.y, dragOverTargetNodes) : _this.document.elementsFromPoint(clientOffset.x, clientOffset.y); // Extend list with parents that are not receiving elementsFromPoint events (size 0 elements and svg groups)

        var elementsAtPointExtended = [];

        for (var nodeId in elementsAtPoint) {
          // eslint-disable-next-line no-prototype-builtins
          if (!elementsAtPoint.hasOwnProperty(nodeId)) {
            continue;
          }

          var currentNode = elementsAtPoint[nodeId];
          elementsAtPointExtended.push(currentNode);

          while (currentNode) {
            currentNode = currentNode.parentElement;

            if (currentNode && elementsAtPointExtended.indexOf(currentNode) === -1) {
              elementsAtPointExtended.push(currentNode);
            }
          }
        }

        var orderedDragOverTargetIds = elementsAtPointExtended // Filter off nodes that arent a hovered DropTargets nodes
        .filter(function (node) {
          return dragOverTargetNodes.indexOf(node) > -1;
        }) // Map back the nodes elements to targetIds
        .map(function (node) {
          return _this._getDropTargetId(node);
        }) // Filter off possible null rows
        .filter(function (node) {
          return !!node;
        }).filter(function (id, index, ids) {
          return ids.indexOf(id) === index;
        });
        var enableHoverOutsideTarget = _this.options.enableHoverOutsideTarget; // Invoke hover for drop targets when source node is still over and pointer is outside

        if (enableHoverOutsideTarget) {
          var sourceNode = _this.sourceNodes.get(_this.monitor.getSourceId());

          for (var targetId in _this.targetNodes) {
            var targetNode = _this.targetNodes.get(targetId);

            if (sourceNode && targetNode && targetNode.contains(sourceNode) && orderedDragOverTargetIds.indexOf(targetId) === -1) {
              orderedDragOverTargetIds.unshift(targetId);
              break;
            }
          }
        } // Reverse order because dnd-core reverse it before calling the DropTarget drop methods


        orderedDragOverTargetIds.reverse();

        _this.actions.hover(orderedDragOverTargetIds, {
          clientOffset: clientOffset
        });
      });

      _defineProperty(this, "_getDropTargetId", function (node) {
        var keys = _this.targetNodes.keys();

        var next = keys.next();

        while (next.done === false) {
          var targetId = next.value;

          if (node === _this.targetNodes.get(targetId)) {
            return targetId;
          } else {
            next = keys.next();
          }
        }

        return undefined;
      });

      _defineProperty(this, "handleTopMoveEndCapture", function (e) {
        _this._isScrolling = false;
        _this.lastTargetTouchFallback = undefined;

        if (!eventShouldEndDrag(e)) {
          return;
        }

        if (!_this.monitor.isDragging() || _this.monitor.didDrop()) {
          _this.moveStartSourceIds = undefined;
          return;
        }

        if (e.cancelable) e.preventDefault();
        _this._mouseClientOffset = {};

        _this.uninstallSourceNodeRemovalObserver();

        _this.actions.drop();

        _this.actions.endDrag();
      });

      _defineProperty(this, "handleCancelOnEscape", function (e) {
        if (e.key === 'Escape' && _this.monitor.isDragging()) {
          _this._mouseClientOffset = {};

          _this.uninstallSourceNodeRemovalObserver();

          _this.actions.endDrag();
        }
      });

      this.options = new OptionsReader(options, context);
      this.actions = manager.getActions();
      this.monitor = manager.getMonitor();
      this.sourceNodes = new Map();
      this.sourcePreviewNodes = new Map();
      this.sourcePreviewNodeOptions = new Map();
      this.targetNodes = new Map();
      this.listenerTypes = [];
      this._mouseClientOffset = {};
      this._isScrolling = false;
      this.shouldRequestMoveFrame = true;

      if (this.options.enableMouseEvents) {
        this.listenerTypes.push(exports.ListenerType.mouse);
      }

      if (this.options.enableTouchEvents) {
        this.listenerTypes.push(exports.ListenerType.touch);
      }

      if (this.options.enableKeyboardEvents) {
        this.listenerTypes.push(exports.ListenerType.keyboard);
      }
    }
    /**
     * Generate profiling statistics for the HTML5Backend.
     */


    _createClass(TouchBackendImpl, [{
      key: "profile",
      value: function profile() {
        var _this$dragOverTargetI;

        return {
          sourceNodes: this.sourceNodes.size,
          sourcePreviewNodes: this.sourcePreviewNodes.size,
          sourcePreviewNodeOptions: this.sourcePreviewNodeOptions.size,
          targetNodes: this.targetNodes.size,
          dragOverTargetIds: ((_this$dragOverTargetI = this.dragOverTargetIds) === null || _this$dragOverTargetI === void 0 ? void 0 : _this$dragOverTargetI.length) || 0
        };
      } // public for test

    }, {
      key: "document",
      get: function get() {
        return this.options.document;
      }
    }, {
      key: "setup",
      value: function setup() {
        var root = this.options.rootElement;

        if (!root) {
          return;
        }

        invariant(!TouchBackendImpl.isSetUp, 'Cannot have two Touch backends at the same time.');
        TouchBackendImpl.isSetUp = true;
        this.addEventListener(root, 'start', this.getTopMoveStartHandler());
        this.addEventListener(root, 'start', this.handleTopMoveStartCapture, true);
        this.addEventListener(root, 'move', this.handleTopMove);
        this.addEventListener(root, 'end', this.handleTopMoveEndCapture, true);

        if (this.options.enableMouseEvents && !this.options.ignoreContextMenu) {
          this.addEventListener(root, 'contextmenu', this.handleTopMoveEndCapture);
        }

        if (this.options.enableKeyboardEvents) {
          this.addEventListener(root, 'keydown', this.handleCancelOnEscape, true);
        }
      }
    }, {
      key: "teardown",
      value: function teardown() {
        var root = this.options.rootElement;

        if (!root) {
          return;
        }

        TouchBackendImpl.isSetUp = false;
        this._mouseClientOffset = {};
        this.removeEventListener(root, 'start', this.handleTopMoveStartCapture, true);
        this.removeEventListener(root, 'start', this.handleTopMoveStart);
        this.removeEventListener(root, 'move', this.handleTopMove);
        this.removeEventListener(root, 'end', this.handleTopMoveEndCapture, true);

        if (this.options.enableMouseEvents && !this.options.ignoreContextMenu) {
          this.removeEventListener(root, 'contextmenu', this.handleTopMoveEndCapture);
        }

        if (this.options.enableKeyboardEvents) {
          this.removeEventListener(root, 'keydown', this.handleCancelOnEscape, true);
        }

        this.uninstallSourceNodeRemovalObserver();
      }
    }, {
      key: "addEventListener",
      value: function addEventListener(subject, event, handler, capture) {
        var options = capture;
        this.listenerTypes.forEach(function (listenerType) {
          var evt = eventNames[listenerType][event];

          if (evt) {
            subject.addEventListener(evt, handler, options);
          }
        });
      }
    }, {
      key: "removeEventListener",
      value: function removeEventListener(subject, event, handler, capture) {
        var options = capture;
        this.listenerTypes.forEach(function (listenerType) {
          var evt = eventNames[listenerType][event];

          if (evt) {
            subject.removeEventListener(evt, handler, options);
          }
        });
      }
    }, {
      key: "connectDragSource",
      value: function connectDragSource(sourceId, node) {
        var _this2 = this;

        var handleMoveStart = this.handleMoveStart.bind(this, sourceId);
        this.sourceNodes.set(sourceId, node);
        this.addEventListener(node, 'start', handleMoveStart);
        return function () {
          _this2.sourceNodes.delete(sourceId);

          _this2.removeEventListener(node, 'start', handleMoveStart);
        };
      }
    }, {
      key: "connectDragPreview",
      value: function connectDragPreview(sourceId, node, options) {
        var _this3 = this;

        this.sourcePreviewNodeOptions.set(sourceId, options);
        this.sourcePreviewNodes.set(sourceId, node);
        return function () {
          _this3.sourcePreviewNodes.delete(sourceId);

          _this3.sourcePreviewNodeOptions.delete(sourceId);
        };
      }
    }, {
      key: "connectDropTarget",
      value: function connectDropTarget(targetId, node) {
        var _this4 = this;

        var root = this.options.rootElement;

        if (!this.document || !root) {
          return function () {
            /* noop */
          };
        }

        this.targetNodes.set(targetId, node);
        return function () {
          if (_this4.document) {
            _this4.targetNodes.delete(targetId);
          }
        };
      }
    }, {
      key: "getTopMoveStartHandler",
      value: function getTopMoveStartHandler() {
        if (!this.options.delayTouchStart && !this.options.delayMouseStart) {
          return this.handleTopMoveStart;
        }

        return this.handleTopMoveStartDelay;
      }
    }, {
      key: "installSourceNodeRemovalObserver",
      value: function installSourceNodeRemovalObserver(node) {
        var _this5 = this;

        this.uninstallSourceNodeRemovalObserver();
        this.draggedSourceNode = node;
        this.draggedSourceNodeRemovalObserver = new MutationObserver(function () {
          if (node && !node.parentElement) {
            _this5.resurrectSourceNode();

            _this5.uninstallSourceNodeRemovalObserver();
          }
        });

        if (!node || !node.parentElement) {
          return;
        }

        this.draggedSourceNodeRemovalObserver.observe(node.parentElement, {
          childList: true
        });
      }
    }, {
      key: "resurrectSourceNode",
      value: function resurrectSourceNode() {
        if (this.document && this.draggedSourceNode) {
          this.draggedSourceNode.style.display = 'none';
          this.draggedSourceNode.removeAttribute('data-reactid');
          this.document.body.appendChild(this.draggedSourceNode);
        }
      }
    }, {
      key: "uninstallSourceNodeRemovalObserver",
      value: function uninstallSourceNodeRemovalObserver() {
        if (this.draggedSourceNodeRemovalObserver) {
          this.draggedSourceNodeRemovalObserver.disconnect();
        }

        this.draggedSourceNodeRemovalObserver = undefined;
        this.draggedSourceNode = undefined;
      }
    }]);

    return TouchBackendImpl;
  }();

  _defineProperty(TouchBackendImpl, "isSetUp", void 0);

  var TouchBackend = function createBackend(manager) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return new TouchBackendImpl(manager, context, options);
  };

  exports.TouchBackend = TouchBackend;
  exports.TouchBackendImpl = TouchBackendImpl;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
