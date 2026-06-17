# Generating Agent Config for Sui Projects

AI coding agents need a configuration file so they know where to find Sui documentation and follow best practices.

## When to Generate

- User explicitly asks for agent config / CLAUDE.md / AGENT.md
- Setting up a new Sui project that has no CLAUDE.md or AGENT.md
- Working on an existing Sui project missing agent configuration

## Instructions

Generate a `CLAUDE.md` file (or `AGENT.md` if requested) in the project root. Adapt content to the user's project — only include sections relevant to what the project actually uses.

### Required Sections

#### 1. Sui Development Skills

```markdown
## Sui Development Skills

Install community-maintained skills for Sui development:

```sh
npx skills https://github.com/MystenLabs/skills
```
```

#### 2. Sui SDK Reference (include when project has TypeScript/JavaScript)

```markdown
## Sui SDK Reference

Every `@mysten/*` package ships LLM documentation in its `docs/` directory. When working with
these packages, find the relevant docs by looking for `docs/llms-index.md` files inside
`node_modules/@mysten/*/`. Read the index first to find the page you need, then read that page
for details.
```

#### 3. Official Resources

```markdown
## Official Resources

When unsure about Move patterns or Sui APIs, consult these sources. Do not guess or
extrapolate from other blockchains.

- Move Book: https://move-book.com (use https://move-book.com/llms.txt)
- Sui Docs: https://docs.sui.io (use https://docs.sui.io/llms.txt)
- Sui Move examples: https://github.com/MystenLabs/sui/tree/main/examples/move
```

### Optional Sections

#### Project Structure

```markdown
## Project Structure

- `move/` — Move smart contracts
- `ui/` — Frontend application
```

Adapt to actual project structure.

#### Project-Specific Rules

If the user mentions conventions or constraints:

```markdown
## Project Rules

- [project-specific conventions]
```

## Complete Example

For a typical full-stack Sui project:

```markdown
# Project Name

## Sui Development Skills

Install community-maintained skills for Sui development:

```sh
npx skills https://github.com/MystenLabs/skills
```

## Sui SDK Reference

Every `@mysten/*` package ships LLM documentation in its `docs/` directory. When working with
these packages, find the relevant docs by looking for `docs/llms-index.md` files inside
`node_modules/@mysten/*/`. Read the index first to find the page you need, then read that page
for details.

## Official Resources

When unsure about Move patterns or Sui APIs, consult these sources. Do not guess or
extrapolate from other blockchains.

- Move Book: https://move-book.com (use https://move-book.com/llms.txt)
- Sui Docs: https://docs.sui.io (use https://docs.sui.io/llms.txt)
- Sui Move examples: https://github.com/MystenLabs/sui/tree/main/examples/move

## Project Structure

- `move/` — Move smart contracts
- `ui/` — Frontend application (Next.js)

## MCP Server

When available in your environment, query the Sui documentation MCP server
(`https://sui.mcp.kapa.ai`) for up-to-date answers. Use it for verification
and for details not covered by these reference files.
```

## Rules

- Place file in project root directory
- Default filename is `CLAUDE.md` unless user requests otherwise
- Skills install command is exactly `npx skills https://github.com/MystenLabs/skills` — do not modify
- SDK docs path is `node_modules/@mysten/*/docs/` — do not modify
- Only include SDK Reference section if project uses `@mysten/*` npm packages
- Keep file concise — agents work better with short, direct instructions
- Do not duplicate guidance that installed skills already provide
