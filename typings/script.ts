console.log("Test Passed");

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

const DIRECTIONS: Coordinate[] = [
    [-1, -1], 
    [-1, 0], 
    [-1, 1], 
    [0, -1], 
    [0, 1], 
    [1, -1], 
    [1, 0], 
    [1, 1]
];

const boardSize = BOARD_SIZE * SQUARE_SIZE + (BOARD_SIZE + 1) * PADDING;
const board: number[][] = [];
var turn = Tile.BLACK;

var canvas: HTMLCanvasElement;
var ctx: CanvasRenderingContext2D;

window.addEventListener("load", load);

function load() {
    canvas = <HTMLCanvasElement>document.getElementById(BOARD_ID);
    ctx = <CanvasRenderingContext2D>canvas.getContext("2d");

    canvas.width = boardSize;
    canvas.height = boardSize;

    canvas.addEventListener("click", event => handleClick([event.offsetX, event.offsetY]));

    setupBoard();
    update();
}

function setupBoard() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        const column = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            column.push(Tile.EMPTY);
        }

        board.push(column);
    }

    for (let i = 0; i < STARTING_TILES.length; i++) {
        const starter = STARTING_TILES[i];
        board[starter.x][starter.y] = starter.tile;
    }
}

function handleClick(coordinate: Coordinate) {
    const square = toSquare(coordinate);
    if (getTile(square) !== Tile.EMPTY || !isLegal(square)) {
        return;
    }

    makeTurn(square);
}

function makeTurn(square: Coordinate) {
    for (const direction of DIRECTIONS) {
        for (const coordinate of checkDirection(direction, square)) {
            setTile(coordinate, turn);
        }
    }

    turn *= -1;
}

function getTile(coordinate: Coordinate) {
    return board[coordinate[0]][coordinate[1]];
}

function setTile(coordinate: Coordinate, tile: Tile) {
    board[coordinate[0]][coordinate[1]] = tile;
    update();
}

function toSquare([x, y]: Coordinate): Coordinate {
    const square = (coordinate: number) => Math.floor(coordinate / (SQUARE_SIZE + PADDING));
    return [square(x), square(y)];
}

function isLegal(coordinate: Coordinate) {
    if (getTile(coordinate) !== Tile.EMPTY) {
        return false;
    }

    return DIRECTIONS.some(d => checkDirection(d, coordinate).length > 0);
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

            if (isLegal([column, row])) {
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

    for (let i = 0; i < CIRCLES.length; i++) {
        const coordinate = (index: number) => (SQUARE_SIZE + PADDING) * CIRCLES[i][index] + PADDING / 2;

        ctx.fillStyle = BACKGROUND_COLOUR;
        ctx.strokeStyle = BACKGROUND_COLOUR;

        ctx.beginPath();
        ctx.arc(coordinate(0), coordinate(1), CIRCLE_SIZE / 2, 0, 2 * Math.PI);
        ctx.fill();
    }
}