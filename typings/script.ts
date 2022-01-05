/******************************************************************************
**
** File      script.ts
** Author    Tommy Skeffington
** Copyright (c) 2022 Tommy Skeffington
**
** This file is part of https://github.com/tommyskeff/web-othello
**
******************************************************************************/

enum Tile {
    WHITE = -1,
    EMPTY = 0,
    BLACK = 1
}

type Coordinate = [number, number];

const BOARD_SIZE = 8;
const SQUARE_SIZE = 60;
const TILE_SIZE = 50;
const PADDING = 5;
const BACKGROUND_COLOUR = "#000000";
const SQUARE_COLOUR = "#66A760";
const SHADOW_COLOUR = "#000000";
const SHADOW_WIDTH = 2;
const BOARD_ID = "board";
const CIRCLES = [[2, 2], [6, 6], [2, 6], [6, 2]];
const CIRCLE_SIZE = 15;

const TILE_COLOURS = {
    [Tile.WHITE]: "#FFFFFF",
    [Tile.BLACK]: "#000000"
};

const STARTING_TILES = [
    { tile: Tile.WHITE, x: 3, y: 3 },
    { tile: Tile.WHITE, x: 4, y: 4 },
    { tile: Tile.BLACK, x: 3, y: 4 },
    { tile: Tile.BLACK, x: 4, y: 3 },
];

var boardSize = BOARD_SIZE * SQUARE_SIZE + BOARD_SIZE * PADDING + PADDING;
var board: number[][] = [];
var directions: Coordinate[];
var playing = false;

var turn: Tile;
var move: number;
var canvas: HTMLCanvasElement;
var ctx: CanvasRenderingContext2D;
var reset: HTMLButtonElement;

var options: {
    legalMoves: HTMLInputElement;
    boardDecorations: HTMLInputElement;
};

var stats: {
    turn: HTMLAnchorElement;
    move: HTMLAnchorElement;
    blackTiles: HTMLAnchorElement;
    whiteTiles: HTMLAnchorElement;
    emptyTiles: HTMLAnchorElement;
};

window.addEventListener("load", load);

function load() {
    canvas = document.getElementById(BOARD_ID)as HTMLCanvasElement;
    ctx = canvas.getContext("2d")as CanvasRenderingContext2D;
    reset = document.getElementById("reset") as HTMLButtonElement;

    canvas.width = boardSize;
    canvas.height = boardSize;

    canvas.addEventListener("click", event => handleClick([event.offsetX, event.offsetY]));

    setupOptions();
    setupDirections();
    setupBoard();

    (document.getElementsByClassName("content")[0] as HTMLElement).style.display = "flex";
}

function setupDirections() {
    directions = [];
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            if (x == 0 && y == 0) {
                continue;
            }

            directions.push([x, y]);
        }
    }
}

function setupOptions() {
    const getOption = (name: string) => <HTMLInputElement>document.getElementById(name + "-option");
    const getStat = (name: string) => <HTMLAnchorElement>document.getElementById(name);

    options = {
        legalMoves: getOption("legalmoves"),
        boardDecorations: getOption("boarddecorations")
    };

    stats = {
        turn: getStat("turn"),
        move: getStat("move"),
        blackTiles: getStat("black-tiles"),
        whiteTiles: getStat("white-tiles"),
        emptyTiles: getStat("empty-tiles")
    }

    for (const [, value] of Object.entries(options)) {
        value.addEventListener("click", update);
    }

    reset.addEventListener("click", () => {
        if (confirm("Are you sure you want to reset the board?")) {
            setupBoard();
        }
    });
}

function setupBoard() {
    var tempBoard = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        const column = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            column.push(Tile.EMPTY);
        }

        tempBoard.push(column);
    }

    for (let i = 0; i < STARTING_TILES.length; i++) {
        const starter = STARTING_TILES[i];
        tempBoard[starter.x][starter.y] = starter.tile;
    }

    board = tempBoard;
    turn = Tile.BLACK;
    playing = true;
    move = 2;

    update();
}

function handleClick(coordinate: Coordinate) {
    if (!playing) {
        return;
    }

    const square = toSquare(coordinate);
    if (getTile(square) !== Tile.EMPTY || !isLegal(square)) {
        return;
    }

    makeTurn(square);
}

function makeTurn(square: Coordinate) {
    for (const direction of directions) {
        for (const coordinate of checkDirection(direction, square)) {
            setTile(coordinate, turn);
        }
    }

    turn *= -1;
    move++;
    update();

    if (getLegalMoves().length > 0) {
        return;
    }

    playing = false;
    turn *= -1;
    move++;

    if (getLegalMoves().length > 0) {
        setTimeout(() => {
            update();
            playing = true;
        }, 1000);

        return;
    }

    stats.turn.innerHTML = "Game over";
}

