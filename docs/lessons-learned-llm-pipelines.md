# Lessons Learned: Building LLM Pipelines

> Distilled from building and optimizing a Figma → Design System extraction pipeline over multiple iterations (Feb–Mar 2026). These lessons apply broadly to any multi-agent LLM workflow.

---

## 1. Context accumulation is the #1 cost driver

Each tool call resends the full conversation history. A 40-turn agent doesn't cost 40x — it costs ~820x a single call (quadratic growth: `n×(n+1)/2`). **Cutting turns is always the highest-leverage optimization.**

```
Turn 1:  [prompt] → response                    ~3K tokens
Turn 2:  [prompt + turn1] → response             ~6K tokens
Turn 3:  [prompt + turn1 + turn2] → response      ~10K tokens
...
Turn 40: [prompt + ...everything...] → response   ~120K tokens
```

**What we did:** Pre-packaged data into single JSON files so agents read once instead of querying 30-40 times. Collapsed agent turns from 40→5 across most phases.

---

## 2. Push work to the cheapest layer that can handle it

```
Most expensive:  LLM agent with full tools (reads, reasons, writes)
                 ↓ reduce tools → fewer token definitions in context
                 ↓ remove tools entirely → direct API call (input → output)
                 ↓ remove LLM entirely → Python script (deterministic logic)
Cheapest:        Static data (pre-computed, cached)
```

**Model assignment principle:**
| Capability needed | Model | Cost per M (in/out) |
|---|---|---|
| Vision + design judgment | Opus | $15 / $75 |
| Structured generation from data | Sonnet | $3 / $15 |
| Templated/scripted work | Haiku | $0.80 / $4 |
| Deterministic logic | Python | $0 |

**What we did:** Moved icon detection, data bundling, and file operations to Python. Downgraded models per phase. Went from $31 → $5.57 per extraction (82% reduction).

---

## 3. Agents carry a fixed overhead tax that scales with count

Every agent spun up in Claude Code pays ~10-12K tokens for system prompt + tool definitions before doing a single useful thing. This tax is invisible with 1-2 agents but dominates at volume.

| Agent count | Overhead tokens | % of useful work |
|---|---|---|
| 2 | ~24K | Negligible |
| 10 | ~120K | Noticeable |
| 41 | ~500K | Dominant cost |

**What we learned:** Phase 5b (41 screen agents) spent ~500K tokens just on boilerplate tool definitions the agents never called. Moving to direct API calls with no tool definitions would save ~25-30%.

**Rule:** Minimize agent count. Strip tools from agents that don't need them. If an agent needs zero tools, it shouldn't be an agent — it should be a function call.

---

## 4. Pre-package data; don't let agents forage

Early versions had agents making dozens of incremental queries to build up context. Each query was a tool call → context accumulation → quadratic cost growth.

| Phase | Before (foraging) | After (pre-packaged) |
|---|---|---|
| Components | 25 figma-query calls | 1 JSON file read |
| Shells | 51 figma-query calls | 1 JSON file read |
| Screens (each) | 30-43 figma-query calls | 1 JSON file read |
| Screen tokens | 625K+ tokens (incremental) | 30-80KB package |

**The pattern:** Python assembles data → LLM reasons over it → Python writes output. The LLM never touches raw data sources.

---

## 5. Large files are unusable by agents — always provide query tools

The 2.5MB Figma JSON file (~625K tokens) overflowed context windows and was truncated by the Read tool (lines >2000 chars get cut). Agents saw almost nothing useful.

**Fix:** Built `figma-query.py` — a Python CLI that agents call to get focused slices:
- `colors` → ~11KB (vs 2.5MB)
- `text-styles` → ~28KB
- `essentials` → ~5KB table-of-contents

**Rule:** Never hand an agent a large file. Give it a query interface or a pre-filtered extract.

---

## 6. Adding agents to compensate for imprecision creates a complexity death spiral

Early pipeline had LLM verification phases to check previous LLM output: "Did the token agent get the colors right?" These consumed time and tokens but **never fixed anything**. The LLM verifier was no better at judging colors than the LLM extractor.

The real fix was better inputs upstream:
- Fingerprinting fixed color misidentification
- Pre-packaged data eliminated lossy context handoffs
- Visual-first approach (screenshot as primary input) improved layout accuracy

**Rule:** Fix the source of imprecision, don't add watchers. More agents ≠ more accuracy.

---

## 7. Human-in-the-loop beats automated LLM verification

Opening the HTML preview for human review was cheaper and more effective than any LLM sanity-check agent. The LLM couldn't reliably judge its own visual output — but a human spots problems instantly.

