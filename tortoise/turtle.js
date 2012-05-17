var Turtle = function(originx, originy, paper) {
  this.paper = paper;
  this.originx = originx;
  this.originy = originy;
  this.clear();
};

Turtle.prototype.clear = function() {
  this.paper.clear();
  this.x = this.originx;
  this.y = this.originy;
  this.angle = 90;
  this.color = '#CC6600';
  this.opacity = 1.0;
  this.pen = true;
  this.turtleimg = undefined;
  this.updateTurtle();
};

Turtle.prototype.updateTurtle = function() {
  if(this.turtleimg === undefined) {
    this.turtleimg = this.paper.image(
      "http://nathansuniversity.com/gfx/turtle2.png",
      0, 0, 64, 64);
  }
  this.turtleimg.attr({
    x: this.x - 32,
    y: this.y - 32,
    transform: "r" + (-this.angle)});
  this.turtleimg.toFront();
};

Turtle.prototype.drawTo = function(x, y) {
  var x1 = this.x;
  var y1 = this.y;
  var params = { 
    "stroke-width": 4,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "stroke": this.color,
    "stroke-opacity": this.opacity
  };
  var path = this.paper.path(Raphael.format("M{0},{1}L{2},{3}",
    x1, y1, x, y)).attr(params);
};

Turtle.prototype.forward = function(d) {
  var newx = this.x + Math.cos(Raphael.rad(this.angle)) * d;
  var newy = this.y - Math.sin(Raphael.rad(this.angle)) * d;
  if(this.pen) {
    this.drawTo(newx, newy);
  }
  this.x = newx;
  this.y = newy;
  this.updateTurtle();
};

Turtle.prototype.right = function(ang) {
  this.angle -= ang;
  this.updateTurtle();
};

Turtle.prototype.left = function(ang) {
  this.angle += ang;
  this.updateTurtle();
};

var newTurtleEnv = function(turtle) {
  return {
    bindings: {
      forward: function(d) {
        turtle.forward(d);
      },
      right: function(ang) {
        turtle.right(ang);
      },
      left: function(ang) {
        turtle.left(ang);
      }
    },
    outer: null
  };
};
