/*
    TetrisFOX
    Description : The famous game Tetris made for FirefoxOS by RobertoPC
    Author      : RobertoPC
    Author URI  : http://robertopc.net
    Version     : 1.1.0

    Modification log:
    ; XX Jan 2015 - 1.1.0
    ; * Changed l10n script
    ; * Changed height of screen
    ; * Changed images PNG for SVG
    ; * Added ranking
    ; * Added close button for desktop browser
    ; * Added load screen
    ; 26 Dez 2014 - 1.0.0
    ; * Initial Release
*/

// VARIABLES ---------------------------------------------------------------------------

// set up animation object
var requestAnimationFrame = window.requestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.msRequestAnimationFrame;

// debug object
var debug = {
                active            : false, // enable/disable debug
                randomPieceReturn : null   // set manually the random pieces ( 0 - 6 ), if null no set piece
            };

// game settings
var settings = {
                pause: false,
                audio: true,
                about: false
            };

var blockSize = 20; // size of the block in pixels

// current piece object
var currentPiece =  {
                    matrix    : null,  // matrix of the piece
                    x         : null,  // coordinate X of the piece in grid
                    y         : null,  // coordinate Y of the piece in grid
                    r         : null,  // quantity of rows
                    c         : null,  // quantity of columns
                    reachedEnd : false // flag for set if piece are in the end of the grid
                };

// next piece object
var nextPiece = null;

// time of the step in milliseconds
var stepTime = 500;

// game loop
var loopId   = null;
var start    = false;
var firsTime = true;

// flag for the last step time
var lastStepTime = 0;

// canvas game
var canvasScreen = document.getElementById( 'screen' );
    canvasScreen = canvasScreen.getContext( '2d' );

// canvas next piece
var canvasNextPiece = document.getElementById( 'screenNextPiece' );
    canvasNextPiece = canvasNextPiece.getContext( '2d' );

// color Palette
var colors = [ 'white', 'red', 'orange', 'gold', 'green', 'blue', 'indigo', 'violet', 'black' ];

