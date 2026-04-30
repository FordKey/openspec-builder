# OpenSpec-Builder

OpenSpec-Builder is a dark-mode web app for turning an app idea into a structured OpenSpec handoff that a VS Code chat agent can use to start building.

It is designed for weekend warrior programmers, home-lab builders, and application designers who want a calmer way to describe a project before handing it to tools like Codex, Claude, Roo, or Continue.

> Beta notice: this is an early implementation. Your mileage may vary. Test it with a small project first to see whether the generated artifacts help your workflow before aiming it at a production-level build.

## What It Does

OpenSpec-Builder walks a Builder through a practical project wizard, saves the answers to SQLite, and generates a project folder that can be opened directly in VS Code as the future app repository.

The generated project folder includes:

- `AGENTS.md` with coding-agent instructions.
- `.vscode/` recommendations and settings.
- `openspec/config.yaml` with stack, backend, deployment, brand, and sanity-check rules.
- `openspec/project.md` with project conventions.
- `openspec/specs/<capability>/spec.md` with active product requirements.
- `openspec/changes/<change-id>/proposal.md`.
- `openspec/changes/<change-id>/design.md`.
- `openspec/changes/<change-id>/tasks.md`.
- `openspec/changes/<change-id>/specs/<capability>/spec.md`.
- `docs/builder-inputs.md` with the captured project intent.
- `docs/ai-sanity-check.md` with the AI build review cadence.
- `docs/wireframe/index.html` with a generated navigable wireframe.
- `public/brand/` with uploaded project logo assets.
- `project.json` with the complete generated project record.

The goal is not to build the target app inside OpenSpec-Builder. The goal is to create a useful, reviewable project folder so a coding agent can start from a stronger brief.

## Main Features

- Minimal dark-mode SaaS-style interface.
- Collapsible sidebar with Home, New, and Projects views.
- New-project wizard focused on the questions that matter most.
- Project logo upload.
- Logo-aware palette suggestions.
- Mood styles for Minimalist, Dynamic, Corporate, and Chill directions.
- Hex and RGB color entry.
- Exactly one selected palette option.
- Font and icon library selection.
- Runtime, backend, Docker, Cloudflared, Portainer, and coding-agent selections.
- SQLite persistence.
- Edit, clone, delete, view wireframe, and download actions for saved projects.
- Real-time zip download of the generated project folder without storing zip files on the server.
- Generated wireframes that use the target project's domain, navigation, logo, palette, and workflow.
- Project folders saved under `/opt/<project-name>` so they can be opened directly in VS Code.

## System Requirements

Recommended:

- Linux server or VM.
- Node.js 24 or newer.
- npm.
- SQLite support through `better-sqlite3`.
- Git.
- GitHub CLI (`gh`) if you want to publish or manage the repo from the server.

Optional:

- Docker, if your generated target project will use containerized services.
- Cloudflared, if you expose your home-lab app through a tunnel.
- Portainer, if you manage containers through a UI.

## Install

Clone the repository:

```bash
git clone https://github.com/FordKey/openspec-builder.git
cd openspec-builder
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp env.sample .env
```

Build the app:

```bash
npm run build
```

Start it:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

For LAN/home-lab use, bind or reverse-proxy it however you normally expose local services.

## Development

Run the Vite frontend and Hono API together:

```bash
npm run dev
```

Run only the API:

```bash
npm run dev:api
```

Run checks:

```bash
npm run build
npm test
```

## How To Use

1. Open OpenSpec-Builder.
2. Click New.
3. Name the project and describe the mission.
4. Upload a logo if you have one.
5. Choose stack, backend, deployment, style, colors, fonts, icons, and target coding agent.
6. Add the core workflow, data needs, integrations, constraints, and out-of-scope notes.
7. Click Create Artifacts.
8. Review the generated summary and wireframe.
9. Open the generated project folder directly in VS Code.

Generated projects are written to:

```text
/opt/<project-name>
```

Example:

```bash
code /opt/ritefact
```

That generated folder is intentionally structured as the starting folder for the target app. A chat agent can read `AGENTS.md`, `openspec/config.yaml`, `openspec/project.md`, and the active OpenSpec change before writing code.

## Suggested AI Coding Flow

Start the coding session by asking your chat agent to:

1. Read `AGENTS.md`.
2. Read `openspec/config.yaml`.
3. Read `docs/builder-inputs.md`.
4. Read the active change under `openspec/changes/<change-id>/`.
5. Run the AI Sanity Check before coding.
6. Confirm stack, backend, Docker, styling, colors, fonts, icons, data model, integrations, and constraints.
7. Compare the implementation to `docs/wireframe/index.html` after each major screen or workflow.

For larger projects, split the AI prompts into foundation, data/API, core workflows, UI polish, and verification.

## Superpowers

If your coding environment supports Superpowers, install or enable it before implementation. In supported chat-agent setups, use:

```text
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

Then ask the agent to use the OpenSpec artifacts and sanity-check protocol in the generated project folder.

## What Gets Generated

OpenSpec-Builder generates a complete project handoff, not a finished application.

It creates:

- Product requirements in OpenSpec format.
- Proposal, design, tasks, verification, and archive notes.
- A coding-agent instruction file.
- A target app wireframe.
- Logo and brand assets.
- A machine-readable `project.json`.
- A folder layout that can become the real app repository.

It does not guarantee the downstream coding agent will build the app perfectly. The generated artifacts are meant to improve the start of the build, not replace engineering judgment.

## Safety Notes

- Do not commit `.env`.
- Do not commit `data/` or generated SQLite databases.
- Review generated artifacts before sending them to an AI coding agent.
- Start with a small project and inspect what the agent builds.
- Treat generated code plans as a strong draft, not a legal, financial, medical, or security guarantee.

## Project Status

OpenSpec-Builder is beta software. It is useful enough to explore and iterate with, but it needs real-world testing across more project types.

Feedback, issues, and pull requests are welcome.

## Blessing

"May God Bless You on your quest to build useful tools for our human family while on Earth." - FordKey
