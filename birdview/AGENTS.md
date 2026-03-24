We are implementing the next Birdview phase.

Goal:
Create the foundations for:
1. Workspace
2. Droplet Studio
3. unified command language
4. droplet shadow skill schema
5. dummy-data preview runner

Constraints:
- use the exact naming from AGENTS.md
- do not implement authentication yet
- keep everything company-scoped and vertical-scoped
- do not execute raw authorHintText
- do not add autonomous agents yet

Work in phases.
Start by producing a short implementation plan in docs/PLANS.md.
Then implement phase 1 only:
- route shells
- module folders
- shared schemas folder structure
- command parser stub
- Workspace 3-column shell
- Droplet Studio shell

At the end provide:
- files changed
- routes added
- assumptions
- risks
