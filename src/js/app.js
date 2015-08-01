/*
    TetrisFOX
    Description : The famous game Tetris made for FirefoxOS
    Author      : RobertoPC
    Author URI  : http://robertopc.com.br
    Version     : 1.1.0

    Modification log:
    ; 30 Jun 2015 - 1.1.0
    ; * Changed l10n script
    ; * Changed height of screen
    ; * Changed images PNG for SVG
    ; * Added load screen
    ; * Improved source
    ; * Automatized load screen fadeout
    ; 26 Dez 2014 - 1.0.0
    ; * Initial Release
*/
(function(){

// -----------------------------------------------------------------------------
// HELPERS ---------------------------------------------------------------------
// -----------------------------------------------------------------------------

function id( value ) {
    return document.getElementById( value );
}

function classcss( value, cssprop, cssval ) {

    var elements = document.getElementsByClassName( value );

    for( var i=0, len=elements.length; i < len; i++ ) {
        // set css property to class element
        eval( 'elements[' + i +'].style.' + cssprop + ' = "' + cssval + '";' );
    }
}

// -----------------------------------------------------------------------------
// VARIABLES -------------------------------------------------------------------
// -----------------------------------------------------------------------------

var

w = window,
d = document,
s = localStorage,

// set up animation object
requestAnimationFrame = w.requestAnimationFrame ||
                        w.mozRequestAnimationFrame ||
                        w.webkitRequestAnimationFrame ||
                        w.msRequestAnimationFrame,

// debug object
debug = {
    active            : false, // enable/disable debug
    randomPieceReturn : null   // set manually the random pieces ( 0 - 6 ), if null no set piece
},

// game settings
settings = {
    pause: false,
    audio: true,
    about: false
},

// current piece object
currentPiece =  {
    m : null,  // matrix of the piece
    x : null,  // coordinate X of the piece in grid
    y : null,  // coordinate Y of the piece in grid
    r : null,  // quantity of rows
    c : null,  // quantity of columns
    e : false // flag for set if piece are in the end of the grid
},

// next piece object
nextPiece = null,

// time of the step in milliseconds
stepTime = 500,

// game loop
loopId   = null,
start    = false,
firsTime = true,

// flag for the last step time
lastStepTime = 0,

// window size
windowWidth = w.innerWidth || w.clientWidth,
windowHeight = w.innerHeight || w.clientHeight,

// if window greater than mobile, reduce size
windowWidth = ( windowWidth < 960 )? windowWidth : 320 ,
windowHeight = ( windowWidth != 320 )? windowHeight : 480 ,

// canvas game
canvasScreen = id( 'screen' ),
canvasScreen = canvasScreen.getContext( '2d' ),

// canvas next piece
canvasNextPiece = id( 'screenNextPiece' ),
canvasNextPiece = canvasNextPiece.getContext( '2d' ),

// block sizes
blockSizeWidth = windowWidth * 0.0625, // width of the block in pixels
blockSizeHeight =  windowHeight * (0.0833 / 2), // height of the block in pixels

// color palette
colors = [
    'white',
    'red',
    'orange',
    'gold',
    'green',
    'blue',
    'indigo',
    'violet',
    'black'
],

// initialize grid matrix
grid = {
    m : [
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0]
        ],
    r : 20, // rows
    c : 10  // columns
},

// initialize next piece grid matrix
gridnextPiece = {
    m : [
        [0,0,0,0,0],
        [0,0,0,0,0]
        ],
    r : 2, // rows
    c : 5  // columns
},

// matrix with the shapes of the pieces
pieces = [
    [
        [1,1],// ##
        [1,1] // ##
    ],
    [
        [0,0,2],//   #
        [2,2,2] // ###
    ],
    [
        [3,0,0],// #
        [3,3,3] // ###
    ],
    [
        [4,4,0],// ##
        [0,4,4] //  ##
    ],
    [
        [0,5,5],//  ##
        [5,5,0] // ##
    ],
    [
        [0,6,0],//  #
        [6,6,6] // ###
    ],
    [
        [7,7,7,7]// ####
    ]
],

// store the score of the game
score = 0,

// store the current level
level = 1,
currentLevel = 1,

// count of rows
rows = 0,

// get record from localstorage
record = ( s.getItem('record') != null )? s.getItem('record') : 0 ,

// control of key downs
keyDowns = [],

// -----------------------------------------------------------------------------
// FUNCTIONS -------------------------------------------------------------------
// -----------------------------------------------------------------------------

// main visibility API function
// use visibility API to check if current tab is active or not
// source http://greensock.com/forums/topic/9059-cross-browser-to-detect-tab-or-window-is-active-so-animations-stay-in-sync-using-html5-visibility-api/
vis = (function(){
    var stateKey,
        eventKey,
        keys = {
                hidden: "visibilitychange",
                webkitHidden: "webkitvisibilitychange",
                mozHidden: "mozvisibilitychange",
                msHidden: "msvisibilitychange"
    };
    for (stateKey in keys) {
        if (stateKey in document) {
            eventKey = keys[stateKey];
            break;
        }
    }
    return function(c) {
        if (c) document.addEventListener(eventKey, c);
        return !document[stateKey];
    }
})();//vis

// main function of the game
function main() {

    if( ! settings.pause ) {

        setRecord(); // set game record

        // if not iniatilized the current piece
        // or if the same came to end
        // if true, randomize a new piece
        if( currentPiece.m == null || currentPiece.e ) {

            // fixed the piece in grid
            drawPiece( true );

            // if was game over
            wasGameOver();

            // verify filled rows
            verifyRows();

            // if next piece defined,
            // current piece will be the next piece
            // else, randomize new piece
            currentPiece = ( nextPiece != null )? nextPiece : randomPiece();

            // randomize next piece
            nextPiece = randomPiece();

            // set quantity of rows of piece
            currentPiece.l = mLines( currentPiece.m );

            // set quantity of columns of piece
            currentPiece.c = mColumns( currentPiece.m );

            // set the Y of the piece like quantity of rows * -1
            // for that piece starting out of the grid
            currentPiece.y = currentPiece.l * -1;

            // set the X of the piece for center of the grid
            currentPiece.x = ( grid.c - currentPiece.c )  / 2;
            currentPiece.x = Math.floor( currentPiece.x );

            // add score of the piece
            addScore( 10 );

            // set end flag
            currentPiece.e = false;
        }

        // move automatically the piece for down
        moveDown();

        // draw the game
        drawPiece( false );
        drawGrid();
        drawNextPiece();

        // if debug is active
        if( debug.active ) {

            appConsoleClear();
            appConsole( 'Step Time : '+ stepTime );
            appConsole( 'Y : '+ currentPiece.y + ' X : '+ currentPiece.x );
            appConsole( JSON.stringify( grid.m )
                            .replace( /\],\[/g , ' |<br>| ' )
                            .replace( '[[' , '' )
                            .replace( ']]', ' |' )
                            .replace(/,/g,' ')
                            .replace(/^/g,'| ')
                            .replace(/0/g,'.')
                            .replace(/\s+?(\-[0-9]+)/g, '$1')
                            .replace(/-/g,' ')
            );
        }
    }
}//Main

function mainLoop() {

    var now = new Date().getTime() || Date().now();

    start = ! start ? now : start;

    var progress = now - start;

    // if passed step time or first time in loop
    if ( firsTime || progress > stepTime ) {

        // if first time
        if( firsTime ) {

            id( 'screen' ).setAttribute('width', windowWidth * 0.625);
            id( 'screen' ).setAttribute('height', windowHeight * 0.833);

            playSFX('background');

            // window active monitor
            w.setInterval(function(){

                if( ! settings.pause ) {

                    // if window inactive
                    if( ! vis() ) togglePause(true);
                }
            }, 500);

            // timer counter
            w.setInterval(function(){

                if( ! settings.pause ) {

                    addScore(1);
                }
            }, 1000);
        }

        main();

        start = false;

        firsTime = false;
    }

    loopId = requestAnimationFrame( mainLoop );
}

// draw the game grid
// fill the blocks with respectives colors
// with the colors of the colors matrix
function drawGrid() {

    for( var l = 0; l < grid.r; l++ ) {

        for( var c = 0; c < grid.c; c++ ) {

            // set the index of the used color
            var colorIndex = ( grid.m[ l ][ c ] < 0 )? grid.m[ l ][ c ] * -1: grid.m[ l ][ c ] ;

            // set the color name and stripe white columns pair
            var color = ( colors[ colorIndex ] == 'white' && c % 2 == 0 )? '#f0f0f0' : colors[ colorIndex ] ;

            // fill the filled blocks
            canvasScreen.fillStyle = color;
            canvasScreen.fillRect( c * blockSizeWidth, l * blockSizeHeight, blockSizeWidth, blockSizeHeight );

            // stroke the filled blocks
            canvasScreen.strokeStyle = 'white';
            canvasScreen.strokeRect( c * blockSizeWidth, l * blockSizeHeight, blockSizeWidth, blockSizeHeight );
        }
    }
}//drawGrid

// clean the current grid
function cleanGrid() {

    for( var l = 0; l < grid.r; l++ ) {

        for( var c = 0; c < grid.c; c++ ) {

            // fill indexes with zero
            grid.m[ l ][ c ] = 0;
        }
    }

}//cleanGrid

// draw in grid the current piece
function drawPiece( fixPiece ) {

    // if fixPiece is true,
    // set the negative value for change in grid
    fixPiece = ( fixPiece )? -1 : 1 ;

    // fill the grid with values of the piece
    for( var l = 0; l < grid.r; l++ ) {

        for( var c = 0; c < grid.c; c++ ) {

            // if is positive, fill with zero
            if( grid.m[ l ][ c ] > 0 ) {

                // fill with 0, index of the color white
                grid.m[ l ][ c ] = 0;
            }

            // calculate for that the piece stay centered
            // and fill the grid with the color of the piece
            if( l >= currentPiece.y && ( l - currentPiece.y + 1 ) <= currentPiece.l  && c >= currentPiece.x && ( c - currentPiece.x + 1 ) <= currentPiece.c ) {

                // if not 0(white)
                if( currentPiece.m[ l - currentPiece.y ][ c - currentPiece.x ] != 0 ) {

                    // draw piece in grid
                    grid.m[ l ][ c ] = currentPiece.m[ l - currentPiece.y ][ c - currentPiece.x ];

                    // if fixPiece is true
                    // multiply value of the index by -1
                    // else, multiply by 1
                    grid.m[ l ][ c ] *= fixPiece;
                }
            }
        }
    }

}//drawPiece

// draw next piece grid
function drawNextPiece() {

    // set the quantity of rows
    nextPiece.l = mLines( nextPiece.m );

    // set the quantity of columns
    nextPiece.c = mColumns( nextPiece.m );

    // clear canvas
    canvasNextPiece.clearRect( 0, 0, 100, 80 );

    // draw the grid
    for( var l = 0; l < nextPiece.l; l++ ) {

        for( var c = 0; c < nextPiece.c; c++ ) {

            // get color of piece
            var color = colors[ nextPiece.m[ l ][ c ] ];

            var x = ( 100 / 2 ) + c * 20 - ( nextPiece.c / 2 ) * 20;
            var y = ( 40 / 2 ) + l * 20 - ( nextPiece.l / 2 ) * 20;

            // fill filled blocks
            if( color != 'white' ) {

                canvasNextPiece.fillStyle = color;
                canvasNextPiece.fillRect( x, y, 20, 20 );

                // stroke filled blocks
                canvasNextPiece.strokeStyle = '#1366A1';
                canvasNextPiece.strokeRect( x, y, 20, 20 );
            }

        }
    }

}//drawNextPiece

// random and return the piece
function randomPiece() {

    // random piece
    var Piece = pieces[ Math.floor( Math.random() * pieces.length ) ];

    // if enabled, manipulate the random
    if( debug.active && debug.randomPieceReturn != null ) Piece = pieces[ debug.randomPieceReturn ];

    // return piece object
    return {
               m : Piece,
               r : null,
               c : null,
               y : null,
               x : null
           };
}//randomPiece

// verify how many rows have the matrix
function mLines( m ) {

    return m.length;
}//mLines

// verify how many columns have the matrix
function mColumns( m ) {

    return m[0].length;
}//mColumns

// application console
function appConsole( value ) {

    // show div appConsole
    id('appConsole').style.display = 'block';

    id('appConsole').innerHTML += "<p>"+ value +"</p>";
}//appConsole

// clear application console
function appConsoleClear() {

    id('appConsole').innerHTML = '';
}//appConsoleClear

// -----------------------------------------------------------------------------
// ACTIONS ---------------------------------------------------------------------
// -----------------------------------------------------------------------------

// move down the piece
function moveDown() {

    // if the piece don't exceed the grid verticaly
    if( canMove( currentPiece.x,(currentPiece.y + 1), currentPiece.m  ) )  {

        // iterate Y for the piece down automatically
        currentPiece.y++;

    } else {

        // set end flag
        currentPiece.e = true;
    }
}//moveDown

// move down the piece quickly
function moveDownFast( event ) {

    // verify button event
    if( event == 'pressed' ) {

        // show pressed button
        buttonPressed('down');

        // save current time step
        lastStepTime = stepTime;

        // decrease time of step
        // with 10% of the current speed
        stepTime *= 0.1;

    } else {

        // show pressed button
        buttonPressed('down-release');

        // back to the last step time
        stepTime = lastStepTime;
    }

}//moveDownFast

// move left the piece
function moveLeft() {

    // if piece can move for left
    if( canMove( currentPiece.x - 1, currentPiece.y, currentPiece.m ) ) {

        // show pressed button
        buttonPressed('left');

        // play sound effect
        playSFX('move');

        currentPiece.x--;
    }
}//moveLeft

// move right the piece
function moveRight() {

    // if piece can move for right
    if( canMove( currentPiece.x + 1, currentPiece.y, currentPiece.m  ) ) {

        // show pressed button
        buttonPressed('right');

        // play sound effect
        playSFX('move');

        currentPiece.x++;
    }
} // moveRight

// rotate the piece
function rotatePiece() {

    var newPosition = [];

    // if not square matrix
    if( currentPiece.l != currentPiece.c ) {

        // read columns as rows
        for( var l = 0, lc = currentPiece.c; l < lc; l++ ) {

            newPosition[ l ] = [];

            // read rows as columns
            for( var c = 0, cc = currentPiece.l; c < cc; c++ ) {

                // fórmula que dá o efeito de rotação 90º horário
                var cr = (currentPiece.l - 1) - c;

                newPosition[ l ][ c ] = currentPiece.m[ cr ][ l ];
            }
        }

        // verify if piece can move
        if( canMove( currentPiece.x,  currentPiece.y, newPosition ) ) {

            // show pressed button
            buttonPressed('rotate');

            // play sound effect
            playSFX('rotate');

            // set quantity of rows of the piece
            currentPiece.l = mLines( newPosition );

            // set quantity of columns of the piece
            currentPiece.c = mColumns( newPosition );

            // insert the new piece
            currentPiece.m = newPosition;
        }
    }
}//rotatePiece

// verify if piece can move for the new position
function canMove( x, y, position ) {

    // if current piece not reached the end
    if( ! currentPiece.e ) {

        // if minor than grid height
        if( ( y + mLines( position ) ) < ( grid.r + 1 ) ) {

            for( var l = 0, lc = mLines( position ); l < lc; l++ ) {
                for( var c = 0, cc = mColumns( position ); c < cc; c++ ) {

                    // verify if occured some colision
                    if(
                        position[ l ][ c ] != 0 &&
                        (
                            ( y + l ) >= 0 && // if positive index
                            (
                                grid.m[ y + l ][ x + c ] == undefined || // if undefined, is out of the limits of the matrix
                                grid.m[ y + l ][ x + c ] < 0 // if colide with other piece
                            )
                        )
                        ){

                        return false;
                    }
                }
            }

            return true;

        } else {

            return false;
        }

        return true;
    }

    return false;
}//canMove

// verify complete rows
function verifyRows() {

    var columnsFilled;
    var columnsEmpty;

    row:
    for( var l = grid.r - 1; l > 0; l-- ) {

        columnsFilled = 0;
        columnsEmpty  = 0;

        for( var c = 0; c < grid.c; c++ ) {

            // verify columns of the row
            if( grid.m[ l ][ c ] < 0 ) {

                columnsFilled++;
            } else {

                if( grid.m[ l ][ c ] == 0 ) {

                    columnsEmpty++;
                } else {

                    continue row;
                }
            }
        }

        // if all columns of the row are empty
        // break execution
        if( columnsEmpty == grid.c ) {

            return;
        }

        // if all columns were filled
        if( columnsFilled == grid.c ) {

            // add score by completed row
            addScore( 100 );

            // play sound effect
            playSFX('complete-row');

            // get filled row
            lp = l;

            // move down above rows
            for( var pl = lp-1; pl > 0; pl-- ) {

                columnsEmpty = 0;

                for( var c = 0; c < grid.c; c++ ) {

                    grid.m[ lp ][ c ] = grid.m[ pl ][ c ];
                }

                lp--;
            }

            // iterate for back to before row
            l++;
        }
    }
} // verifyRows

// toggle state of the pause
function togglePause( flag ) {

    // toggle pause
    settings.pause = ( typeof flag != 'string' )? flag : ! settings.pause;

    // if paused, stop the audio
    toggleAudio( settings.audio && ! settings.pause );

    // if paused, show pause div
    id('pause').style.display = ( settings.pause ) ? 'block' : 'none' ;

    // put below/above buttons
    id('buttonAbout').style.zIndex = ( settings.pause ) ? 0 : 3 ;

} // togglePause

// toggle state of the about
function toggleAbout() {

    // toggle about
    settings.about = ! settings.about;

    // pause game
    settings.pause = settings.about;

    // pause audio
    toggleAudio( settings.audio && ! settings.about );

    // show about div
    id('about').style.display = ( settings.about ) ? 'block' : 'none' ;

    // put buttons above/below
    id('buttonPause').style.zIndex = ( settings.about ) ? 0 : 3 ;

}//toggleAbout

// toggle state of the audio
function toggleAudio( flag ) {

    // toggle audio
    settings.audio = ( typeof flag != 'string' )? flag : ! settings.audio;

    // if audio on
    if( settings.audio ) {

        // play it
        id('backgroundAudio').play();

        // insert image of audio on
        id('buttonAudio').style.backgroundImage = 'url(img/button-audio-on.svg)';

    } else {

        // pause it
        id('backgroundAudio').pause();

        // insert image of audio off
        id('buttonAudio').style.backgroundImage = 'url(img/button-audio-off.svg)';
    }

}//toggleAudio

// play sound effects
function playSFX( effect ) {

    // if audio on
    if( settings.audio ) {

        switch( effect ) {

            case'background':

                id('backgroundAudio').play();

                break;

            case'complete-row':

                id('soundfxCompleteRow').play();

                break;

            case'game-over':

                id('soundfxGameOver').play();

                break;
        }
    }

}//playSFX

// add score
function addScore( points ) {

    score += points;

    level = Math.floor( score / 1000 ) + 1;

    // set the score
    id('scorePoints').innerHTML = score;

    // set the current level
    id('scoreLevel').innerHTML = level;

    // complete row
    if( points == 100 ) {

        id('scoreLines').innerHTML = ++rows;
    }

    // verify level, case change increase speed
    if( level != currentLevel ) {

        // set level to current level
        currentLevel = level;

        // verify if move down fast is active
        // if true, decrease 50ms in last step time
        if( lastStepTime / stepTime == 10 ) {

          lastStepTime -= 50;
          stepTime     -= 5;

        } else {

          stepTime -= 50;
        }
    }
}//addScore

// verifiy game over
function wasGameOver() {

    // if current piece came to end with negative Y was game over
    if( currentPiece.y < 0 ) {

        settings.pause = true;

        // play sound effect
        playSFX('game-over');

        // if score greater than curret score
        if( score > record ) {

            record = score;

            // set record
            s.setItem( 'record', record );

            // show record div
            id('newRecord').style.visibility = 'visible';
        } else {

            // hide record div
            id('newRecord').style.visibility = 'hidden';
        }

        // show div of game over
        id('gameOver').style.display = 'block';

        // insert pontuation
        id('gameOverScore').innerHTML = score;

    }

}//wasGameOver

// set record of game
function setRecord() {

    id('scoreRecord').innerHTML = record;
}//setRecord

// show pressed buttons
function buttonPressed( button ) {

    // verify button to perform action
    switch( button ) {

        case'down':

            id( 'buttonDown' ).style.backgroundImage = 'url(img/button-down-pressed.svg)';

            break;

        case'down-release':

            id( 'buttonDown' ).style.backgroundImage = 'url(img/button-down.svg)';

            break;

        default:

            // insert button pressed image
            id( 'button' + capitalize( button ) ).style.backgroundImage = 'url(img/button-' + button + '-pressed.svg)';

            // hide button pressed image after few moment
            w.setTimeout( function() {

                id( 'button' + capitalize( button ) ).style.backgroundImage = 'url(img/button-' + button + '.svg)';

            }, 300 );
    }
}//buttonPressed

// capitalize
function capitalize( value ) {

    return value.charAt(0).toUpperCase() + value.slice(1);
}//capitalize

// -----------------------------------------------------------------------------
// MOBILE EVENTS ---------------------------------------------------------------
// -----------------------------------------------------------------------------

// LEFT BUTTON PRESSED
id('buttonLeft').ontouchstart = function() {

    moveLeft();
}

// RIGHT BUTTON PRESSED
id('buttonRight').ontouchstart = function() {

    moveRight();
}

// ROTATE BUTTON PRESSED
id('buttonRotate').ontouchstart = function() {

    rotatePiece();
}

// DOWN BUTTON PRESSED
id('buttonDown').ontouchstart = function() {

    moveDownFast( 'pressed' );
}

// DOWN BUTTON RELEASE
id('buttonDown').ontouchend = function() {

    moveDownFast( 'release' );
}

// -----------------------------------------------------------------------------
// DESKTOP EVENTS --------------------------------------------------------------
// -----------------------------------------------------------------------------

// PAUSE BUTTON PRESSED
id('buttonPause').onclick = function() {

    togglePause('');
}

// AUDIO BUTTON PRESSED
id('buttonAudio').onmousedown = function() {

    toggleAudio('');
}

// PAUSE BUTTON PRESSED
id('buttonAbout').onclick = function() {

    toggleAbout();
}

// REPEAT YES BUTTON PRESSED
id('buttonRepeatYes').onclick = function() {

    cleanGrid();

    // reset variables
    level        = 1;
    currentLevel = 1;
    score        = 0;
    rows         = 0;
    stepTime     = 500;
    lastStepTime = 0;
    currentPiece = {
                        m : null,
                        x : null,
                        y : null,
                        r : null,
                        c : null,
                    };

    // hide game over div
    id('gameOver').style.display = 'none';

    // reset view
    id('scorePoints').innerHTML = 0;
    id('scoreLevel').innerHTML  = 1;
    id('scoreLines').innerHTML  = 0;

    // remove pause
    settings.pause = false;
}

// REPEAT NO BUTTON PRESSED
id('buttonRepeatNo').onclick = function() {

    // close the application
    w.close();
}

// WHEN KEY PRESSED
w.onkeydown = function( event ) {

    var keyCode = event.keyCode || event.which;

    // control for only one keydown event
    if( keyDowns[ keyCode ] == null ) {

        keyDowns[ keyCode ] = 1;

        switch( keyCode ) {

            // left arrow
            case 37:

                moveLeft();

                break;

            // right arrow
            case 39:

                moveRight();

                break;

            // down arrow
            case 40:

                moveDownFast( 'pressed' );

                break;

            // up arrow
            case 38:
            // space
            case 32:

                rotatePiece();

                break;
        }
    }
}

// WHEN KEY RELEASE
w.onkeyup = function( event ) {

    var keyCode = event.keyCode || event.which;

    // reset keydown event
    keyDowns[ keyCode ] = null;

    switch( keyCode ) {

        // down arrow
        case 40:

            moveDownFast( 'release' );

            break;
    }
}

// window resize function
var resize = function() {

    // window size
    windowWidth = w.innerWidth || w.clientWidth;
    windowHeight = w.innerHeight || w.clientHeight;

    // if window greater than mobile, reduce size
    windowWidth = ( windowWidth < 960 )? windowWidth : 320;
    windowHeight = ( windowWidth != 320 )? windowHeight : 480;

    // increase body font
    id('body').style.fontSize = windowWidth / 20 +'px';

    // adjust sizes
    id('nextPiece').style.width       = ( windowWidth / 20 ) * 6 + 'px';
    id('screenNextPiece').style.width = ( windowWidth / 20 ) * 6 + 'px';
    id('info').style.width            = ( windowWidth / 20 ) * 6 + 'px';
    id('settings').style.width        = ( windowWidth / 20 ) * 6 + 'px';

    // buttons
    classcss('buttonSettings', 'width', ( windowWidth / 20 ) * 3 + 'px' )
    classcss('buttonRound', 'height', ( windowWidth / 20 ) * 4 + 'px' );
    id('buttons').style.height              = ( windowWidth / 20 ) * 4 + 'px';
    id('buttonLeft').style.backgroundSize   = ( windowWidth / 20 ) * 4 + 'px ' + ( windowWidth / 20 ) * 4 + 'px';
    id('buttonDown').style.backgroundSize   = ( windowWidth / 20 ) * 4 + 'px ' + ( windowWidth / 20 ) * 4 + 'px';
    id('buttonRotate').style.backgroundSize = ( windowWidth / 20 ) * 4 + 'px ' + ( windowWidth / 20 ) * 4 + 'px';
    id('buttonRight').style.backgroundSize  = ( windowWidth / 20 ) * 4 + 'px ' + ( windowWidth / 20 ) * 4 + 'px';

    // block sizes
    blockSizeWidth = windowWidth * 0.0625, // width of the block in pixels
    blockSizeHeight =  windowHeight * (0.0833 / 2), // height of the block in pixels

    // resize canvas
    id( 'screen' ).setAttribute('width', windowWidth * 0.625);
    id( 'screen' ).setAttribute('height', windowHeight * 0.833);
}

// when window resize
w.onresize = resize;

// when DOM and localization loaded, start the loop
w.onload = function() {

    // callback for translate strings
    var l = function (string) {
        return string.toLocaleString();
    };

    // get strings
    var strings = d.querySelectorAll('*[data-l10n-id]');

    for( var i = 0,len = strings.length; i < len; i++ ) {

        // translate the string
        strings[ i ].innerHTML = l( '%' + strings[ i ].getAttribute("data-l10n-id") );
    }

    // trigger resize for adjust sizes
    resize();

    // fadeout load screen
    id('load').style.animation = 'fadeout 1s 1s 1 forwards';

    // initialize main loop
    mainLoop();
}

})();
