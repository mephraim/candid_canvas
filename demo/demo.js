window.onload = function() {
  // Create a new Animator that is attached to the page's canvas element
  var animator = CandidCanvas.createAnimator(document.getElementById('canvas'));

  animator.addScenes(Scene1.get(),
                     Scene2.get());
  animator.loop();

  addEventHandlers(animator);
};

function addEventHandlers(anim) {
  document.getElementById("play").addEventListener('click', function() {
    anim.play();
  });

  document.getElementById("pause").addEventListener('click', function() {
    anim.pause();
  });

  document.getElementById("loop").addEventListener('click', function() {
    anim.loop();
  });

  document.getElementById("stop").addEventListener('click', function() {
    anim.reset();
  });
}

var Scene1 = {
  get: function() {
    // Create a new scene that will last 10 seconds
    var scene = CandidCanvas.createScene({ duration: 3000 });

    // Add an element that draws the background for each tick
    scene.addElement(General.getDrawBackground("#080808"));

    // Add an element that draws a rotating circle
    scene.addElement(Scene1.getCircleDraw(180, 540, 50, "#D2EC4C"));

    // Add an element that draws another rotating circle
    scene.addElement(Scene1.getCircleDraw(0, 360, 40, "#4CCDED"));

    // Finally, one more circle, but rotate it faster
    scene.addElement(Scene1.getCircleDraw(90, 810, 30, "#F39B3E"));

    return scene;
  },


  // This function builds a function that will be used as a scene element
  // that draws circle. The scene element will behave differently, depending
  // on the params that are passed to function that builds the element.
  //
  // See the usage above for different parameters being passed in to build
  // slightly different scene elements.
  getCircleDraw: function (startAngle, endAngle, circleRadius, color) {
    var totalAngleChange = endAngle - startAngle;
    var rotationRadius = 150;

    return function(anim) {
      var ctx = anim.context();
      var scene = anim.currentScene();

      var rotationAmt = (totalAngleChange / scene.duration()) * scene.timeElapsed();
      var currentAngle = startAngle + rotationAmt;

      var point = Scene1.getCoordsFromAngle(rotationRadius, currentAngle);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(200 + point.x, 200 + point.y, circleRadius, 0, Math.PI * 2, true);
      ctx.fill();
    };
  },

  getCoordsFromAngle: function (radius, angle) {
    var angleInRads = angle * (Math.PI / 180);

    return { x: radius * Math.cos(angleInRads),
             y: radius * Math.sin(angleInRads) };
  }
};

var Scene2 = {
  get: function() {
    var scene = CandidCanvas.createScene({duration: 2000});
    scene.addElements(General.getDrawBackground("#95E681"),
                      Scene2.drawText,
                      Scene2.drawStatus);

    return scene;
  },

  // A function to draw some text to the screen
  drawText: function(anim) {
    var ctx = anim.context();
    ctx.restore();
    ctx.save();

    ctx.fillStyle    = "#FFF";
    ctx.font         = "60px Helvetica";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    ctx.fillText("SCENE 2", 200, 200);

    ctx.restore();
    ctx.save();
  },

  drawStatus: function(anim) {
    var startX = 0;
    var endX = 400;
    var y = 350;

    var changeX = endX - startX;

    var scene = anim.currentScene();

    var ctx = anim.context();
    ctx.restore();
    ctx.save();

    ctx.strokeStyle = "#515F4D";
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.moveTo(startX, y);

    var xPos = (changeX / scene.duration()) * scene.timeElapsed();
    ctx.lineTo(xPos, y);
    ctx.stroke();

    ctx.restore();
    ctx.save();
  }
};

var General = {
  // This function builds a function that will be used to draw the background
  // for an animation.
  getDrawBackground: function(color) {
    return function(anim) {
      var ctx = anim.context();
      ctx.restore();
      ctx.save();

      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 400, 400);

      ctx.restore();
      ctx.save();
    };
  }
};
