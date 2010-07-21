var CandidCanvas = CandidCanvas || {};

(function() {
  /**
   * Creates a new CandidCanvas Scene
   *
   * @param {Object} (optional) options An object hash of options
   * Valid options:
   *  - duration: The amount of time the scene should take to fully execute
   **/
  CandidCanvas.createScene = function(options) {
    return new Scene(options);
  };

	/**
   * A Scene is a container for a collection of animator elements.
   * Each element is a function that takes an animator as a parameter.
   * The expectation is that the element functions will decide how
   * they should modify the animator (including the canvas element
   * for the animator) at each tick.
   *
   * @constructor
   * @param {Object} (optional) options An object hash of options
   * Valid options:
   *  - duration: The amount of time the scene should take to fully execute
   **/
  var Scene = function(options) {
    options = options || {};
    this._events = {};

    _initElements(this);
    _initTimeElapsed(this);
    _initDuration(this);

    this.duration(options.duration);
  };

  /**
   * Takes a function that will be added to the list of functions
   * to be executed at each tick. The new function will be called after
   * the last function that was added to the list of elements.
   *
   * If you want to guarantee that a list of functions will be called
   * in a specified order you may want to look at the addElements
   * method.
   *
   * @see addElements
   * @param {Function} element A function that will be added to the list
   * of element functions called at each tick
   **/
  Scene.prototype.addElement = function(element) {
    this.elements().push(element);
  };

  /**
   * Takes a list of functions that will be executed for each tick of the
   * scene's parent animator. The functions will be executed in the same order
   * that they are passed in to the function.
   *
   * @param {function} an unlimited list of function parameters
   **/
  Scene.prototype.addElements = function() {
    for(var i = 0, len = arguments.length; i < len; i++) {
      this.addElement(arguments[i]);
    }
  };

  /**
   * If a function parameter is passed in it will be executed when the scene
   * begins animating.
   *
   * If the method is called without a parameter, all of the functions that are
   * listening for the scene to start will be executed.
   *
   * @param {function} (optional) func a function to execute
   **/
  Scene.prototype.onstart = function(func) {
    _callOrAddEvents(this, "onstart", arguments);
  };

  /**
   * If a function parameter is passed in it will be executed when the scene
   * is done animating.
   *
   * If the method is called without a parameter, all of the functions that are
   * listening for the scene to complete will be executed.
   *
   * @param {function} (optional) func a function to execute
   **/
  Scene.prototype.oncomplete = function(func) {
    _callOrAddEvents(this, "oncomplete", arguments);
  };

  /**
   * @private
   **/
  function _initElements(scene) {
    var elements = [];

    /**
     * @return {Array} an array containing the elements for the scene
     **/
    scene.elements = function() {
      return elements;
    };

    /**
     * Clear all elements in the in scene.
     **/
    scene.clearElements = function() {
      elements = [];
    };
  }

  /**
    * @private
    **/
  function _initTimeElapsed(scene) {
    var timeElapsed = 0;

    /**
      * @param {Integer} (optional) time sets the amount of time that has passed
      * for the scene.
      * @return {Integer} the amount of milleseconds that have elapsed for the scene
      */
    scene.timeElapsed = function(time) {
      if (arguments.length > 0) {
        timeElapsed = time;
      }

      return timeElapsed;
    };
  }

  /**
   * @private
   **/
  function _initDuration(scene) {
    var duration = 0;

    /**
     * @param {Integer} (optional) time the duration of the scene in milliseconds
     * @return {Integer} the duration of the scene (in milliseconds)
     **/
    scene.duration = function(time) {
      if (arguments.length > 0) {
        duration = time;
      }

      return duration;
    };
  }

  /**
   * If the args param is an empty list of arguments, call
   * the scene event handler collection that matches the name param
   *
   * If the args param has a list of arguments, add the first argument
   * as a function to call for the event handler that matches the name param
   * @private
   *
   * @param {Scene} scene a scene to act on
   * @param {String} name the name of the event
   * @param {Arguments} args an arguments collection
   **/
  function _callOrAddEvents(scene, name, args) {
    if (args.length > 0) {
      _addEvent(scene, name, args[0]);
    } else {
      _callEvents(scene, name);
    }
  }

  /**
   * Add the func param as handler for the even that matches the name param
   * @private
   *
   * @param {Scene} scene a scene to act on
   * @param {String} name the name of the event
   **/
  function _addEvent(scene, name, func) {
    scene._events[name] = scene._events[name] || [];
    scene._events[name].push(func);
  }

  /**
   * Call of the event handlers for the event that matches the name param
   * @private
   *
   * @param {Scene} scene a scene to act on
   * @param {String} name the name of the event
   **/
  function _callEvents(scene, name) {
    var events = scene._events[name];
    if (events) {
      for(var i = 0, len = events.length; i < len; i++) {
        events[i](scene);
      }
    }
  }
})();
