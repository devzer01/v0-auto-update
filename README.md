# v0-update

CLI for the [v0.dev](https://v0.dev) Platform and Model APIs.

Manage projects, chats, deployments, generate code, and automate PR workflows — all from your terminal.

## Installation

```bash
npm install -g v0-update
```

Or run directly with npx:

```bash
npx v0-update --help
```

## Setup

Set your v0 API key:

```bash
export V0_API_KEY=your_api_key_here
```

Get your API key from [v0.dev](https://v0.dev).

## Commands

### Projects

```bash
v0 projects list              # List all projects
v0 projects create <name>     # Create a new project
v0 projects get <id>          # Get project details
v0 projects update <id> --name <name>  # Update a project
v0 projects delete <id>       # Delete a project
```

### Chats

```bash
v0 chats create -m "Build a login page"        # Create a chat with a prompt
v0 chats init -f src/app.tsx src/index.css      # Init chat with existing files
v0 chats init-repo -r https://github.com/user/repo  # Init from a GitHub repo
v0 chats messages <chatId>                      # View chat messages
v0 chats send <chatId> -m "Add dark mode"       # Send a follow-up message
v0 chats apply <chatId>                         # Download & write files locally
```

### PR Workflow

Automate the full cycle: prompt v0, apply generated code, create & merge a PR.

```bash
v0 pr -p <projectId> -m "Add a responsive navbar"
v0 pr -p <projectId> -m "Fix the footer" --no-merge  # Create PR without merging
v0 pr -p <projectId> -m "Update styles" --branch my-branch --base main
```

### Deployments

```bash
v0 deploy create --project <id> --chat <chatId> --version <versionId>
```

### Generate (Model API)

```bash
v0 generate -m "Write a React hook for local storage"
v0 generate -m "Explain this code" --model v0-1.5-md --stream
```

### Interactive Chat

```bash
v0 chat
v0 chat --model v0-1.5-md --system "You are a helpful coding assistant"
```

## GitHub Actions

This package includes a GitHub Actions workflow (`scripts/v0-apply.js`) for automating v0 code generation in CI. See `.github/workflows/v0-update.yml` for an example.

## Options

All list/detail commands support `--json` for raw JSON output.

## License

MIT
