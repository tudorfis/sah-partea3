
const imgUrl = './img/'
const imgExt = '.png'

const initialPlacement = {
    'a1': ['w','r'],
    'b1': ['w','k'],
    'c1': ['w','b'],
    'd1': ['w','q'],
    'e1': ['w','kk'],
    'f1': ['w','b'],
    'g1': ['w','k'],
    'h1': ['w','r'],

    'a2': ['w','p'],
    'b2': ['w','p'],
    'c2': ['w','p'],
    'd2': ['w','p'],
    'e2': ['w','p'],
    'f2': ['w','p'],
    'g2': ['w','p'],
    'h2': ['w','p'],

    'a8': ['b','r'],
    'b8': ['b','k'],
    'c8': ['b','b'],
    'd8': ['b','q'],
    'e8': ['b','kk'],
    'f8': ['b','b'],
    'g8': ['b','k'],
    'h8': ['b','r'],
    
    'a7': ['b','p'],
    'b7': ['b','p'],
    'c7': ['b','p'],
    'd7': ['b','p'],
    'e7': ['b','p'],
    'f7': ['b','p'],
    'g7': ['b','p'],
    'h7': ['b','p'],
}

function $( selector ) {
    return document.querySelector( selector )
}

function deepclone( obj ) {
    return JSON.parse( JSON.stringify( obj ) )
}