**What we removed:** All LLM verification phases.
**What we added:** `open preview/index.html` at the end.

**Rule:** For subjective quality (does this look right?), defer to the human. Reserve LLM verification for objective checks (does this file parse? are all fields present?).

---

## 8. If an agent needs zero tools, make it a direct API call

Many phases follow a simple pattern: read pre-packaged inputs → reason → produce structured output. They don't need Read, Write, Bash, Glob, or any other tool. But as Claude Code agents, they carry the full tool definition overhead anyway.

**The fix:** Call the Claude API directly from a Python script:
- Python loads the inputs (JSON package + screenshot)
- Sends a single `messages.create()` call with zero tools
- Parses the response and writes output files

This eliminates ~10K tokens of tool definitions per agent. Across 41 screen agents, that's ~410K tokens saved.

**The mechanism:** The Anthropic Python SDK or Claude Agent SDK gives you fine-grained control over what goes into each API call. Claude Code's Agent tool doesn't expose this — every subagent inherits the full toolset.

---

## 9. Flattened/preview files degrade gracefully but expensively

The pipeline handles Figma "preview" files (screens rendered as flat images rather than structured component trees). Tokens and colors still extract from the design context, but screen agents do *more* reasoning from screenshots to reconstruct layouts, consuming more tokens.

| File type | Screen agent cost | Quality |
|---|---|---|
| Editable source file | ~25-30K tokens | High (structured data) |
| Flattened preview file | ~35-40K tokens | Medium (visual inference) |

**Rule:** Source file quality directly impacts both extraction cost and accuracy. Always ask for the editable file.

---

## 10. Parallelize independent work, serialize dependent work

The pipeline shape matters as much as individual phase cost:

```
Sequential (must wait):
  connect → fingerprint → tokens → components → shells → screens

Parallel (independent):
  tokens: colors | typography | spacing | effects     (4 parallel)
  phase 4: components | asset download                (2 parallel)
  phase 5b: screen1 | screen2 | ... | screen41       (41 parallel)
```

Parallelism cut wall-clock time from ~40 minutes (sequential) to ~8 minutes. But phases that depend on previous outputs must remain sequential — fingerprint needs screenshots, tokens need the fingerprint, screens need shells.

**Rule:** Map dependencies first, then parallelize everything that's independent.

---

## Summary: The Optimization Ladder

Each rung removes a layer of overhead:

| Step | What changes | Token savings |
|---|---|---|
| 1. Reduce turns | Pre-package data so agents read once | 80-90% per agent |
| 2. Downgrade models | Use cheapest model that can do the job | 50-90% per agent |
| 3. Eliminate agents | Move deterministic work to Python | 100% for that phase |
| 4. Strip tools | Direct API calls without tool definitions | ~25-30% per agent |
| 5. Remove LLM entirely | Template-based generation in Python | 100% for that phase |

The order matters — each step has diminishing returns, so start at the top.

---

## Project-Specific Numbers

| Metric | Initial | After optimization | Reduction |
|---|---|---|---|
| Cost per extraction | $31 | $5.57 | 82% |
| Total tokens (7 screens) | 1.1M+ | ~200K | 82% |
| Tool calls | 441 | ~80 | 82% |
| Agent turns (screen) | 30-43 | 5 | 88% |
| Orchestrator context | 100K+ | ~10K | 90% |

*With the direct-API optimization (step 4), estimated further reduction of 25-30% on the 41-screen extraction that cost 1.88M tokens.*

---

## 11. Subscription vs. API: know which meter you're on

Optimizations 3 and 4 (strip tools, direct API calls) reduce token count — but they move work from your **subscription** (flat rate, unlimited within usage) to **API billing** (pay per token). If you're running agents via Claude Code under a Pro/Team subscription, those tokens are "free" at the margin. Moving the same work to direct API calls means paying $3-15 per million tokens.

**The tradeoff:**
| Approach | Token efficiency | Cost model |
|---|---|---|
| Claude Code Agent (subscription) | Lower (tool overhead) | Flat rate — already paid |
| Direct API call (no tools) | Higher (~25% fewer tokens) | Per-token — real dollars |

**Rule:** Optimize for tokens when you're paying per-token (API). Optimize for wall-clock time and quality when you're on a subscription. The "cheapest" approach depends on which meter you're watching.

---

## Related Documents

- [Cost Reduction Plan](./cost-reduction-by-minimizing-turns.md) — detailed implementation of steps 1-3
- [Future Improvements](./future-extraction-improvements.md) — what changes with professional Figma files
