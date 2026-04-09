# Prompt Matrix

This file is a practical prompt set for manually exercising the OmniPro 220 support agent.

It covers:

- all implemented tools
- all implemented artifact renderers
- plain text answers
- streamed tool-state transitions
- the optional SVG image-pass flow

## Visual-First Expectation

This should be treated as a product expectation, not a nice-to-have:

- If a question is complex enough, the agent should generate interactive content.
- If something is too cognitively hard to explain in words, the agent should draw it.
- Real-time diagrams, interactive schematics, visual walkthroughs, and small calculators are preferred over dense walls of prose when they improve comprehension.

Concretely, the agent should strongly prefer interactive or visual outputs for things like:

- a duty cycle calculator
- a troubleshooting flowchart
- a settings configurator that takes `process + material + thickness` and outputs recommended wire speed and voltage
- polarity cable-routing diagrams
- process comparison diagrams
- step-by-step setup walkthroughs

## Important Caveat

The current knowledge base only contains a small set of repo-sourced weld-setting rows extracted from owner-manual screenshots.

That means prompts asking for a true settings configurator are still useful for testing artifact selection and fallback behavior, but the agent should explicitly say when an exact validated row is not available instead of inventing one.

## Minimal Full-Coverage Set

Use these prompts if you want the shortest set that touches nearly every implemented feature:

| Prompt | Expected tool / behavior | Expected output |
|---|---|---|
| `What are the validated MIG specifications on 240V for the OmniPro 220?` | `lookupSpecifications` | Plain text answer |
| `What polarity setup do I need for TIG welding, and which socket gets the ground clamp?` | `getPolaritySetup` | Plain text answer with tool card |
| `What's the duty cycle for MIG welding at 200A on 240V?` | `calculateDutyCycle` | Plain text answer with exact duty-cycle values |
| `I'm getting porosity in my flux-cored welds. What should I check first?` | `getTroubleshooting` | Troubleshooting answer |
| `Show me the TIG setup manual page.` | `getManualPage` | `manual-image` artifact or manual page display |
| `What are the validated weld settings for stick welding mild steel at 1/8 inch?` | `getWeldSettings` | Fallback explaining no exact validated row matches |
| `Create a Mermaid decision tree for diagnosing porosity in flux-cored welds.` | troubleshooting + visual reasoning | `mermaid` artifact |
| `Show me an SVG diagram of the TIG polarity cable routing with the torch on negative and the ground clamp on positive.` | polarity + visual reasoning | `svg` artifact |

## Tool Coverage Prompts

### `lookupSpecifications`

| Prompt | What it should activate |
|---|---|
| `What are the validated MIG specifications on 240V for the OmniPro 220?` | specification lookup |
| `Give me the 120V TIG current range, power input, and duty-cycle table.` | specification lookup |
| `What are the 240V stick specs, including current range and duty-cycle points?` | specification lookup |

### `getPolaritySetup`

| Prompt | What it should activate |
|---|---|
| `What polarity setup do I need for TIG welding, and which socket gets the ground clamp?` | polarity lookup |
| `For flux-cored welding, tell me the correct polarity, socket assignments, and setup steps.` | polarity lookup |
| `Explain the stick welding cable routing and polarity on this machine.` | polarity lookup |

### `calculateDutyCycle`

| Prompt | What it should activate |
|---|---|
| `What's the duty cycle for MIG welding at 200A on 240V?` | exact duty-cycle point |
| `What duty cycle data do you have for MIG at 190A on 240V? Use the nearest validated points only.` | nearest validated points |
| `Give me the TIG duty cycle at 175A on 240V.` | exact duty-cycle point |

### `getTroubleshooting`

| Prompt | What it should activate |
|---|---|
| `I'm getting porosity in my flux-cored welds. What should I check first?` | troubleshooting lookup |
| `My MIG arc is unstable. Give me the likely causes and fixes from the manual.` | troubleshooting lookup |
| `TIG and stick both feel inconsistent. Show me the most relevant troubleshooting guidance.` | troubleshooting lookup |

### `getManualPage`

| Prompt | What it should activate |
|---|---|
| `Show me the TIG setup manual page.` | manual page lookup |
| `Can you show owner manual page 24?` | manual page lookup by page |
| `Show me the manual page for MIG polarity.` | manual page lookup by topic |

