# AGENTS.md

## Repository Defaults

- Always use `bun` for package management, scripts, installs, and one-off commands in this repository.
- Do not use `npm`, `yarn`, or `pnpm` unless the user explicitly asks for one of them.
- Prefer Bun equivalents:
  - `bun install`
  - `bun add <pkg>`
  - `bun remove <pkg>`
  - `bun run <script>`
  - `bun x <command>`

## Command Guidance

- When the repo needs dependencies installed, use `bun install`.
- When running project scripts, use `bun run <script>`.
- When invoking local CLIs, prefer `bun x <tool>` if a direct `bun run` script is not available.
- When suggesting commands to the user, default to Bun-based commands.

## Project Intent

This repository is Bun-first. Any agent working in this repo should assume Bun is the standard runtime and package manager unless the user says otherwise.