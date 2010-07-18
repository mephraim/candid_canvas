(function() {
  /**
   * The default time period (in milliseconds) between each tick
   * of the animation
   *
   * @const
   **/
  var DEFAULT_FRAME_DURATION = 25;

  CandidCanvas = {};

  /**
   * Creates a new CandidCanvas Animator and attaches it to the
   * Canvas element.
   *
   * @param {HTMLCanvasElement} canvas The canvas element that
   * the animator will attach itself to
   * @param {Object} options (optional) An options hash (not currently used)
   **/
  CandidCanvas.createAnimator = function(canvas, options) {
    return new Animator(canvas, options);
  };

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
   * An Animator attaches itself to a canvas element and handles
   * the playing, pausing, looping and resetting of animator
   * scenes that act on the canvas element.
   *
   * @private
   * @constructor
   * @param {HTMLCanvasElement} canvas The canvas element that
   * the animator will attach itself to
   **/
  var Animator = function(canvas) {
    _initContext(this, canvas);
    _initScenes(this);
    _initCurrentScene(this);
  };

  /**
   * Adds a new CandidCanvas Scene to the animator. The scene will
   * be executed after any other scenes that have been added to the
   * animator.
   *
   * @param {Scene} scene a Scene to add to the Animator
   * @see addScenes
   **/
  Animator.prototype.addScene = function(scene) {
    this.getScenes().push(scene);
  };

  /**
   * Adds a list of CandidCanvas Scenes to the animator. Each scene
   * will be added to the animator in the order that it was passed in
   * to the addScenes method.
   *
   * @param {Scene} scenes An unlimited list of scenes to add to the animator
   **/
  Animator.prototype.addScenes = function() {
    for(var i = 0, len = arguments.length; i < len; i++) {
      this.addScene(arguments[i]);
    }
  };

  /**
   * Start playing the animator. If the animator was paused,
   * continue playing where the animator left off. Otherwise,
   * start from the beginning. A call to the function is ignored
   * if the animator is already playing.
   *
   * @param {Object} (optional) options an object hash of options
   * Valid options:
   *  - loop: if true, the animator will loop
   **/
  Animator.prototype.play = function(options) {
    if (this._currentlyPlaying) {
      return;
    }

    _initForPlay(this, options || {});
    _startFrameTimer(this);
  };

  /**
   * The same as play, but the animator will loop
   * @see play
   **/
  Animator.prototype.loop = function(options) {
    options = options || {};
    options.loop = true;

    this.play(options);
  };

  /**
   * Stop the current animator, but retain the current
   * animator's state.
   **/
  Animator.prototype.pause = function() {
    this._currentlyPlaying = false;
    clearInterval(this._playTimer);
  };

  /**
   * Stop the current animator and reset all state properties
   **/
  Animator.prototype.reset = function() {
    _resetAnimator(this);
  };

  /**
   * @private
   **/
  function _initContext(anim, canvas) {
    var context = canvas.getContext('2d');

    /**
     * @return {CanvasRenderingContext2D} the attached canvas context
     * for the animator
     **/
    anim.getContext = function() {
      return context;
    };
  }

  /**
   * @private
   **/
  function _initScenes(anim) {
    var scenes = [];

    /*
     * @return {Array} the scenes for the animator
     **/
    anim.getScenes = function() {
      return scenes;
    };

    /**
     * Clear all of the animator's scenes
     **/
    anim.clearScenes = function() {
      scenes = [];
    };
  }

  /**
   * @private
   **/
  function _initCurrentScene(anim) {
    var currentScene;

    /**
     * @return {Scene} the current scene for the
     * animator
     **/
    anim.getCurrentScene = function() {
      return currentScene;
    };

    /**
     * @param {Scene} scene The scene to set as the animator's
     * current scene
     **/
    anim.setCurrentScene = function(scene) {
      currentScene = scene;
    };
  }

  /**
   * Sets up the animator for playing by making sure that the state
   * of the animator is maintained after an animator is paused.
   *
   * @private
   * @param {Animator} anim The animator
   * @param {Object} options A set of options carried over from the play
   * function
   **/
  function _initForPlay(anim, options) {
    anim._currentlyPlaying = true;

    anim._looping = anim._looping || options.loop;

    // Load in the remaining scenes (after a pause)
    // or copy the entire the scenes array if there
    // are no remaining scenes
    anim._remainingScenes = anim._remainingScenes ||
                            anim.getScenes().concat();

    // Load in the current scene (after a pause)
    // or shift the next scene from the remaining scenes
    anim._currentScene = anim._currentScene ||
                         anim._remainingScenes.shift();

    // Load the amount of time elapsed for the current scene (after a pause)
    // or start at 0 for the next scene
    anim._timeElapsedForCurrentScene = anim._timeElapsedForCurrentScene || 0;
  }

  /**
   * The real meat of the animator. Starts a timer that will run
   * each tick of the animator. For each tick the animator needs
   * to run through each element of the current scene.
   *
   * @private
   * @param {Animator} anim an Animator
   **/
  function _startFrameTimer(anim) {
    var frameDuration = DEFAULT_FRAME_DURATION;

    anim._playTimer = setInterval(function() {

      // if all of the scenes have been run
      if (!anim._currentScene) {
        // if the animator should be looping copy the scenes array again
        // and load the first scene
        if (anim._looping) {
          anim._remainingScenes = anim.getScenes().concat();
          anim._currentScene = anim._remainingScenes.shift();
          anim._timeElapsedForCurrentScene = 0;
        }
        // otherwise, stop the timer, reset the values and return
        else {
          _resetAnimator(anim);
          return;
        }
      }

      // if the current scene is still running then run another frame
      if (anim._timeElapsedForCurrentScene < anim._currentScene.duration) {
        _runScene(anim, anim._currentScene, anim._timeElapsedForCurrentScene);
        anim._timeElapsedForCurrentScene += frameDuration;
      // otherwise, load the next scene
      } else {
        anim._currentScene.oncomplete();
        anim._currentScene = anim._remainingScenes.shift();
        anim._timeElapsedForCurrentScene = 0;
      }
    }, frameDuration);
  }

  /**
   * Takes a Scene and runs through each of the elements of the scene.
   * If no time has elapsed for the scene yet, the scene's onstart handler
   * will be called.
   *
   * @private
   * @param {Animator} anim the Animator that the scene belongs to
   * @param {Scene} scene a Scene to run through
   * @param {Integer} timeElapsed the amount of time that has elapsed for the scene
   **/
  function _runScene(anim, scene, timeElapsed) {
    if (timeElapsed < 1) {
      scene.onstart();
    }

    var elements = scene.elements;

    for(var i = 0, len = elements.length; i < len; i++) {
      elements[i](anim, scene.duration, timeElapsed);
    }
  }

  /**
   * Resets the animator's timer and clears any state properties
   * that were store for the Animator
   *
   * @private
   * @param {Animator} anim an Animator to reset
   **/
  function _resetAnimator(anim) {
    clearInterval(anim._playTimer);

    delete anim._currentlyPlaying;
    delete anim._looping;
    delete anim._playTimer;
    delete anim._remainingScenes;
    delete anim._currentScene;
  }

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
    this.elements = [];
    this.duration = options.duration;

    this._events = {};
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
    this.elements.push(element);
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
   * Clear all elements in the in scene.
   **/
  Scene.prototype.clearElements = function() {
    this.elements = [];
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
    _callOrAddSceneEvents(this, "onstart", arguments);
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
    _callOrAddSceneEvents(this, "oncomplete", arguments);
  };

  /**
   * If the args param is an empty list of arguments, call call
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
  function _callOrAddSceneEvents(scene, name, args) {
    if (args.length > 0) {
      _addSceneEvent(scene, name, args[0]);
    } else {
      _callSceneEvents(scene, name);
    }
  }

  /**
   * Add the func param as handler for the even that matches the name param
   * @private
   *
   * @param {Scene} scene a scene to act on
   * @param {String} name the name of the event
   **/
  function _addSceneEvent(scene, name, func) {
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
  function _callSceneEvents(scene, name) {
    var events = scene._events[name];
    if (events) {
      for(var i = 0, len = events.length; i < len; i++) {
        events[i](scene);
      }
    }
  }
})();