function getTile(coordinate: Coordinate) {
    return board[coordinate[0]][coordinate[1]];
}

function setTile(coordinate: Coordinate, tile: Tile) {
    board[coordinate[0]][coordinate[1]] = tile;
}

function toSquare([x, y]: Coordinate): Coordinate {
    const square = (coordinate: number) => Math.floor(coordinate / (SQUARE_SIZE + PADDING));
    return [square(x), square(y)];
}

function getLegalMoves() {
    const moves: Coordinate[] = [];
    for (let column = 0; column < board.length; column++) {
        for (let row = 0; row < board[column].length; row++) {
            const move: Coordinate = [column, row];
            if (!isLegal(move)) {
                continue;
            }

            moves.push(move);
        }
    }

    return moves;
}

function isLegal(coordinate: Coordinate) {
    if (getTile(coordinate) !== Tile.EMPTY) {
        return false;
    }

    return directions.some(d => checkDirection(d, coordinate).length > 0);
}

function checkDirection([increaseX, increaseY]: Coordinate, [originX, originY]: Coordinate): Coordinate[] {
    const validate = (index: number) => index >= 0 && index < BOARD_SIZE;
    const double = (num: number) => 2 * num;

    const nextX = originX + increaseX;
    const nextY = originY + increaseY;

    if (validate(nextX) && validate(nextY) && getTile([nextX, nextY]) !== turn * -1) {
        return [];
    }

    const flips: Coordinate[] = [[originX, originY], [nextX, nextY]];
    for (let x = originX + double(increaseX), y = originY + double(increaseY); validate(x) && validate(y); x += increaseX, y += increaseY) {
        const coordinate: Coordinate = [x, y];
        const tile = getTile(coordinate);

        if (tile === turn) {
            return flips;
        } else if (tile === Tile.EMPTY) {
            return [];
        }

        flips.push(coordinate);
    }

    return [];
}

function update() {
    const tiles: Tile[] = [];
    for (let column = 0; column < board.length; column++) {
        for (let row = 0; row < board[column].length; row++) {
            tiles.push(getTile([column, row]));
        }
    }

    stats.turn.innerHTML = turn == 1 ? "Black" : "White";
    stats.move.innerHTML = Math.floor(move / 2).toString();
    stats.blackTiles.innerHTML = tiles.filter(t => t == Tile.BLACK).length.toString();
    stats.whiteTiles.innerHTML = tiles.filter(t => t == Tile.WHITE).length.toString();
    stats.emptyTiles.innerHTML = tiles.filter(t => t == Tile.EMPTY).length.toString();

    requestAnimationFrame(render);
}

function render() {
    ctx.fillStyle = BACKGROUND_COLOUR;
    ctx.fillRect(0, 0, boardSize, boardSize);

    for (let column = 0; column < board.length; column++) {
        for (let row = 0; row < board[column].length; row++) {
            const coordinate = (index: number) => (SQUARE_SIZE + PADDING) * index + PADDING;
            const x = coordinate(column);
            const y = coordinate(row);

            ctx.fillStyle = SQUARE_COLOUR;
            ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);

            const tile = board[column][row];
            const halfSize = SQUARE_SIZE / 2;

            if (options.legalMoves.checked && isLegal([column, row])) {
                ctx.strokeStyle = SHADOW_COLOUR;
                ctx.lineWidth = SHADOW_WIDTH;
                ctx.beginPath();
                ctx.arc(x + halfSize, y + halfSize, TILE_SIZE / 2, 0, 2 * Math.PI);
                ctx.stroke();
            }

            if (tile === Tile.EMPTY) {
                continue;
            }

            const colour = TILE_COLOURS[<Tile.WHITE | Tile.BLACK>tile];

            ctx.fillStyle = colour;
            ctx.strokeStyle = colour;

            ctx.beginPath();
            ctx.arc(x + halfSize, y + halfSize, TILE_SIZE / 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    if (!options.boardDecorations.checked) {
        return;
    }

    for (let i = 0; i < CIRCLES.length; i++) {
        const coordinate = (index: number) => (SQUARE_SIZE + PADDING) * CIRCLES[i][index] + PADDING / 2;

        ctx.fillStyle = BACKGROUND_COLOUR;
        ctx.strokeStyle = BACKGROUND_COLOUR;

        ctx.beginPath();
        ctx.arc(coordinate(0), coordinate(1), CIRCLE_SIZE / 2, 0, 2 * Math.PI);
        ctx.fill();
    }
}