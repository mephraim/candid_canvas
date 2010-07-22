# Candid Canvas 

## What is Candid Canvas?
Creating an animation using the HTML Canvas element can be a chore. Keeping track of all of the elements you want to draw to the canvas and managing the status of the animation itself can get complicated very quickly. 

**But have no fear!** The Candid Canvas library is designed to make the process of creating Canvas animations fun and easy! 

### Candid Canvas Supports
* Scenes with many different drawing elements
* Setting the duration for each individual scene of an animation
* Multiple scenes per animation
* Pausing and restarting animations
* Looping animations 
* And much much more!
 
### Candid Canvas won't 
* Add any special drawing tools to the Canvas
* Work in Internet Explorer. Because the Canvas tag won't _(yet)_.

## Getting Started

### Create an Animator
To create an animation with Candid Canvas, you need to first create an _Animator_ that will manage the animation

	var animator = CandidCanvas.createAnimator(yourCanvas);

The _CandidCanvas.createAnimator_ takes in a Canvas element that will be used for the animation.

### Make a Scene
Once you have your animator, you can create a new scene to add to the animator

	var scene = CandidCanvas.createScene({ duration: 1000 });

The _CandidCanvas.createScene_ method takes an options object that will be used to configure the scene. The _duration_ option specifies duration, in milliseconds, of the scene being created.

You can add your new scene to the animation using the animator's _addScene_ method

	animator.addScene(scene);

Scenes will be played in the order that you add them to the animator. If you want to add multiple scenes at once, you can use the _addScenes_ method

	animator.addScenes(scene1, scene2);

The added scenes will be played in the order they were passed in to the method.

### Add some elements
Candid Canvas scenes are made up of _"elements"_. Each element is a JavaScript function will be called at each _tick_ of the animation. Each element function takes in one parameter for the animator, which will be passed to the element when it is called. You can add an element to a scene using the _addElement_ method

	scene.addElement(function(anim) {
		var context = anim.context();
		var scene = anim.currentScene();
		
		// Do something with the context or current scene	
	});

Elements will be executed in the order they were added to the scene. You can add multiple elements to a scene using the _addElements_ method

	scene.addElements(element1, element2);

Elements will be executed in the order they were passed to the _addElements_ method.

### Animate!

Once you've added elements to a scene, you're ready to start playing your animation

	animator.play();

The _play_ method will play through the whole animation once. If you'd like to loop the animation you can use the _loop_ method

	animator.loop();

You can also pause your animation

	animator.pause();

And reset it back to the beginning

	animator.reset();

When an animation is reset, it will also reset the current scene's status back to the beginning.

**See the included demo for more usage examples!**