// initialize grid matrix
var grid = {
                matrix : [
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
            };

// initialize next piece grid matrix
var gridnextPiece = {
                        matrix: [
                                    [0,0,0,0,0],
                                    [0,0,0,0,0]
                                ],
                        r : 2, // rows
                        c : 5  // columns
                      };

// matrix with the shapes of the pieces
var pieces = [
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
                ];

// store the score of the game
var score = 0;

// store the current level
var level = 1;
var currentLevel = 1;

// count of rows
var rows = 0;

// get record from localstorage
var record = ( localStorage.getItem('record') != null )? localStorage.getItem('record') : 0 ;

// control of key downs
var keyDowns = [];

// END VARIABLES ------------------------------------------------



// FUNCTIONS --------------------------------------------------------

// main function of the game
function main() {

    // if not paused
    if( ! settings.pause ) {

        // set game record
        setRecord();

        // if not iniatilized the current piece
        // or if the same came to end
        // if true, randomize a new piece
        if( currentPiece.matrix == null || currentPiece.reachedEnd ) {

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

            // set quantity of rows of the piece
            currentPiece.l = mLines( currentPiece.matrix );

            // set quantity of columns of the piece
            currentPiece.c = mColumns( currentPiece.matrix );

            // set the Y of the piece like quantity of rows * -1
            // for that piece starting out of the grid
            currentPiece.y = currentPiece.l * -1;

            // set the X of the piece for center of the grid
            currentPiece.x = ( grid.c - currentPiece.c )  / 2;
            currentPiece.x = Math.floor( currentPiece.x );

            // add score of the piece
            addScore( 10 );

            // set flag
            currentPiece.reachedEnd = false;
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
            appConsole( JSON.stringify( grid.matrix )
                                .replace( /\],\[/g , '<br>' )
                                .replace( '[[' , '' )
                                .replace( ']]', '' )
                                .replace(/,/g,' ')
                                .replace(/ (\-[0-9]+)/g, '$1') );
        }
    }
} // end Main

function mainLoop() {

    var now = new Date().getTime() || Date().now();

    start = ! start ? now : start;

    var progress = now - start;

    // if passed step time or first time in loop
    if ( firsTime || progress > stepTime ) {

        // if first time
        if( firsTime ) {
        
            playSFX('background');
        }

        main();

        start = false;

        firsTime = false;
    }

    loopId = requestAnimationFrame( mainLoop );
}

// FUNCTIONS -------------------------------------------------

// draw the game grid
// fill the blocks with respectives colors
// with the colors of the colors matrix
function drawGrid() {

    for( var l = 0; l < grid.r; l++ ) {

        for( var c = 0; c < grid.c; c++ ) {

            // set the index of the used color
            var colorIndex = ( grid.matrix[ l ][ c ] < 0 )? grid.matrix[ l ][ c ] * -1: grid.matrix[ l ][ c ] ;

            // set the color name and stripe white columns pair
            var color = ( colors[ colorIndex ] == 'white' && c % 2 == 0 )? '#f0f0f0' : colors[ colorIndex ] ;

            // fill the filled blocks
            canvasScreen.fillStyle = color;
            canvasScreen.fillRect( c * blockSize, l * blockSize, blockSize, blockSize );

            // stroke the filled blocks
            canvasScreen.strokeStyle = 'white';
            canvasScreen.strokeRect( c * blockSize, l * blockSize, blockSize, blockSize );
        }
    }
} // end drawGrid

// clean the current grid
function cleanGrid() {

    for( var l = 0; l < grid.r; l++ ) {

        for( var c = 0; c < grid.c; c++ ) {

            // fill indexes with zero
            grid.matrix[ l ][ c ] = 0;
        }
    }

} // end cleanGrid

// draw in grid the current piece
function drawPiece( fixPiece ) {

    // if fixPiece is true,
    // set the negative value for change in grid
    fixPiece = ( fixPiece )? -1 : 1 ;

    // fill the grid with values of the piece
    for( var l = 0; l < grid.r; l++ ) {

        for( var c = 0; c < grid.c; c++ ) {

            // if is positive, fill with zero
            if( grid.matrix[ l ][ c ] > 0 ) {

                // fill with 0, index of the color white
                grid.matrix[ l ][ c ] = 0;
            }

            // calculate for that the piece stay centered
            // and fill the grid with the color of the piece
            if( l >= currentPiece.y && ( l - currentPiece.y + 1 ) <= currentPiece.l  && c >= currentPiece.x && ( c - currentPiece.x + 1 ) <= currentPiece.c ) {

                // if not 0(white)
                if( currentPiece.matrix[ l - currentPiece.y ][ c - currentPiece.x ] != 0 ) {

                    // draw piece in grid
                    grid.matrix[ l ][ c ] = currentPiece.matrix[ l - currentPiece.y ][ c - currentPiece.x ];

                    // if fixPiece is true
                    // multiply value of the index by -1
                    // else, multiply by 1
                    grid.matrix[ l ][ c ] *= fixPiece;
                }
            }
        }
    }

} // end drawPiece

// draw next piece grid
function drawNextPiece() {

    // set the quantity of rows
    nextPiece.l = mLines( nextPiece.matrix );

    // set the quantity of columns
    nextPiece.c = mColumns( nextPiece.matrix );

    // clear canvas
    canvasNextPiece.clearRect( 0, 0, 100, 80 );

    // draw the grid
    for( var l = 0; l < nextPiece.l; l++ ) {

        for( var c = 0; c < nextPiece.c; c++ ) {

            // get color of piece
            var color = colors[ nextPiece.matrix[ l ][ c ] ];

            var x = ( 100 / 2 ) + c * blockSize - ( nextPiece.c / 2 ) * blockSize;
            var y = ( 40 / 2 ) + l * blockSize - ( nextPiece.l / 2 ) * blockSize;

            // fill filled blocks
            if( color != 'white' ) {

                canvasNextPiece.fillStyle = color;
                canvasNextPiece.fillRect( x, y, blockSize, blockSize );

                // stroke filled blocks
                canvasNextPiece.strokeStyle = 'white';
                canvasNextPiece.strokeRect( x, y, blockSize, blockSize );
            }

        }
    }

} // end drawNextPiece

// random and return the piece
function randomPiece() {

    // random piece
    var Piece = pieces[ Math.floor( Math.random() * pieces.length ) ];

    // if enabled, manipulate the random
    if( debug.active && debug.randomPieceReturn != null ) Piece = pieces[ debug.randomPieceReturn ];

    // return piece object
    return {
               matrix : Piece,
               r      : null,
               c      : null,
               y      : null,
               x      : null
           };
} // end randomPiece

// verify how many rows have the matrix
function mLines( matrix ) {

    return matrix.length;
} // end mLines

// verify how many columns have the matrix
function mColumns( matrix ) {

    return matrix[0].length;
} // end mColumns

// application console
function appConsole( value ) {

    // show div appConsole
    document.getElementById('appConsole').style.display = 'block';

    document.getElementById('appConsole').innerHTML += "<p>"+ value +"</p>";
} // end appConsole

// clear application console
function appConsoleClear() {

    document.getElementById('appConsole').innerHTML = '';
} // end appConsoleClear

// ACTIONS -------------------------------------------------

// move down the piece
function moveDown() {

    // if the piece don't exceed the grid verticaly
    if( canMove( currentPiece.x,(currentPiece.y + 1), currentPiece.matrix  ) )  {

        // iterate Y for the piece down automatically
        currentPiece.y++;

    } else {

        currentPiece.reachedEnd = true;
    }
} // end moveDown

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

} // end moveDownFast

