# Figma Extraction Configuration

## Setting Up Your Figma Access Token

The extraction skill needs a Figma Personal Access Token to fetch design data from your Figma files.

### Token Lookup Order

The skill checks these locations in order:

1. **Environment variable** `FIGMA_ACCESS_TOKEN`
2. **Project `.env.local`** file (in project root)
3. **Skill config** `.claude/skills/figma-extraction/config/credentials.json`

Use whichever method works best for your workflow.

---

## Option 1: Environment Variable (Recommended for CI/CD)

```bash
export FIGMA_ACCESS_TOKEN="figd_your_token_here"
```

Or add to your shell profile (`~/.zshrc`, `~/.bashrc`):
```bash
export FIGMA_ACCESS_TOKEN="figd_your_token_here"
```

---

## Option 2: Project .env.local (Recommended for Local Development)

Create `.env.local` in your project root:

```bash
FIGMA_ACCESS_TOKEN=figd_your_token_here
```

This file should be in `.gitignore` (it usually is by default).

---

## Option 3: Skill Config File (For Shared/Team Setup)

Copy the example file and add your token:

```bash
cp config/credentials.example.json config/credentials.json
```

Then edit `credentials.json`:
```json
{
  "figma": {
    "accessToken": "figd_your_token_here"
  }
}
```

**Important:** Add `credentials.json` to `.gitignore`:
```
.claude/skills/figma-extraction/config/credentials.json
```

---

## Getting a Figma Personal Access Token

1. Log in to [Figma](https://www.figma.com)
2. Go to **Settings** > **Account** > **Personal access tokens**
3. Click **Generate new token**
4. Give it a descriptive name (e.g., "Design System Extraction")
5. Copy the token (starts with `figd_`)

**Token Permissions Required:**
- File read access to the files you want to extract from

---

## Troubleshooting

### "401 Unauthorized"
- Token is invalid or expired
- Generate a new token in Figma settings

### "403 Forbidden"
- Token doesn't have access to the file
- Make sure the Figma file is shared with your account

### "Token not found"
- Check that the token is in one of the lookup locations above
- Verify the variable name is exactly `FIGMA_ACCESS_TOKEN`