### `getWeldSettings`

| Prompt | What it should activate |
|---|---|
| `What are the validated weld settings for stick welding mild steel at 1/8 inch?` | weld settings no-match fallback |
| `Give me weld settings for MIG on steel at 3/16 inch, and tell me clearly if there is no exact validated row.` | weld settings no-match fallback |
| `Build a settings configurator for process, material, and thickness, but do not invent unvalidated wire speed or voltage.` | weld-settings-aware fallback plus interactive intent |

## Artifact Coverage Prompts

### `manual-image`

| Prompt | Expected artifact |
|---|---|
| `Show me the TIG setup manual page as a manual page artifact.` | `manual-image` |
| `Display the MIG polarity manual page and keep the answer brief.` | `manual-image` |

### `svg`

| Prompt | Expected artifact |
|---|---|
| `Show me an SVG diagram of the TIG polarity cable routing with the torch on negative and the ground clamp on positive.` | `svg` |
| `Draw a simple SVG schematic comparing MIG vs flux-cored socket assignments on this machine.` | `svg` |
| `Create a visual walkthrough of the TIG cable routing as a clean SVG schematic.` | `svg` |

### `mermaid`

| Prompt | Expected artifact |
|---|---|
| `Create a Mermaid decision tree for diagnosing porosity in flux-cored welds on the OmniPro 220.` | `mermaid` |
| `Make a Mermaid flowchart for choosing between MIG, flux-cored, TIG, and stick based on my job.` | `mermaid` |
| `Show a Mermaid troubleshooting flow for unstable MIG arc behavior.` | `mermaid` |

### `react`

| Prompt | Expected artifact |
|---|---|
| `Build a small React artifact that compares MIG duty cycle points on 120V vs 240V.` | `react` |
| `Create an interactive React calculator that shows weld time and rest time for the validated MIG duty-cycle points.` | `react` |
| `Make an interactive comparison view for TIG vs stick setup differences on this machine.` | `react` |

## Streaming / Tool-State Prompts

These are useful for watching the chat UI move through queued, input-available, and output-available tool states:

| Prompt | Likely tool |
|---|---|
| `Check the TIG polarity setup for me.` | `getPolaritySetup` |
| `Look up the MIG duty cycle at 200A on 240V.` | `calculateDutyCycle` |
| `Find the troubleshooting steps for porosity in flux-cored welds.` | `getTroubleshooting` |

## Combined End-to-End Prompts

These are the best prompts for realistic manual QA because they combine tool use, reasoning, and often a visual artifact:

| Prompt | Expected mix |
|---|---|
| `What polarity setup do I need for TIG welding, and can you show me the cable layout?` | polarity tool + likely visual |
| `I'm getting porosity in my flux-cored welds. Give me the likely causes, fixes, and a flowchart.` | troubleshooting tool + `mermaid` |
| `Compare MIG on 120V and 240V, including validated duty-cycle points, in a small interactive artifact.` | specification + duty-cycle data + `react` |
| `Show me the TIG setup manual page, then summarize the key socket assignments.` | manual page + text summary |
| `Explain the difference between MIG and flux-cored cable routing, and draw it.` | polarity lookup + visual |

## Visual Stress-Test Prompts

These are especially useful for validating the "draw it when words are not enough" expectation:

| Prompt | What to look for |
|---|---|
| `Build a duty cycle calculator for the validated MIG points on this machine.` | Should prefer interactive `react` over plain text |
| `Create a troubleshooting flowchart for porosity, unstable arc, and polarity mistakes.` | Should prefer `mermaid` or another visual |
| `Make a settings configurator for process, material, and thickness. If the exact values are not validated, show a visual fallback instead of inventing them.` | Should choose interactive output and avoid hallucinated settings |
| `Show a visual walkthrough of TIG setup from socket assignment through shielding gas connection.` | Should produce a diagram or schematic |
| `Draw the difference between MIG and flux-cored cable routing side by side.` | Should produce a visual comparison |

## Optional Image-Pass Prompt

To test the optional polished-image flow in the `svg` renderer:

1. Submit:

   `Show me an SVG diagram of the TIG polarity cable routing.`

2. Then click the SVG artifact button:

   `Generate illustration via Nano Banana`

That exercises the optional image-pass UI layered on top of the SVG artifact path.
