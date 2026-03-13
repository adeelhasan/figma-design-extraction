# Cost Reduction Plan: Figma Extraction Pipeline

## Context

The extraction pipeline currently costs ~$31 per run, with Opus agents consuming 1.1M+ tokens across 441 tool calls. The #1 cost driver is **context accumulation** — each tool call resends the full conversation history, so a 40-turn agent costs exponentially more than a 5-turn agent. The strategy: move deterministic work to Python scripts, pre-package data so agents need fewer turns, and downgrade models where Opus-level reasoning isn't needed.

**Target:** ~$5-7 per extraction (75-80% reduction)
**Constraint:** Opus only for fingerprinting (Phase 2). HTML preview quality tuning is out of scope.

## Why Turns Are the #1 Cost Driver

```
Turn 1:  [prompt] → response                    ~3K tokens
Turn 2:  [prompt + turn1] → response             ~6K tokens
Turn 3:  [prompt + turn1 + turn2] → response      ~10K tokens
...
Turn 40: [prompt + ...everything...] → response   ~120K tokens
```

A 40-turn agent doesn't cost 40× a single call — it costs roughly `40 × 41 / 2 = 820` units because each turn re-sends everything before it. Cutting from 40 turns to 5 turns reduces this from 820 to 15 units — a **98% reduction** in token volume.

## Cost Summary

| Phase | Current | After | Change |
|-------|---------|-------|--------|
| 1 Connect | Opus $1.50 | Haiku $0.01 | Model downgrade (pure script execution) |
| 2 Fingerprint | Opus $2.50 | Opus $2.50 | Keep (needs vision + design judgment) |
| 3 Tokens ×4 | Haiku $0.32 | Haiku $0.25 | No change |
| 4a Components | Opus $4.00 | Sonnet $0.25 | Pre-packaged data + model downgrade |
| 4b Icons/Assets | Opus $6.00 | Haiku $0.01 | Python replaces LLM entirely |
| 5a Shells | Opus $5.00 | Sonnet $0.20 | Pre-packaged data + model downgrade |
| 5b Screens ×7 | Opus $12.00 | Sonnet $2.10 | Visual-first + pre-packaged data |
| 6/6b Index+Ref | Haiku $0.32 | Haiku $0.25 | No change |
| **Total** | **~$31** | **~$5.57** | **~82% reduction** |

## Three Pillars of Reduction

### 1. Reduce Agent Turns (biggest impact)

Pre-compute data into single JSON packages so agents read once instead of querying incrementally.

| Phase | Before (turns) | After (turns) | How |
|-------|---------------|--------------|-----|
| 4a Components | 25 | 3 | `prepare-components.py` bundles all subtrees |
| 4b Icons/Assets | 34 | 2 | `prepare-icons-assets.py` replaces LLM entirely |
| 5a Shells | 51 | 5 | `prepare-shells.py` bundles detection + Figma data |
| 5b Screens ×7 | 30-43 each | 5 each | `prepare-screen.py` bundles per-screen data |

### 2. Model Downgrades

| Agent | Current | New | Rationale |
|-------|---------|-----|-----------|
| Connect | Opus ($15/$75 per M) | Haiku ($0.80/$4) | Just runs Python scripts |
| Fingerprint | Opus | Opus | Needs vision + design judgment |
| Components | Opus | Sonnet ($3/$15) | Structured extraction from pre-built data |
| Icons/Assets | Opus | Haiku | Python does all work, agent just downloads |
| Shells | Opus | Sonnet | HTML generation from pre-built data |
| Screens ×7 | Opus | Sonnet | Visual-first from pre-built packages |

### 3. Python Pre-computation (Deterministic → Scripts)

Principle: **Opus = design judgment, Sonnet = structured generation, Haiku = templated fill, Python = everything deterministic.**

4 new Python scripts move deterministic work out of LLM agents:

| Script | Replaces | Savings |
|--------|----------|---------|
| `prepare-icons-assets.py` | Entire icons/assets agent | $6.00 → $0.01 |
| `prepare-components.py` | 22 figma-query calls | 25 → 3 turns |
| `prepare-shells.py` | Vision detection + Figma mapping | 51 → 5 turns |
| `prepare-screen.py` | Per-screen data assembly | 30-43 → 5 turns |

## New Pipeline

```
Pre-Flight: python3 init-extraction.py
Phase 1:    Connect (Haiku, ~3 turns)
Phase 2:    Fingerprint (Opus, ~15 turns)
Phase 3:    Tokens ×4 (Haiku, ~5 turns each)
            ↓ python3 prepare-components.py
            ↓ python3 prepare-icons-assets.py  ← replaces LLM agent
Phase 4a:   Components (Sonnet, ~3 turns)
Phase 4b:   Asset download (Haiku, ~2 turns)   ← just runs export-images.py
            ↓ python3 prepare-shells.py
Phase 5a:   Shell HTML (Sonnet, ~5 turns)
            ↓ python3 prepare-screen.py ×N
Phase 5b:   Screens ×N (Sonnet visual-first, ~5 turns each)
Phase 6:    Index + Reference (Haiku)
Phase 7:    python3 file-ops.py
```

## Implementation Waves

### Wave 1: Model downgrades (no code changes)
- Change model parameters in `extract-design.md` orchestrator
- Risk: Low. Same prompts, cheaper models.

### Wave 2: `prepare-icons-assets.py` — replaces $6 agent
- Port icon detection rules (name patterns, size heuristics, Lucide mapping) into Python
- Port asset classification rules (avatar/photo/logo/banner) into Python
- Produces both manifests directly; Haiku agent just downloads images

### Wave 3: `prepare-components.py` — reduces 25→3 turns
- Pre-extract all component subtrees into one JSON package
- Reuse `figma-query.py` functions internally
- Simplify `extract-components.md` to read-one-file-write-one-file

### Wave 4: `prepare-shells.py` — reduces 51→5 turns
- Integrate `detect-layout-shells.py` output with Figma section mapping
- Bundle everything the shell agent needs into one package
- Agent only generates HTML fragments + writes JSON

### Wave 5: `prepare-screen.py` + visual-first — reduces 30-43→5 turns per screen
- Build complete per-screen data package (sections, shells, tokens, assets)
- Rewrite `extract-screen.md` for visual-first approach
- Agent sees screenshot + pre-built package → generates all 4 outputs

## Files Created

| File | Purpose |
|------|---------|
| `scripts/prepare-icons-assets.py` | Replaces icons/assets LLM agent |
| `scripts/prepare-components.py` | Pre-packages component data |
| `scripts/prepare-shells.py` | Pre-packages shell detection + Figma data |
| `scripts/prepare-screen.py` | Pre-packages per-screen data for visual-first |

## Files Modified

| File | Change |
|------|--------|
| `.claude/commands/extract-design.md` | New pipeline, model params, inline Python steps |
| `.claude/skills/figma-extraction/prompts/extract-screen.md` | Visual-first rewrite |
| `.claude/skills/figma-extraction/prompts/extract-shells.md` | Simplified (reads package) |
| `.claude/skills/figma-extraction/prompts/extract-components.md` | Simplified (reads package) |
| `.claude/skills/figma-extraction/prompts/extract-assets.md` | Minimal (just download step) |
| `.claude/skills/figma-extraction/scripts/init-extraction.py` | Add new subdirs |

## Verification

After each wave, run a full extraction and compare output quality:
1. **Wave 1:** Diff output against current extraction
2. **Wave 2:** Compare manifests against LLM-generated versions
3. **Wave 3:** Compare `specs/components.md`
4. **Wave 4:** Compare `layout-shells.json` and shell HTML
5. **Wave 5:** Side-by-side screen output comparison

End-to-end: `/extract-design <same-url>` and visually compare preview dashboard.
