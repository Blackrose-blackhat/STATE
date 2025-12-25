# GAME RULES — Prototype v0.2

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

Tiles have no health, levels, or attributes.

---

## Starting State

- Player A controls the **center tile**
- Player B controls **one corner tile**
- Player A takes the first turn

---

## Turn Structure

On your turn, you must perform **exactly one action**.

If no legal action is available, you **lose immediately**.

There are no skipped turns.

---

## Actions

A player may choose **one** of the following actions per turn:

### 1. Expand

- Choose a tile you control
- Take control of **one adjacent Neutral tile**
- Adjacent means up, down, left, or right (no diagonals)

Restrictions:
- You cannot expand into opponent-controlled tiles
- You cannot expand diagonally

---

### 2. Contest

- If an opponent-controlled tile is adjacent to **two or more of your tiles**, you may flip it
- The tile immediately becomes yours

Restrictions:
- The contest condition must already be satisfied at the time of the move
- Only one tile may be flipped per turn

---

## Contest Resolution Rule (Critical)

When a tile is flipped due to a contest:

- **No further contest checks are triggered by that flip**
- Each turn may cause **at most one tile to change ownership**
- A tile that is flipped due to a contest cannot be contested again on the immediately following turn.

This prevents cascading flips and ensures every move has a single, stable outcome.

---

## Illegal Moves

A move is illegal if:
- There is no adjacent Neutral tile to expand into
- There is no opponent tile that satisfies the contest condition
- The selected tile is not controlled by the player

If all possible actions are illegal, the player loses.

---

## Win Condition

You win when your opponent starts their turn with **no legal actions**.

This typically occurs when:
- All expansion paths are blocked
- Contest conditions cannot be created
- The opponent has no viable decisions left

There is no scoring system.
There are no draws in this prototype.

---

## Design Principles (Intentional Constraints)

- Fewer rules over more mechanics
- No randomness
- No execution speed advantage
- Every loss should be traceable to a decision
- Over-expansion is punishable

This is a game about **decision quality**, not tactics or memorization.

---

## What This Game Is NOT

- Not chess
- Not tic-tac-toe
- Not a coding challenge
- Not a puzzle with a single correct solution

It is a competitive game about **control and constraint**.

---

## Prototype Goals

This version exists to test:
- Is the core loop understandable without explanation?
- Do players understand why they lost?
- Does replaying feel meaningful?

If any answer is "no", rules must be **removed**, not expanded.