function getCols() {
    return [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h' ]
}

function getRows() {
    return [ '1', '2', '3', '4', '5', '6', '7', '8' ]
}

function getCell( col, row ) {
    return $(`[col="${col}"][row="${row}"]`)
}

function getCells() {
    return [ ...document.querySelectorAll( '.cell' ) ]
}

function generateChessModel() {
    const chessModel = {}

    for ( const col of getCols() ) {
        chessModel[ col ] = {}
    
        for ( const row of getRows() ) {
            chessModel[ col ][ row ] = {
                piece: [],
                potentials: []
            }
        }
    }

    return chessModel
}

function iterateChessModel( chessModel, callbackFn ) {
    for ( const col in chessModel ) {
        for ( const row in chessModel[ col ] ) {
            const [ color, piece ] = chessModel[ col ][ row ].piece
            const { potentials } = chessModel[ col ][ row ]

            callbackFn( col, row, color, piece, potentials )
        }
    } 
}

function renderChessHtml() {
    const chessBoardHtml = $('#chessBoard')

    let isWhite = true

    for ( let i = 64; i >= 1; i-- ) {
        const cell = document.createElement( 'div' )
        cell.classList.add( 'cell' )
        cell.classList.add( isWhite ? 'white' : 'black' )
        
        const col = (i-1) % 8
        const row = Math.ceil( i / 8 )

        cell.setAttribute( 'col', getCols().reverse()[ col ] )
        cell.setAttribute( 'row', row )

        if ( col === 7 || row === 1 ) {
            const positionText = document.createElement( 'span' )
            positionText.classList.add( 'position-text' )
            positionText.innerText = (row === 1 ? cell.getAttribute( 'col' ) : '') +  (col === 7 ? cell.getAttribute( 'row' ) : '')
            cell.append( positionText )
        }
       
        chessBoardHtml.append( cell )

        isWhite = !isWhite 
        isWhite = i % 8 - 1 ? isWhite : !isWhite 
    }
}

function arangePiecesPositions( chessModel ) {
    for ( const position in initialPlacement ) {
        const [ col, row ] = position.split( '' )

        chessModel[ col ][ row ].piece = [ ...initialPlacement[ position ] ]
    }
}

function renderChessPieces( chessModel ) {
    iterateChessModel( chessModel, ( col, row, color, piece ) => {
        if ( color && piece ) {
            const img = document.createElement( 'img' )
            const imgSrc = `${ imgUrl }${ color }_${ piece }${ imgExt }`

            img.setAttribute( 'src', imgSrc )
            getCell( col, row ).append( img )
        }
    })
}

/////

function generateAllMovement( chessModel ) {
    iterateChessModel(chessModel, (col,row,color,piece) => {
        if ( !color || !piece ) return
    
        chessModel[ col ][ row ].potentials = []
        generateMovement( chessModel, col, row )
    })

    generatePotentialCastle( chessModel )
}

function generateChessMate( chessModel ) {
    iterateChessModel(chessModel, (col,row,color,piece,potentials) => {
        if ( !color || !piece ) return
        if ( !isCorrectTurn( color )) return

        const removePotentials = []
        
        potentials.forEach(potential => {
            const _chessModel = deepclone( chessModel )
            const [ _col, _row ] = potential.split( '' )

            _chessModel[ _col ][ _row ] = { 
                ..._chessModel[ col ][ row ],
            }

            _chessModel[ col ][ row ] = {
                piece: [],
            }
            
            generateAllMovement( _chessModel )
            const oppositePotentials = getOpponentPotentials( _chessModel )
            
            const [ _k_col, _k_row ] = findTheKing( _chessModel, isWhiteTurn ? 'w' : 'b')
            const _k_position = _k_col + _k_row

            if ( oppositePotentials.includes( _k_position ) ) {
                removePotentials.push( potential )
            }
        })

        if ( removePotentials.length ) {

            removePotentials.forEach( potential => {
                delete chessModel[col][row].potentials[ chessModel[col][row].potentials.indexOf( potential ) ]
            })

            chessModel[col][row].potentials = chessModel[col][row].potentials.filter( item => !!item )
        }
        // removePotentials
    })
}

function findTheKing( _chessModel, _color ) {
    let _col, _row
    iterateChessModel(_chessModel, (col,row,color,piece,potentials) => {
        if ( !color && !piece ) return

        if ( _color === color && piece === 'kk' ) {
            _col = col
            _row = row
        }
    })

    return [ _col, _row ]
}

function generatePotentialCastle( chessModel ) {
    const oppositePotentials = getOpponentPotentials( chessModel )
    
    if ( isWhiteTurn ) {

        if (!( 
            chessModel['e']['1']?.piece[0] === 'w' &&
            chessModel['e']['1']?.piece[1] === 'kk'
        )) return

        // first castle
        if ( 
            !chessModel['f']['1'].piece.length &&
            !chessModel['g']['1'].piece.length &&

            !oppositePotentials.includes( 'h1' ) &&
            !oppositePotentials.includes( 'g1' ) && 
            !oppositePotentials.includes( 'f1' ) &&
            !oppositePotentials.includes( 'e1' ) &&

            chessModel['h']['1'].piece?.[0] === 'w' &&
            chessModel['h']['1'].piece?.[1] === 'r'
        ) {
            chessModel['e']['1'].potentials.push( 'g1' )
        }

        // second castle
        if (
            !chessModel['d']['1'].piece.length &&
            !chessModel['c']['1'].piece.length &&
            !chessModel['b']['1'].piece.length &&
            
            !oppositePotentials.includes( 'e1' ) &&
            !oppositePotentials.includes( 'd1' ) &&
            !oppositePotentials.includes( 'c1' ) && 
            !oppositePotentials.includes( 'b1' ) && 
            !oppositePotentials.includes( 'a1' ) && 

            chessModel['a']['1'].piece?.[0] === 'w' &&
            chessModel['a']['1'].piece?.[1] === 'r'
        ) {
            chessModel['e']['1'].potentials.push( 'c1' )
        }

        return
    }

    if ( !isWhiteTurn ) {

        if (!( 
            chessModel['e']['8']?.piece[0] === 'b' &&
            chessModel['e']['8']?.piece[1] === 'kk'
        )) return

        // first castle
        if ( 
            !chessModel['f']['8'].piece.length &&
            !chessModel['g']['8'].piece.length &&

            !oppositePotentials.includes( 'h8' ) &&
            !oppositePotentials.includes( 'g8' ) && 
            !oppositePotentials.includes( 'f8' ) &&
            !oppositePotentials.includes( 'e8' ) &&

            chessModel['h']['8'].piece?.[0] === 'b' &&
            chessModel['h']['8'].piece?.[1] === 'r'
        ) {
            chessModel['e']['8'].potentials.push( 'g8' )
        }

        // second castle
        if (
            !chessModel['d']['8'].piece.length &&
            !chessModel['c']['8'].piece.length &&
            !chessModel['b']['8'].piece.length &&
            
            !oppositePotentials.includes( 'e8' ) &&
            !oppositePotentials.includes( 'd8' ) &&
            !oppositePotentials.includes( 'c8' ) && 
            !oppositePotentials.includes( 'b8' ) && 
            !oppositePotentials.includes( 'a8' ) && 

            chessModel['a']['8'].piece?.[0] === 'b' &&
            chessModel['a']['8'].piece?.[1] === 'r'
        ) {
            chessModel['e']['8'].potentials.push( 'c8' )
        }

        return
    }

}

function generateMovement( chessModel, col, row ) {
    const [ color, piece ] = chessModel[ col ][ row ].piece

    if ( !color || !piece ) return

    const specificConfig = {
        'p': generatePawn,
        'r': generateRook,
        'k': generateKnight,
        'b': generateBishop,
        'q': generateQueen,
        'kk': generateKing,
    }

    specificConfig[ piece ]( chessModel, col, row, color )
}

function generatePawn( chessModel, col, row, color ) {
    const colNr = getCols().indexOf( col )
    const rowNr = parseInt( row )

    const isWhite = color === 'w'
    const offsetRow = isWhite ? +1 : -1
    const startingRow = isWhite ? 2 : 7
    const endingOffset = ( rowNr === startingRow ? 2 : 1 )

    if ( isWhite ) {
        for ( let _row = rowNr + offsetRow; _row <= rowNr + endingOffset; _row++ ) 
            checkPotentialPawn( chessModel, color, col, row, col, _row, true ) 
    }
    else {
        for ( let _row = rowNr + offsetRow; _row >= rowNr - endingOffset; _row-- ) 
            checkPotential( chessModel, color, col, row, col, _row, true ) 
    }

    checkPotentialPawn( chessModel, color, col, row, getCols()[ colNr - 1 ], rowNr + offsetRow ) 
    checkPotentialPawn( chessModel, color, col, row, getCols()[ colNr + 1 ], rowNr + offsetRow )

    checkPotentialEnPeasant( chessModel, color, col, row, isWhite, colNr, rowNr, offsetRow )
}

function generateRook( chessModel, col, row, color ) {
    const colNr = getCols().indexOf( col )
    const rowNr = parseInt( row )

    for ( let _col = colNr + 1; _col < 8; _col++ )
        if ( !checkPotential( chessModel, color, col, row, getCols()[ _col ], row ) ) break

    for ( let _col = colNr - 1; _col >= 0; _col-- )
        if ( !checkPotential( chessModel, color, col, row, getCols()[ _col ], row ) ) break

    for ( let _row = rowNr + 1; _row <= 8; _row++ )
        if ( !checkPotential( chessModel, color, col, row, col, _row ) ) break

    for ( let _row = rowNr - 1; _row >= 0; _row-- )
        if ( !checkPotential( chessModel, color, col, row, col, _row ) ) break
}

function generateKnight( chessModel, col, row, color ) {
    const colNr = getCols().indexOf( col )
    const rowNr = parseInt( row )

    ;[
        [ +2, +1 ],
        [ +2, -1 ],
        [ -2, +1 ],
        [ -2, -1 ],
        [ +1, +2 ],
        [ +1, -2 ],
        [ -1, +2 ],
        [ -1, -2 ],
    ].forEach(([ offset1, offset2 ]) => {
        const _col = colNr + offset1
        const _row = rowNr + offset2
    
        checkPotential( chessModel, color, col, row, getCols()[ _col ], _row )
    })
}

function generateBishop( chessModel, col, row, color ) {
    const colNr = getCols().indexOf( col )
    const rowNr = parseInt( row )
    let _row

    _row = rowNr
    for ( let _col = colNr + 1; _col < 8; _col++ )
        if ( !checkPotential( chessModel, color, col, row, getCols()[ _col ], ++_row ) ) break
    
    _row = rowNr
    for ( let _col = colNr + 1; _col < 8; _col++ )
        if ( !checkPotential( chessModel, color, col, row, getCols()[ _col ], --_row ) ) break

    _row = rowNr
    for ( let _col = colNr - 1; _col >= 0; _col-- )
        if ( !checkPotential( chessModel, color, col, row, getCols()[ _col ], --_row ) ) break
    
    _row = rowNr
    for ( let _col = colNr - 1; _col >= 0; _col-- )
        if ( !checkPotential( chessModel, color, col, row, getCols()[ _col ], ++_row ) ) break
}

function generateQueen( chessModel, col, row, color ) {
    generateRook(  chessModel, col, row, color )
    generateBishop(  chessModel, col, row, color )
}

function generateKing( chessModel, col, row, color ) {
    const colNr = getCols().indexOf( col )
    const rowNr = parseInt( row )

    ;[
        [ +1, +1 ],
        [ +1, -1 ],
        [ -1, +1 ],
        [ -1, -1 ],
        [ 0, +1 ],
        [ 0, -1 ],
        [ +1, 0 ],
        [ -1, 0 ],
    ].forEach(([ offset1, offset2 ]) => {
        const _col = colNr + offset1
        const _row = rowNr + offset2
    
        checkPotential( chessModel, color, col, row, getCols()[ _col ], _row )
    })
}

function checkPotential( chessModel, color, col, row, _col, _row ) {
    if ( !chessModel?.[ _col ]?.[ _row ] ) return false

    const [ _color, _piece ] = chessModel[ _col ][ _row ].piece

    if ( !_color || color !== _color ) {
        chessModel[ col ][ row ].potentials.push( _col + _row )
    }

    return !_color
}
function checkPotentialPawn( chessModel, color, col, row, _col, _row, exception = false ) {
    if ( !chessModel?.[ _col ]?.[ _row ] ) return false
    
    const [ _color ] = chessModel[ _col ][ _row ].piece

    if ( 
        (exception && !_color) || 
        (!exception && _color && color !== _color)
    ) {
        chessModel[ col ][ row ].potentials.push( _col + _row )
    }
}
function checkPotentialEnPeasant( chessModel, color, col, row, isWhite, colNr, rowNr, offsetRow ) {
    let _col, _row
    
    if (!(
        (isWhite && rowNr === 5) ||
        (!isWhite && rowNr === 4)
    )) return
        
    _row = rowNr
    
    _col = colNr + 1
    checkEnpeasantDirection()
    
    _col = colNr - 1
    checkEnpeasantDirection()
    
    function checkEnpeasantDirection() {
        const _cell = chessModel?.[ getCols()[ _col ] ]?.[ _row ]
        if ( !_cell?.piece.length ) return
        
        const [ _color, _piece ] = _cell.piece
    
        if ( _color && color !== _color && _piece === 'p' ) {
            if ( !!chessModel?.[ getCols()[ _col ] ]?.[ rowNr + offsetRow ]?.piece?.length ) return
    
            chessModel[ col ][ row ].potentials.push( getCols()[ _col ] + ( rowNr + offsetRow ) )
        }
    }
    
}


//////

function getOpponentPotentials( chessModel ) {
    const allPotentials = []

    iterateChessModel( chessModel, function( col, row, color, piece, potentials ){
        if ( !color || !piece ) return
        if ( !potentials.length ) return
        if ( isCorrectTurn( color ) ) return
        
        allPotentials.push( ...potentials )
    })

    return allPotentials
}

//////

function addEventListeners( chessModel ) {
    getCells().forEach( cell => {
        cell.addEventListener( 'click', function(){
            const col = cell.getAttribute( 'col' )
            const row = cell.getAttribute( 'row' )

            /// move piece
            if ( !!pieceSelected.length && cell.classList.contains('highlight')) {
                const [ _col, _row ] = pieceSelected
                const [ _color, _piece ] = chessModel[ _col ][ _row ].piece
                
                // en peasant 
                const removeRow = parseInt(row) + ( _color === 'w' ? -1 : +1 ) 
                
                if ( removeRow < 9 && removeRow > 0 ) {
                    const [ a, piece ] = chessModel[ col ][ row ]?.piece
                    const [ color, b ] = chessModel[ col ][ removeRow ]?.piece
                    
                    if ( !piece && color !== _color && _piece === 'p' ) {
                        const removeCell = getCell( col, removeRow.toString() )
                        
                        removeCell?.querySelector( 'img' )?.remove()
    
                        chessModel[ col ][ removeRow.toString() ] = {
                            piece: [],
                            potentials: []
                        }
                    }
                }

                // remove previous cell
                const _cell = getCell(_col, _row)
                const _img = _cell.querySelector( 'img' )
                
                cell.querySelector( 'img' )?.remove()
                cell.append( _img )

                chessModel[ col ][ row ] = {
                    piece: [ ...chessModel[ _col ][ _row ].piece ],
                    potentials: []
                }

                chessModel[ _col ][ _row ] = {
                    piece: [],
                    potentials: []
                }

                // castle situations
                if ( 
                    col === 'g' && 
                    row === '1' && 
                    _color === 'w' && 
                    _piece === 'kk'
                ) {
                    getCell( 'f', '1' ).append( getCell( 'h', '1' ).querySelector( 'img' ) )
                   
                    chessModel[ 'f' ][ '1' ] = {
                        piece: [ 'w', 'r' ],
                        potentials: []
                    }
                    
                    chessModel[ 'h' ][ '1' ] = {
                        piece: [],
                        potentials: []
                    }
                }
                if ( 
                    col === 'c' && 
                    row === '1' && 
                    _color === 'w' && 
                    _piece === 'kk'
                ) {
                    getCell( 'd', '1' ).append( getCell( 'a', '1' ).querySelector( 'img' ) )
                   
                    chessModel[ 'd' ][ '1' ] = {
                        piece: [ 'w', 'r' ],
                        potentials: []
                    }

                    chessModel[ 'a' ][ '1' ] = {
                        piece: [],
                        potentials: []
                    }
                }

                // black castle
                if ( 
                    col === 'g' && 
                    row === '8' && 
                    _color === 'b' && 
                    _piece === 'kk'
                ) {
                    getCell( 'f', '8' ).append( getCell( 'h', '8' ).querySelector( 'img' ) )
                   
                    chessModel[ 'f' ][ '8' ] = {
                        piece: [ 'b', 'r' ],
                        potentials: []
                    }

                    chessModel[ 'h' ][ '8' ] = {
                        piece: [],
                        potentials: []
                    }
                }
                if ( 
                    col === 'c' && 
                    row === '8' && 
                    _color === 'b' && 
                    _piece === 'kk'
                ) {
                    getCell( 'd', '8' ).append( getCell( 'a', '8' ).querySelector( 'img' ) )
                   
                    chessModel[ 'd' ][ '8' ] = {
                        piece: [ 'b', 'r' ],
                        potentials: []
                    }

                    chessModel[ 'a' ][ '8' ] = {
                        piece: [],
                        potentials: []
                    }
                }

                pieceSelected = []
                isWhiteTurn = !isWhiteTurn
                
                dehilightCells()
                generateAllMovement( chessModel )
                generateChessMate( chessModel )
                alertEndGame( chessModel )
            }

            /// generate movement
            else if ( canMove( col, row ) ) {
                pieceSelected = [ col, row ]
                highlightPotentials( col, row )
            }
        })
    })
}

function alertEndGame( chessModel ) {
    const checkPotentials = []
    iterateChessModel(chessModel, (col,row,color,piece,potentials) => {
        if ( !color || !piece ) return
        if ( !isCorrectTurn( color )) return 

        checkPotentials.push( ...potentials )
    })

    if ( !checkPotentials.length ) {
        const _k_position = findTheKing( chessModel, isWhiteTurn ? 'w' : 'b' ).join('')
        const oppositePotentials = getOpponentPotentials( chessModel )

        const isStaleMate = !oppositePotentials.includes( _k_position )

        setTimeout(_ => {
            if ( isStaleMate ) {
                alert( 'STALE MATE - draw, nobody wins. Play again ?' )
            }else {
                alert( `${ isWhiteTurn ? 'Black' : 'White' } WINS! Play again ?` )
            }
    
            startGame()
        }, 500)
        
    }
}

function canMove( col, row ) {
    const hasPiece = !!chessModel[ col ][ row ].piece.length
    const [ color ] = chessModel[ col ][ row ].piece

    return hasPiece && isCorrectTurn( color )
}

function isCorrectTurn( color ) {
    return (
        isWhiteTurn && color === 'w' ||
        !isWhiteTurn && color === 'b'
    )
}

function dehilightCells() {
    getCells().forEach( cell => cell.classList.remove( 'highlight' ) )
}

function highlightPotentials( col, row ) {
    dehilightCells()

    const { potentials } = chessModel[ col ][ row ]
    
    potentials.forEach( position => {
        const [ col, row ] = position.split( '' )
        const cell = getCell( col, row )
        cell.classList.add( 'highlight')
    })
}

let pieceSelected, isWhiteTurn, chessModel

function startGame() {
    pieceSelected = []
    isWhiteTurn = true

    ;[ ...document.querySelectorAll( '.cell img' ) ].forEach( img => img.remove())
    chessModel = generateChessModel()

    arangePiecesPositions( chessModel )
    renderChessPieces( chessModel )
    addEventListeners( chessModel )
    generateAllMovement( chessModel )
    generateChessMate( chessModel )
}

renderChessHtml()
startGame()

/////

