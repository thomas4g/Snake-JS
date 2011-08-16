var Game = {
  lost:false,
  won:false,
  board: {
    width:500,
    height:500,
    //clear the field for re-rendering
    clear:function() { 
      document.getElementById("fieldEl").innerHTML = "";
    },
    //the "wall" of the playing field
    border:[],
    init:function(s) {
      //create a new block inheriting from the generic Game block
      var b = Object.create(Game.block);
      //give it the graphical properties of a generic block, but also of a wall
      //It's important to note that while this is done like this because of CSS classes, 
      //you could easily keep the same styling functionality and reuse it, but on a 
      //different rendering method, like Canvas
      b.style = "block wall";
      //When you hit a wall, you *die*
      b.collision = function() {
          Game.lost = true;
        };
      b.size = s;
      //add blocks across the top and bottom of the board
      for(var i=0;i<Game.board.width/s;i++) {
        var b1 = Object.create(b), b2=Object.create(b);
          b1.position = {x:i,y:-1};
          b2.position = {x:i,y:Game.board.height/s};
        Game.blocks.push(b1,b2);
      }
      //add blocks up the sides of the board
      for(var j = -1; j<Game.board.height/s + 1;j++) {
        var b3 = Object.create(b), b4=Object.create(b);
        b3.position = {x:-1,y:j};
        b4.position = {x:Game.board.width/s,y:j};
      Game.blocks.push(b3,b4);
      }
    }
  },
  //this contains ALL the blocks used in the game, from food to snake segments to wall pieces. 
  //Blocks MUST be in here to even get rendered.
  blocks: [],
  //this is our generic block object
  block: {
    //X & Y positions
    position:{x:0,y:0},
    //A size. It's important to note that currently the size only affects the rendered output
    //Colission detection is done on a grid system, so even if the rendered size is smaller than
    //a grid square, colission still occurs. This could be visually confusing, so currently
    //I'm rendering all blocks the same size. 
    size: 0,
    //generic visual style of the block
    style:"block",
    //create a span, style it, render. You'd need to only update this and one or two other spots for changin
    //how rendering works
    render: function() {
      var el = document.createElement("span");
      el.className = this.style;
      el.style.width = this.size;
      el.style.height = this.size;
      el.style.left = this.position.x * this.size +"px";
      el.style.top = this.position.y * this.size +"px";
      document.getElementById("fieldEl").appendChild(el); 
    },
    collision: function(){}
  },
    //The Game's render function: clear the board; then render all the blocks.
  render: function() {
    Game.board.clear();
    var i=0,l=Game.blocks.length;
    for(;i<l;i++){
     Game.blocks[i].render();
    }
  },
  snake: {
    //the direction the snake is moving
    direction: "",
    //an array of the snake's body parts :)
    segments: [],
    //increment this to have the snake grow by 1 each move until it's decreased to zero. 
    grow:0,
    //initialize
    init: function(l, s, _direction) {
      Game.snake.direction = _direction;
      //make sure we didn't make the snake too big for the first row
      l = l >Game.board.width/s ? Game.board.width/s : l;
      var i=l-1;
      for(;i>=0;i--){
        Game.snake.addSegment(s,{x:i,y:Math.floor(Game.board.height/s/2)});
      }
      Game.snake.segments[0].style = "head block";
      Game.snake.segments[0].collision = function(){};
    },
    //grow the snake! 
    addSegment: function(s,pos) 
    {
      //create a new segment (based off the generic game block)
        var segment = Object.create(Game.block);
        segment.size = s;
        segment.position = pos;
        if(Game.snake.segments.length > 0){ 
          segment.collision = function() {Game.lost = true;}
        }
      //add it to the snake and the Game blocks
        Game.snake.segments.push(segment); 
        Game.blocks.push(segment);
      //Update the score
      document.getElementById("score").innerHTML = Game.snake.segments.length;
      //see if we need to update hiscore
       if(Game.snake.segments.length > localStorage.getItem("hiscore")) {
       localStorage.setItem("hiscore",Game.snake.segments.length);
         document.getElementById("hiscore").innerHTML = Game.snake.segments.length;
      }
    },
    //move it. duh. 
    move:function(_x,_y) {
      //make sure we didn't pass in anything too big by accident.
      if(_x>1) _x = 1;
      else if(_x<-1) _x = -1;
      if(_y>1) _y = 1;
      else if(_y<-1) _y = -1;
      var i = 1;
      //grab the snake's head
     var head = Game.snake.segments[0];
      //grab the head's current position
      var lastPos = head.position;
      //move the head
      head.position = {x: head.position.x + _x, y:head.position.y + _y};
      //move the segment behind the head to where the head was, then the next to where that was, etc...
      for(;i<Game.snake.segments.length;i++) {
        var temp = Game.snake.segments[i].position;
        Game.snake.segments[i].position = lastPos;
        lastPos = temp;
      }
      //add a segment if need be
      if(Game.snake.grow>0) {
         Game.snake.grow--;
        Game.snake.addSegment(Game.snake.segments[0].size,lastPos);
      }
      Game.snake.segments[0] = head; 
      //Check against all game blocks for another block in the same location.
      //If there's a block there, fire its collision event
      var k=0;
      for(;k<Game.blocks.length;k++) {
        if(head.position.x === Game.blocks[k].position.x && head.position.y === Game.blocks[k].position.y) {
          Game.blocks[k].collision();
        }
      }
    }
  },
  //Bombs away!!
  start: function() {
    Game.update();
   },
   makeFood: function() {
    //Yum
    var food = Object.create(Game.block);
    food.size = 20;
    //style this as food so it's visually different.
    food.style = "food";
    //create an extended method to reset the food's location every time it gets eaten.
    food.place = function() {
      food.position ={x: Math.floor(Math.random()*Game.board.width/food.size), y:Math.floor(Math.random()*Game.board.height/food.size)};
    };
    //lay out the food
    food.place();
    //set up the colission event to grow the snake and re-position the food.
    //note that you could easily make more "food" and set the snake to grow by more. 
    //You could totally modify the colission event to do whatever you want.
    food.collision = function() {
      Game.snake.grow = Game.snake.grow + 1;
      this.place();
    };
    //add the food to the blocks
    Game.blocks.push(food);
   },
   //You do know what init stands for, right?
  init: function() {
    //display current hiscore
    var hsel = document.getElementById("hiscore");
    if(localStorage.getItem("hiscore") > 0) hsel.innerHTML = localStorage.getItem("hiscore");
    else hsel.innerHTML = 0;
    //set up the snake with three segments, sized @ 20, ready to move right.
    Game.snake.init(3,20, "right");
    //Init the board.
    Game.board.init(20);
    Game.makeFood();
    Game.makeFood();
    //do an initial render
    Game.render();
    //wire up the key events to change teh snake's direction
    document.onkeydown = function(e) {
      if((e.keyCode === 37 || e.keyCode === 65) && Game.snake.direction !== "right")Game.snake.direction="left";
      else if((e.keyCode === 38 || e.keyCode === 87)&& Game.snake.direction !== "down") Game.snake.direction="up";
      else if((e.keyCode === 39 || e.keyCode === 68)&& Game.snake.direction !== "left") Game.snake.direction="right";
      else if((e.keyCode === 40 || e.keyCode === 83) && Game.snake.direction !== "up") Game.snake.direction="down";
    };
    //...and the click events
    document.getElementById("restart").onclick = Game.restart;
    document.getElementById("start").onclick = Game.start;
 },
  //Insert another blatantly obvious comment here.
  update: function() {
    //If we haven't lost yet...
    if(Game.lost !== true) {
      //move snake based on direction
      var dir = Game.snake.direction;
      if(dir==="left") Game.snake.move(-1,0);
      else if(dir==="right") Game.snake.move(1,0);
      else if(dir==="up") Game.snake.move(0,-1);
      else Game.snake.move(0,1);
      //re-render.
      Game.render(); 
      //come back soon!
      //If you wanted, you coudl modify the timeout function to 
      //decrease the time based on how many segments the snake has
      Game.timer=setTimeout(Game.update, 100);
    }
    else {
      //if we did lose, put up the big annoying GAME OVER sign
     document.getElementById("youlose").style.display = "block"; 
      document.getElementById("tryagain").onclick = function() {
        document.getElementById("youlose").style.display = "none";  
        clearTimeout(Game.timer); //clear the pointless timer from continuing to run
      };
    }
  },
  //Restart. duh. 
  restart:function() {
    Game.lost = false; //reset
    Game.won = false; //reset
    Game.blocks = []; //clear blocks 
    Game.snake.segments = []; //clear snake 
    Game.snake.direction = ""; //clear direction
    Game.board.clear();  //clear board
    Game.init();
    Game.start();
  },
  timer:0 //timer to hold the update function interval
}; 
window.onload = function() {
Game.init();
};