// move left the piece
function moveLeft() {

    // if piece can move for left
    if( canMove( currentPiece.x - 1, currentPiece.y, currentPiece.matrix ) ) {

        // show pressed button
        buttonPressed('left');

        // play sound effect
        playSFX('move');

        currentPiece.x--;
    }
} // moveLeft

// move right the piece
function moveRight() {

    // if piece can move for right
    if( canMove( currentPiece.x + 1, currentPiece.y, currentPiece.matrix  ) ) {

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

                newPosition[ l ][ c ] = currentPiece.matrix[ cr ][ l ];
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
            currentPiece.matrix = newPosition;
        }
    }
} // end rotatePiece

// verify if piece can move for the new position
function canMove( x, y, position ) {

    // if current piece not reached the end
    if( ! currentPiece.reachedEnd ) {

        // if in vertical limits
        //if( y >= 0  ) {

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
                                    grid.matrix[ y + l ][ x + c ] == undefined || // if undefined, is out of the limits of the matrix
                                    grid.matrix[ y + l ][ x + c ] < 0 // if colide with other piece
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
        //}

        return true;
    }

    return false;
} // end canMove

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
            if( grid.matrix[ l ][ c ] < 0 ) {

                columnsFilled++;
            } else {

                if( grid.matrix[ l ][ c ] == 0 ) {

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

                    grid.matrix[ lp ][ c ] = grid.matrix[ pl ][ c ];
                }

                lp--;
            }

            // iterate for back to before row
            l++;
        }
    }
} // verifyRows

// toggle state of the pause
function togglePause() {

    // toggle pause
    settings.pause = ! settings.pause;

    // if paused, stop the audio
    settings.audio = ( settings.pause ) ? false : true ;

    // if paused, show pause div
    document.getElementById('pause').style.display = ( settings.pause ) ? 'block' : 'none' ;

    // put below/above buttons
    document.getElementById('buttonAbout').style.zIndex = ( settings.pause ) ? 0 : 3 ;
    document.getElementById('buttonRanking').style.zIndex = ( settings.pause ) ? 0 : 3 ;

} // togglePause

// toggle state of the about
function toggleAbout() {

    // toggle about
    settings.about = ! settings.about;

    // pause game
    settings.pause = ( settings.about ) ? true : false ;

    // show about div
    document.getElementById('about').style.display = ( settings.about ) ? 'block' : 'none' ;

    // put buttons above/below
    document.getElementById('buttonPause').style.zIndex = ( settings.about ) ? 0 : 3 ;
    document.getElementById('buttonRanking').style.zIndex = ( settings.about ) ? 0 : 3 ;

} // end toggleAbout

