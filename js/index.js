

// general
var c = document.getElementById("typewriter"),
	 ctx = c.getContext("2d"),
	 docElem = document.documentElement,
	 background_image = new Image(),
	 background_pattern,
	 requestAnimFrame = (function(){
		 return window.requestAnimationFrame ||
			 window.webkitRequestAnimationFrame ||
			 window.mozRequestAnimationFrame    ||
			 function ( callback ) {
			 window.setTimeout(callback, 1000 / 60);
		 };
	 })();

// constants
var DEVICE_PIXEL_RATIO = 2,
	 POSX = 50,
	 POSY = 50, 
	 ALPHA_MAX = 0.7,
	 ALPHA_VARIANCE = 0.1,
	 WELCOME_TEXT = 'تایپ کنید',
	 LETTER_WIDTH = 12,
	 LETTER_HEIGHT = 20,
	 LETTER_SIZE = LETTER_HEIGHT,
	 LETTER_JITTER = .3,
	 LETTER_ROTATE = .05,
	 TEXT_COLOR = '#251510',
	 NAV_BUTTONS = {
		 8 : 'moveleft',
		 37 : 'moveleft',
		 38 : 'moveup',
		 39 : 'moveright',
		 40 : 'movedown',
		 13 : 'newline',
	 };

// variables
var chars = [],
	 posx = POSX, 
	 posy = POSY,
	 left_extent = POSX * 2,
	 bottom_extent = POSY * 2,
	 alpha = ALPHA_MAX,
	 is_focused = false,
	 is_updated = true,
	 jittered_char_pos = {},
	 rotated_char_pos = {};

// jQuery
var $canvas = $(c),
	 $doc = $(document),
	 $focus = $('#focus'),
	 $save = $('#save'),
	 font_loaded = $.Deferred();

// app is ready
resize();
draw();
window.onresize = resize;

// event handlers
$save.on('click', save);

$canvas.on('click', function( e ) {
	$focus.focus();
	if (chars.length) {
		//move to a location
		console.log(e);
		chars.push({
			value: 'moveto',
			posx : e.offsetX,
			posy : e.offsetY
		});
	}
});

$doc.on('keydown', function (e) {
	$focus.focus();
	// just once
	$doc.off(e);
});

var cnsle = $('#console'),
	 num = 0;

function eventOutput (e) {
	var obj = {};
	for (var k in e) {
		var val = e[k];
		if (typeof(val) !== 'object' &&
			 typeof(val) !== 'function') {
			obj[k] = val;
		}
	}
	return JSON.stringify(obj);
}

$focus.on('focus blur', function ( e ) {
	this.value = ' ';
	is_focused = (e.type === 'focus');

}).on('keyup', function ( e ) {
	var _this = this,
		 nav_button = NAV_BUTTONS[ e.which ],
		 value = nav_button || this.value.substr( 1 );

	if ( !value ) return;
	$('<p>', {
		text : (++num) + '. keyup: ' + eventOutput(e)
	}).appendTo(cnsle);

	// wipe input to handle one character at a time.
	// leave a single space so that mobile isn't forced to upper case
	//		  setTimeout(function () {
	_this.value = ' ';
	//  }, 50);

	if ( nav_button ) {

		addToChars( value );

	} else {
		// update multiple characters in case they keydown more than keyup
		for (var i = 0, len = value.length; i < len; i++) {
			var single_char = value[ i ];

			if ( !jittered_char_pos[ single_char ] ) {
				// save general position
				jittered_char_pos[ single_char ] = randomBetweenRange(-LETTER_JITTER, LETTER_JITTER);
				rotated_char_pos[ single_char ] = randomBetweenRange(-LETTER_ROTATE, LETTER_ROTATE);
			}
			addToChars( single_char );
		}
	}

});

