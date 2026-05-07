import argparse
import os
import shutil
import subprocess
import sys

CELL = 60
GRID = 540
SVG_W = 580
SVG_H = 580
GRID_X = 20
GRID_Y = 20
GIVEN_COLOR = "#000000"
SOLVED_COLOR = "#1a6fbf"

VALID_DIFFICULTIES = {"simple", "easy", "intermediate", "expert"}


def run_qqwing(count: int, difficulty: str | None) -> list[tuple[str, str]]:
    if shutil.which("node") is None:
        sys.exit("Error: node not found. Install Node.js from https://nodejs.org")

    cli = os.path.join(os.path.dirname(os.path.abspath(__file__)), "qqwing-cli.js")
    cmd = ["node", cli, "--count", str(count)]
    if difficulty:
        cmd += ["--difficulty", difficulty]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(f"qqwing-cli.js failed:\n{result.stderr}")

    return parse_qqwing_output(result.stdout)


def parse_qqwing_output(output_text: str) -> list[tuple[str, str]]:
    lines = [l.strip() for l in output_text.splitlines()]
    digit_lines = [l for l in lines if len(l) == 81 and l.isdigit()]

    if len(digit_lines) % 2 != 0:
        print(f"Warning: odd number of 81-char lines ({len(digit_lines)}), dropping last.")
        digit_lines = digit_lines[:-1]

    return [(digit_lines[i], digit_lines[i + 1]) for i in range(0, len(digit_lines), 2)]


def render_svg(puzzle_str: str, solution_str: str, is_solution: bool, puzzle_num: int) -> str:
    parts = []

    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{SVG_W}" height="{SVG_H}" '
        f'viewBox="0 0 {SVG_W} {SVG_H}">'
    )

    for i in range(10):
        x = GRID_X + i * CELL
        y = GRID_Y + i * CELL
        parts.append(
            f'<line x1="{x}" y1="{GRID_Y}" x2="{x}" y2="{GRID_Y + GRID}" '
            f'stroke="#999" stroke-width="1"/>'
        )
        parts.append(
            f'<line x1="{GRID_X}" y1="{y}" x2="{GRID_X + GRID}" y2="{y}" '
            f'stroke="#999" stroke-width="1"/>'
        )

    for i in [0, 3, 6, 9]:
        x = GRID_X + i * CELL
        y = GRID_Y + i * CELL
        parts.append(
            f'<line x1="{x}" y1="{GRID_Y}" x2="{x}" y2="{GRID_Y + GRID}" '
            f'stroke="#000" stroke-width="2.5"/>'
        )
        parts.append(
            f'<line x1="{GRID_X}" y1="{y}" x2="{GRID_X + GRID}" y2="{y}" '
            f'stroke="#000" stroke-width="2.5"/>'
        )

    parts.append(
        f'<rect x="{GRID_X}" y="{GRID_Y}" width="{GRID}" height="{GRID}" '
        f'fill="none" stroke="#000" stroke-width="3"/>'
    )

    for idx in range(81):
        row, col = divmod(idx, 9)
        cx = GRID_X + col * CELL + CELL // 2
        cy = GRID_Y + row * CELL + CELL // 2
        p_digit = puzzle_str[idx]
        s_digit = solution_str[idx]

        if p_digit != "0":
            parts.append(
                f'<text x="{cx}" y="{cy}" text-anchor="middle" '
                f'dominant-baseline="central" font-family="sans-serif" '
                f'font-size="32" fill="{GIVEN_COLOR}">{p_digit}</text>'
            )
        elif is_solution:
            parts.append(
                f'<text x="{cx}" y="{cy}" text-anchor="middle" '
                f'dominant-baseline="central" font-family="sans-serif" '
                f'font-size="32" fill="{SOLVED_COLOR}">{s_digit}</text>'
            )

    parts.append("</svg>")
    return "\n".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Sudoku puzzles as SVG files.")
    parser.add_argument("count", type=int, help="Number of puzzles to generate")
    parser.add_argument(
        "--difficulty",
        choices=list(VALID_DIFFICULTIES),
        default=None,
        help="Puzzle difficulty (default: qqwing default)",
    )
    args = parser.parse_args()

    if args.count < 1:
        sys.exit("Error: count must be at least 1")

    pairs = run_qqwing(args.count, args.difficulty)

    if not pairs:
        sys.exit("Error: qqwing produced no parseable puzzles.")

    if len(pairs) < args.count:
        print(f"Warning: requested {args.count} puzzles but only got {len(pairs)}.")

    os.makedirs("output", exist_ok=True)

    for n, (puzzle_str, solution_str) in enumerate(pairs, start=1):
        puzzle_svg = render_svg(puzzle_str, solution_str, False, n)
        solution_svg = render_svg(puzzle_str, solution_str, True, n)

        with open(f"output/puzzle_{n}.svg", "w", encoding="utf-8") as f:
            f.write(puzzle_svg)
        with open(f"output/solution_{n}.svg", "w", encoding="utf-8") as f:
            f.write(solution_svg)
        print(f"  Written: output/puzzle_{n}.svg, output/solution_{n}.svg")

    print(f"Done. {len(pairs)} puzzle(s) written to output/")


if __name__ == "__main__":
    main()