// toggle state of the ranking
function toggleRanking() {

    // toggle about
    settings.about = ! settings.about;

    // pause game
    settings.pause = ( settings.about ) ? true : false ;

    // show about div
    document.getElementById('about').style.display = ( settings.about ) ? 'block' : 'none' ;

    // put buttons above/below
    document.getElementById('buttonPause').style.zIndex = ( settings.about ) ? 0 : 3 ;
    document.getElementById('buttonRanking').style.zIndex = ( settings.about ) ? 0 : 3 ;

} // end toggleRanking

// toggle state of the audio
function toggleAudio() {

    // toggle audio
    settings.audio = ! settings.audio;

    // if audio on
    if( settings.audio ) {

        // play it
        document.getElementById('backgroundAudio').play();

        // insert image of audio on
        document.getElementById('buttonAudio').style.backgroundImage = 'url(img/button-audio-on.svg)';

    } else {

        // pause it
        document.getElementById('backgroundAudio').pause();

        // insert image of audio off
        document.getElementById('buttonAudio').style.backgroundImage = 'url(img/button-audio-off.svg)';
    }

} // end toggleAudio

// play sound effects
function playSFX( effect ) {

    // if audio on
    if( settings.audio ) {

        switch( effect ) {

            case'background':

                document.getElementById('backgroundAudio').play();

                break;

            case'complete-row':

                document.getElementById('soundfxCompleteRow').play();

                break;

            case'game-over':

                document.getElementById('soundfxGameOver').play();

                break;
        }
    }

} // end playSFX

// add score
function addScore( points ) {

    score += points;

    level = Math.floor( score / 1000 ) + 1;

    // set the score
    document.getElementById('scorePoints').innerHTML = score;

    // set the current level
    document.getElementById('scoreLevel').innerHTML = level;

    // complete row
    if( points == 100 ) {

        document.getElementById('scoreLines').innerHTML = ++rows;
    }

    // verify level, case change increase speed
    if( level != currentLevel ) {

        // set level to current level
        currentLevel = level;

        // verify if move down fast is active
        // if true, decrease 50ms in last step time
        if( lastStepTime / stepTime == 10 ) {

            lastStepTime -= 50;
        }

        // decrease 50ms of the time per level
        stepTime -= 50;
    }
} // end addScore

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
            localStorage.setItem( 'record', record );

            // show record div
            document.getElementById('newRecord').style.visibility = 'visible';
        } else {

            // hide record div
            document.getElementById('newRecord').style.visibility = 'hidden';
        }

        // show div of game over
        document.getElementById('gameOver').style.display = 'block';

        // insert pontuation
        document.getElementById('gameOverScore').innerHTML = score;

    }

} // end wasGameOver

// set record of game
function setRecord() {

    document.getElementById('scoreRecord').innerHTML = record;
} // end setRecord

// show pressed buttons
function buttonPressed( button ) {

    // verify button to perform action
    switch( button ) {

        case'down':

            document.getElementById( 'buttonDown' ).style.backgroundImage = 'url(img/button-down-pressed.svg)';

            break;

        case'down-release':

            document.getElementById( 'buttonDown' ).style.backgroundImage = 'url(img/button-down.svg)';

            break;

        default:

            // insert button pressed image
            document.getElementById( 'button' + capitalize( button ) ).style.backgroundImage = 'url(img/button-' + button + '-pressed.svg)';

            // hide button pressed image after few moment
            window.setTimeout( function() {

                document.getElementById( 'button' + capitalize( button ) ).style.backgroundImage = 'url(img/button-' + button + '.svg)';

            }, 300 );
    }
} // end buttonPressed

// capitalize
function capitalize( value ) {

    return value.charAt(0).toUpperCase() + value.slice(1);
} // end capitalize

// show link in frame
function openLink() {

    toggleAudio();

    document.getElementById('frameLink').src = '';
    document.getElementById('frameDiv').style.display = 'block';
} // openLink

// hide open link
function closeLink() {

    toggleAudio();

    document.getElementById('frameDiv').style.display = 'none';
} // end closeLink