function addToChars ( char ) {
	var jitter_y = (function () {
		var general_position = jittered_char_pos[ char ] || 0;
		return general_position + randomBetweenRange(-LETTER_JITTER, LETTER_JITTER);
	})(),
		 rotate_xy = (function () {
			 var general_position = rotated_char_pos[ char ] || 0;
			 return general_position + randomBetweenRange(-LETTER_ROTATE, LETTER_ROTATE);
		 })();
	alpha -= .0001;
	console.log(rotate_xy);
	chars.push({
		opacity: randomBetweenRange(alpha - ALPHA_VARIANCE, alpha),
		value: char,
		jitter_y : jitter_y,
		rotate_xy : rotate_xy
	});
}

function draw () {

	requestAnimFrame( draw );

	if ( !is_updated ) return;

	posx = POSX;
	posy = POSY;

	ctx.clearRect(0, 0, c.width, c.height);
	ctx.fillStyle = TEXT_COLOR;

	for (var i = 0, len = chars.length; i < len; i++) {
		var charobj = chars[i];
		typeChar(charobj);
	}
	if (is_focused) {
		drawCursor();
	} else if (!chars.length) {
		var centerX = (c.width / 2) / DEVICE_PIXEL_RATIO,
			 centerY = ((c.height / 2) - (LETTER_HEIGHT / 2)) / DEVICE_PIXEL_RATIO;
		ctx.textAlign = 'center';
		ctx.font = (LETTER_SIZE*2) + "px Special Elite, serif";
		ctx.fillText(WELCOME_TEXT, centerX, centerY);
		ctx.font = LETTER_SIZE + "px Special Elite, serif";
		ctx.textAlign = 'left';
	}
}

function typeChar ( charobj ) {
	var value = charobj.value,
		 opacity = charobj.opacity,
		 jitter_y = charobj.jitter_y,
		 rotate_xy = charobj.rotate_xy,
		 x, y;

	if (value === 'moveleft') {
		posx -= LETTER_WIDTH;
	} else if (value === 'moveup') {
		posy -= LETTER_HEIGHT;
	} else if (value === 'movedown') {
		posy += LETTER_HEIGHT;
	} else if (value === 'moveright') {
		posx += LETTER_WIDTH;
	} else if (value === 'newline') {
		posx = POSX;
		posy += LETTER_HEIGHT;
	} else if (value === 'moveto') {
		posx = charobj.posx;
		posy = charobj.posy;
	} else {
		x = posx;
		y = posy + jitter_y;

		ctx.globalAlpha = opacity;
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate( rotate_xy );
		ctx.fillText(value, 0, 0);
		ctx.restore();

		// move cursor onward
		posx += LETTER_WIDTH;
	}
	// update extents
	left_extent = Math.max(left_extent, posx);
	bottom_extent = Math.max(bottom_extent, posy);
}

function drawCursor() {
	ctx.fillStyle = 'red';
	ctx.globalAlpha = ALPHA_MAX;
	ctx.fillText('_', posx, posy);
	ctx.fillStyle = TEXT_COLOR;
}

function randomBetweenRange(min, max) {
	var value = (Math.random() * (max - min)) + min;
	return value;
}

function resize (alt_canvas) {
	var width = docElem.clientWidth,
		 height = docElem.clientHeight;
	c.width = width;
	c.height = height;

	makeCanvasRetinaProof(c, width, height);

	ctx.font = LETTER_SIZE + "px Special Elite, serif";
	ctx.globalAlpha = alpha;
}

function makeCanvasRetinaProof (canvas, width, height) {
	if (DEVICE_PIXEL_RATIO) {
		canvas.width = width * DEVICE_PIXEL_RATIO;
		canvas.height = height * DEVICE_PIXEL_RATIO;
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
		canvas.getContext('2d').scale(DEVICE_PIXEL_RATIO, DEVICE_PIXEL_RATIO);
	}
}

function save () {
	var temp = document.createElement('canvas'),
		 tctx = temp.getContext('2d'),
		 square_size = Math.max(Math.max(left_extent, bottom_extent) + POSX, 640);

	// crop canvas to content extents + padding
	makeCanvasRetinaProof(temp, square_size, square_size);

	// draw onto temp canvas
	tctx.drawImage(c, 0, 0);

	// output image
	window.open( temp.toDataURL('image/jpeg', 1.0) );
}