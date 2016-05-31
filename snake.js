var SnakeGame = {
    lost: false,
    won: false,
    board: {
        width: 500,
        height: 500,

        //clear the field for re-rendering
        clear: function () {
          document.getElementById("fieldEl").innerHTML = "";
        },

        //the "wall" of the playing field
        border: [],

        init: function (game, size) {
            var b = Object.create(game.Block);

            //give it the graphical properties of a generic block, but also of a wall
            //It's important to note that while this is done like this because of CSS classes,
            //you could easily keep the same styling functionality and reuse it, but on a
            //different rendering method, like Canvas
            b.style = "block wall";

            //When you hit a wall, you *die*
            b.collision = function() {
                game.lost = true;
            };

            b.size = size;

            //add blocks across the top and bottom of the board
            for(var i=0; i < this.width / size; i++) {
                var b1 = Object.create(b), b2 = Object.create(b);
                b1.position = {x: i, y: -1};
                b2.position = {x: i, y: this.height / size};
                game.blocks.push(b1, b2);
            }

            //add blocks up the sides of the board
            for(var j = -1; j < this.height / size + 1; j++) {
                var b3 = Object.create(b), b4 = Object.create(b);
                b3.position = {x: -1, y: j};
                b4.position = {x: this.width / size, y: j};
                game.blocks.push(b3, b4);
            }
        }
    },

    //this contains ALL the blocks used in the game, from food to snake segments to wall pieces.
    //Blocks MUST be in here to even get rendered.
    blocks: [],

    //this is our generic block object
  Block: {
    //X & Y positions
    position: {x: 0,y: 0},

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
        this.board.clear();
        var i = 0, l = this.blocks.length;
        for(;i<l;i++){
            this.blocks[i].render();
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
		init: function (game, length, size, direction) {
		  this.direction = direction;
		  //make sure we didn't make the snake too big for the first row
		  length = length > game.board.width / size ? game.board.width / size : length;
		  var i = length - 1;
		  for(; i >= 0; i--){
			this.addSegment(game, size, {x: i, y: Math.floor(game.board.height /size / 2)});
		  }
		  this.segments[0].style = "head block";
		},

		addSegment: function(game, size, pos) {
			//create a new segment (based off the generic game block)
			var segment = Object.create(game.Block);
			segment.size = size;
			segment.position = pos;
            if (this.segments.length > 0) {
			    segment.collision = function() { game.lost = true;}
            }

			//add it to the snake and the Game blocks
			this.segments.push(segment);
			game.blocks.push(segment);

			//Update the score
			document.getElementById("score").innerHTML = this.segments.length;

			//see if we need to update hiscore
			if(this.segments.length > localStorage.getItem("hiscore")) {
				localStorage.setItem("hiscore", this.segments.length);
				document.getElementById("hiscore").innerHTML = this.segments.length;
			}
		},

		move: function(game, x, y) {
      		//make sure we didn't pass in anything too big by accident.
			if (x > 1) x = 1;
			else if (x < -1) x = -1;
			if(y > 1) y = 1;
			else if(y < -1) y = -1;

			var i = 1;
			var head = this.segments[0];
			var lastPos = head.position;
			head.position = {x: head.position.x + x, y: head.position.y + y};
			//move the segment behind the head to where the head was, then the next to where that was, etc...
			for(; i < this.segments.length; i++) {
				var temp = this.segments[i].position;
				this.segments[i].position = lastPos;
				lastPos = temp;
			}
			//add a segment if need be
			if(this.grow > 0) {
				this.grow--;
				this.addSegment(game, this.segments[0].size,lastPos);
			}
			this.segments[0] = head;
			//Check against all game blocks for another block in the same location.
			//If there's a block there, fire its collision event
			var k = 0;
			for(; k < game.blocks.length; k++) {
				if(head !== game.blocks[k] && head.position.x === game.blocks[k].position.x && head.position.y === game.blocks[k].position.y) {
					game.blocks[k].collision();
				}
			}
		}
	},

	start: function() {
    	this.update();
   	},
    makeFood: function() {
        var self = this;
        var food = Object.create(this.Block);
		food.size = 20;

		//style this as food so it's visually different.
		food.style = "food";

		//create an extended method to reset the food's location every time it gets eaten.
		food.place = function() {
			food.position = {
				x: Math.floor(Math.random() * self.board.width / food.size),
				y: Math.floor(Math.random() * self.board.height / food.size)
			};
		};

		//lay out the food
		food.place();
		//set up the colission event to grow the snake and re-position the food.
		//note that you could easily make more "food" and set the snake to grow by more.
		//You could totally modify the colission event to do whatever you want.
		food.collision = function() {
		  self.snake.grow = self.snake.grow + 1;
		  this.place();
		};

		this.blocks.push(food);
   },

	init: function(foodNum) {
		var self = this;
		//display current hiscore
		var hsel = document.getElementById("hiscore");
		if(localStorage.getItem("hiscore") > 0) {
			hsel.innerHTML = localStorage.getItem("hiscore");
		} else hsel.innerHTML = 0;

		//set up the snake with three segments, sized @ 20, ready to move right.
		this.snake.init(this, 3, 20, "right");

		this.board.init(this, 20);

        if(foodNum === -1) { foodNum = 1; }
        for(var i = 0; i < foodNum; i++) {
            this.makeFood();
        }

	    this.render();

		//wire up the key events to change teh snake's direction
		document.onkeydown = function(e) {
		    if ((e.keyCode === 37 || e.keyCode === 65) && this.snake.direction !== 'right') {
                this.snake.direction = 'left';
            } else if ((e.keyCode === 38 || e.keyCode === 87) && this.snake.direction !== 'down') {
                this.snake.direction = 'up';
		    } else if ((e.keyCode === 39 || e.keyCode === 68) && this.snake.direction !== 'left') {
                this.snake.direction = 'right';
		    } else if ((e.keyCode === 40 || e.keyCode === 83) && this.snake.direction !== 'up') {
                this.snake.direction = 'down';
            }
		}.bind(this);

		//...and the click events
		document.getElementById("restart").onclick = this.restart.bind(this)
		document.getElementById("start").onclick = this.start.bind(this);
	 },
	update: function() {
		//If we haven't lost yet...
		if(!this.lost) {
			//move snake based on direction
			var dir = this.snake.direction;
			if(dir==="left") this.snake.move(this, -1, 0);
			else if(dir==="right") this.snake.move(this, 1,0);
			else if(dir==="up") this.snake.move(this, 0,-1);
			else this.snake.move(this, 0,1);
			//re-render.
			this.render();
			//If you wanted, you coudl modify the timeout function to
			//decrease the time based on how many segments the snake has
			this.timer = setTimeout(this.update.bind(this), 100);
		}
		else {
			//if we did lose, put up the big annoying GAME OVER sign
		 	document.getElementById("youlose").style.display = "block";
		  	document.getElementById("tryagain").onclick = function() {
				document.getElementById("youlose").style.display = "none";
				clearTimeout(this.timer); //clear the pointless timer from continuing to run
		  	}.bind(this);
		}
  },
  //Restart. duh.
  restart:function() {
    this.lost = false; //reset
    this.won = false; //reset
    this.blocks = []; //clear blocks
    this.snake.segments = []; //clear snake
    this.snake.direction = ""; //clear direction
    this.snake.grow = 0; //clear growing
    this.board.clear();  //clear board
    this.init(parseInt(document.getElementById("foodNum").value,10));
    this.start();
  },
  timer:0 //timer to hold the update function interval
};
