const path = require('path');
const qqwing = require(path.join(__dirname, 'node_modules', 'qqwing'));

const args = process.argv.slice(2);
let count = 1;
let targetDifficulty = null;

const DIFF_MAP = {
    simple: qqwing.Difficulty.SIMPLE,
    easy: qqwing.Difficulty.EASY,
    intermediate: qqwing.Difficulty.INTERMEDIATE,
    expert: qqwing.Difficulty.EXPERT,
};

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
        count = parseInt(args[++i], 10);
    } else if (args[i] === '--difficulty' && args[i + 1]) {
        const d = args[++i].toLowerCase();
        if (!(d in DIFF_MAP)) {
            process.stderr.write(`Unknown difficulty: ${d}\n`);
            process.exit(1);
        }
        targetDifficulty = DIFF_MAP[d];
    }
}

function generateOne(targetDiff) {
    const MAX_TRIES = 200;
    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
        const board = new qqwing();
        board.generatePuzzle();
        board.setRecordHistory(targetDiff !== null);
        board.solve();
        if (targetDiff !== null && board.getDifficulty() !== targetDiff) continue;
        board.setPrintStyle(qqwing.PrintStyle.ONE_LINE);
        const puzzle = board.getPuzzleString().trim().replace(/\./g, '0');
        const solution = board.getSolutionString().trim().replace(/\./g, '0');
        return { puzzle, solution };
    }
    return null;
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
