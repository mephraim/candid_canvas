var CandidCanvas = CandidCanvas || {};

(function() {
  /**
   * The default time period (in milliseconds) between each tick
   * of the animation
   *
   * @const
   **/
  var DEFAULT_FRAME_DURATION = 25;

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
    this.scenes().push(scene);
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
    anim.context = function() {
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
    anim.scenes = function() {
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
     * If no parameters are passed in, returns the current scene.
     * Otherwise sets the current scene to the scene parameter.
     *
     * @param {Scene} scene (optional) the scene to be set as the current scene
     * @return {Scene} the current scene for the animator
     **/
    anim.currentScene = function(scene) {
      if (arguments.length > 0) { 
        currentScene = scene;
      }

      return currentScene;
    };

    /**
     * Set the current scene back to null
     **/
    anim.clearCurrentScene = function() {
      current.timeElapsed(0);
      currentScene = null;
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
                            anim.scenes().concat();

    // Load in the current scene (after a pause)
    // or shift the next scene from the remaining scenes
    anim.currentScene(anim.currentScene() ||
                      anim._remainingScenes.shift());

    // Set the amount of time elapsed for the current scene (after a pause)
    // or start at 0 for the next scene
    var currentScene = anim.currentScene();
    currentScene.timeElapsed(currentScene.timeElapsed() || 0);
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
      if (!anim.currentScene()) {
        // if the animator should be looping copy the scenes array again
        // and load the first scene
        if (anim._looping) {
          anim._remainingScenes = anim.scenes().concat();
          anim.currentScene(anim._remainingScenes.shift());
          anim.currentScene().timeElapsed(0);
        }
        // otherwise, stop the timer, reset the values and return
        else {
          _resetAnimator(anim);
          return;
        }
      }

      var timeElapsedForCurrentScene = anim.currentScene().timeElapsed();

      // if the current scene is still running then run another frame
      if (timeElapsedForCurrentScene < anim.currentScene().duration) {
        _runCurrentScene(anim);
        anim.currentScene().timeElapsed(timeElapsedForCurrentScene + frameDuration);
      // otherwise, load the next scene
      } else {
        var currentScene = anim.currentScene();
        currentScene.oncomplete();
        currentScene.timeElapsed(0);

        anim.currentScene(anim._remainingScenes.shift());
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
  function _runCurrentScene(anim) {
    var scene = anim.currentScene();

    if (scene.timeElapsed() < 1) {
      scene.onstart();
    }

    var elements = scene.elements;
    for(var i = 0, len = elements.length; i < len; i++) {
      elements[i](anim);
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

    anim.clearCurrentScene();
  }
})();

