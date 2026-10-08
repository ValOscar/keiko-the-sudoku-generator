# Sudoku Generator

Generates Sudoku puzzles using [QQWing](https://qqwing.com) and renders each one — along with its solution — as a pair of SVG files.

## How it works

`generate.py` calls a thin Node.js wrapper (`qqwing-cli.js`) that drives the QQWing JavaScript library to produce puzzles. Each puzzle and its solution are then rendered to SVG using Python's standard library — no external Python packages required.

In the puzzle SVG, given (clue) digits are shown in black and empty cells are left blank. In the solution SVG, given digits remain black and the solved digits are shown in blue.

## Requirements

- [uv](https://docs.astral.sh/uv/) (Python environment manager)
- Node.js (for the QQWing library)

## Setup

Install the Node.js dependency:

```bash
npm install
```

The Python virtual environment is managed by uv. No additional setup is needed — uv creates and uses it automatically on first run.

## Usage

```
uv run generate.py <count> [--difficulty <level>]
```

| Argument       | Description                                              |
| -------------- | -------------------------------------------------------- |
| `count`        | Number of puzzles to generate (must be ≥ 1)              |
| `--difficulty` | `simple`, `easy`, `intermediate`, or `expert` (optional) |

**Examples:**

```bash
# Generate 1 puzzle at the default difficulty
uv run generate.py 1

# Generate 5 expert puzzles
uv run generate.py 5 --difficulty expert
```

### Difficulty levels

QQWing reduces every puzzle to a minimal set of clues (~25 givens), whatever its difficulty, so its rating alone produces grids that feel alike. Each level therefore combines two criteria:

1. **Techniques required** — QQWing rates the puzzle by the hardest technique needed to solve it.
2. **Number of givens** — solution digits are added back until a target count is reached. A digit is only kept if the puzzle still needs the level's techniques.

| Level          | Techniques required                                    | Givens         |
| -------------- | ------------------------------------------------------ | -------------- |
| `simple`       | Singles only (naked or hidden)                         | 38–42          |
| `easy`         | Singles only (naked or hidden)                         | 31–34          |
| `intermediate` | Pairs, pointing pairs/triples or box/line reduction    | 27–30          |
| `expert`       | Guessing (trial and error)                             | Minimal (~22–28) |

`simple` and `easy` use the same techniques and differ in the number of givens: more givens means more cells that can be filled straight away.

Without `--difficulty`, puzzles are left exactly as QQWing generates them: minimal givens and any rating.

Every puzzle has a single solution.

Output files are written to the `output/` directory, created automatically if it does not exist:

```
output/
  puzzle_1.svg
  solution_1.svg
  puzzle_2.svg
  solution_2.svg
  ...
```

## Repository structure

```
keiko-the-sudoku-generator/
├── generate.py        # Entry point — parses args, calls QQWing, writes SVGs
├── qqwing-cli.js      # Node.js wrapper around the QQWing library
├── package.json       # Node.js dependency manifest (qqwing)
├── pyproject.toml     # Python project config and uv metadata
├── .python-version    # Python version pin used by uv
└── output/            # Generated SVG files (created at runtime)
```
