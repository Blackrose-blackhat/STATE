# GAME RULES — Prototype v0.1

## Overview

This is a turn-based, two-player strategy game played on a shared grid.

There are:
- No pieces
- No randomness
- No hidden information
- No typing or coding

Players compete by **controlling space** and **removing the opponent’s viable decisions**.

The game rewards foresight, restraint, and understanding of consequences.

---

## Board

- The board is a **5×5 grid**
- All tiles start as **Neutral**
- The board state is fully visible to both players at all times

Tile states:
- Neutral
- Controlled by Player A
- Controlled by Player B

No tile has health, levels, or attributes.

---

## Starting State

- Player A controls the **center tile**
- Player B controls the **top-right corner tile**
- Player A takes the first turn

---

## Turn Structure

On your turn, you must perform **exactly one action**.

If no legal action is available, you **lose immediately**.

There are no skipped turns unless forced by lack of legal moves.

---

## Actions

A player may choose **one** of the following actions per turn:

### 1. Expand

- Choose a tile you control
- Take control of **one adjacent Neutral tile** (up, down, left, right)

Restrictions:
- You cannot expand into enemy-controlled tiles
- You cannot expand diagonally

---

### 2. Contest

- If an enemy-controlled tile is adjacent to **two or more of your tiles**, you may flip it
- The tile immediately becomes yours

Restrictions:
- Contesting is only allowed if the condition is already satisfied
- No delayed effects — the flip happens instantly

---

## Illegal Moves

A move is illegal if:
- There is no adjacent Neutral tile to expand into
- There is no enemy tile meeting the contest condition
- The selected tile is not controlled by you

If all possible actions are illegal, the player loses.

---

## Win Condition

You win when your opponent starts their turn with **no legal actions**.

This usually occurs when:
- They are fully surrounded
- All expansion paths are blocked
- Contest conditions cannot be created

There is no score. There are no draws in the prototype.

---

## Design Principles (Intentional Constraints)

- Fewer rules > more depth
- No randomness
- No execution speed advantage
- Every loss should be traceable to a decision
- Over-expansion can be punished

This game is about **decision quality**, not tactics or memorization.

---

## What This Game Is NOT

- Not chess
- Not tic-tac-toe
- Not a coding challenge
- Not a puzzle with a correct answer

It is a competitive system-design game.

---

## Prototype Goals

This version exists to test:
- Is the core loop understandable without explanation?
- Do players feel responsible for losses?
- Does replaying feel meaningful?

If the answer to any of these is "no", rules must be **removed**, not expanded.

