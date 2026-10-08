const path = require('path');
const qqwing = require(path.join(__dirname, 'node_modules', 'qqwing'));

// qqwing always reduces puzzles to a minimal set of clues (~25 givens), whatever
// the difficulty, so its technique-based rating alone produces grids that feel
// alike. Each level therefore also gets a target number of givens: once a puzzle
// requiring the right techniques is found, solution digits are added back until
// the target is reached, skipping any clue that would lower the rating.
const LEVELS = {
    // qqwing's SIMPLE (naked singles) and EASY (hidden singles) are equally
    // easy for humans, so both accept either and are separated by clue count.
    simple: { accept: [qqwing.Difficulty.SIMPLE, qqwing.Difficulty.EASY], givens: [38, 42] },
    easy: { accept: [qqwing.Difficulty.SIMPLE, qqwing.Difficulty.EASY], givens: [31, 34] },
    intermediate: { accept: [qqwing.Difficulty.INTERMEDIATE], givens: [27, 30] },
    expert: { accept: [qqwing.Difficulty.EXPERT], givens: null },
};

function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function rate(cells) {
    const board = new qqwing();
    board.setPuzzle(cells);
    board.setRecordHistory(true);
    board.solve();
    return board.getDifficulty();
}

function addClues(cells, solution, level) {
    const target = randInt(level.givens[0], level.givens[1]);
    const empty = [];
    for (let i = 0; i < 81; i++) if (cells[i] === 0) empty.push(i);
    for (let i = empty.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [empty[i], empty[j]] = [empty[j], empty[i]];
    }
    let givens = 81 - empty.length;
    for (const pos of empty) {
        if (givens >= target) break;
        cells[pos] = solution[pos];
        if (level.accept.includes(rate(cells))) givens++;
        else cells[pos] = 0;
    }
    return cells;
}

function toCells(str) {
    return str.trim().replace(/\./g, '0').split('').map(Number);
}

function generateOne(levelName) {
    const level = levelName ? LEVELS[levelName] : null;
    const MAX_TRIES = 200;
    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
        const board = new qqwing();
        board.generatePuzzle();
        board.setRecordHistory(level !== null);
        board.solve();
        if (level && !level.accept.includes(board.getDifficulty())) continue;
        board.setPrintStyle(qqwing.PrintStyle.ONE_LINE);
        let cells = toCells(board.getPuzzleString());
        const solution = toCells(board.getSolutionString());
        if (level && level.givens) cells = addClues(cells, solution, level);
        return { puzzle: cells.join(''), solution: solution.join('') };
    }
    return null;
}

const args = process.argv.slice(2);
let count = 1;
let targetDifficulty = null;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
        count = parseInt(args[++i], 10);
    } else if (args[i] === '--difficulty' && args[i + 1]) {
        const d = args[++i].toLowerCase();
        if (!(d in LEVELS)) {
            process.stderr.write(`Unknown difficulty: ${d}\n`);
            process.exit(1);
        }
        targetDifficulty = d;
    }
}

for (let i = 0; i < count; i++) {
    const result = generateOne(targetDifficulty);
    if (!result) {
        process.stderr.write(`Failed to generate puzzle ${i + 1} with the requested difficulty after 200 attempts.\n`);
        process.exit(1);
    }
    process.stdout.write(result.puzzle + '\n');
    process.stdout.write(result.solution + '\n');
}