// END FUNCTIONS -------------------------------------------

// EVENTS BEGIN -------------------------------------------------

// LEFT BUTTON PRESSED
document.getElementById('buttonLeft').ontouchstart = function() {

    moveLeft();
}

// RIGHT BUTTON PRESSED
document.getElementById('buttonRight').ontouchstart = function() {

    moveRight();
}

// ROTATE BUTTON PRESSED
document.getElementById('buttonRotate').ontouchstart = function() {

    rotatePiece();
}

// DOWN BUTTON PRESSED
document.getElementById('buttonDown').ontouchstart = function() {

    moveDownFast( 'pressed' );
}

// DOWN BUTTON RELEASE
document.getElementById('buttonDown').ontouchend = function() {

    moveDownFast( 'release' );
}

// END MOBILE EVENTS -------------------------------------------------

// PAUSE BUTTON PRESSED
document.getElementById('buttonPause').onclick = function() {

    togglePause();
}

// AUDIO BUTTON PRESSED
document.getElementById('buttonAudio').onmousedown = function() {

    toggleAudio();
}

// PAUSE BUTTON PRESSED
document.getElementById('buttonAbout').onclick = function() {

    toggleAbout();
}

// REPEAT YES BUTTON PRESSED
document.getElementById('buttonRepeatYes').onclick = function() {

    cleanGrid();

    // reset variables
    level        = 1;
    score        = 0;
    rows         = 0;
    stepTime     = 500;
    lastStepTime = 0;
    currentPiece = {
                        matrix: null,
                        x     : null,
                        y     : null,
                        r     : null,
                        c     : null,
                    };

    // hide game over div
    document.getElementById('gameOver').style.display = 'none';

    // reset view
    document.getElementById('scorePoints').innerHTML = 0;
    document.getElementById('scoreLevel').innerHTML  = 1;
    document.getElementById('scoreLines').innerHTML  = 0;

    // remove pause
    settings.pause = false;
}

// REPEAT NO BUTTON PRESSED
document.getElementById('buttonRepeatNo').onclick = function() {

    // close the application
    window.close();
}

// WHEN KEY PRESSED
window.onkeydown = function( event ) {

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
window.onkeyup = function( event ) {

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

// catch all frame links
var links = document.querySelectorAll('a[target="frameLink"]');

for( var i = 0, l = links.length; i < l; i++ ) {

    // When click in frame link
    document.querySelectorAll('a[target="frameLink"]')[ i ].onclick = function() {

        openLink();
    }
}

// When click in close button
document.getElementById('frameClose').onclick = function() {

    closeLink();
}

// When click in ranking button
document.getElementById('buttonRanking').onclick = function() {

    // if online
    if( navigator.onLine ) {

        //  if not setted, set 0
        var device_id = localStorage.getItem('device_id') || '';

        var xmlhttp = new XMLHttpRequest();

        xmlhttp.onreadystatechange = function() {

            // if ready
            if ( xmlhttp.readyState == 4 && xmlhttp.status == 200 ) {

                // parse response json
                var response = JSON.parse( xmlhttp.responseText );

                console.log( response );

                // set the data
                localStorage.setItem( 'device_id', response.device_id );
                localStorage.setItem( 'position', response.position );
                localStorage.setItem( 'country', response.country );
            }
        }

        xmlhttp.open( "get", "http://localhost/tetrisfox/backend/ranking.php?token=TETRISFOX&device_id="+ device_id +'&record=' + record , true );
        xmlhttp.send();

    } else {

        settins.pause = true;

        alert('Offline');
    }
}

// When localization loaded start the loop
window.onload = function() {

    // callback for translate strings
    var l = function (string) {
        return string.toLocaleString();
    };

    // get localization strings
    var strings = document.querySelectorAll('*[data-l10n-id]');

    for( s in strings ) {

        // if dont have attributes
        if( strings[ s ].attributes == undefined ) {
            break;
        }

        // translate the string
        strings[ s ].innerHTML = l( '%' + strings[ s ].getAttribute("data-l10n-id") );
    }

    // initialize main loop
    mainLoop();
}