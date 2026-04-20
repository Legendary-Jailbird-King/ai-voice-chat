# AI Voice Chat — Project Context

## What is this project?

AI Voice Chat is a real-time voice conversation app powered by AI. Users speak → browser transcribes (STT) → AI responds → browser speaks (TTS). Supports MCP document reading across multiple platforms.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 6 + TypeScript |
| Design | Google Stitch 2.0 (Figma → Code) |
| Backend | Node.js 22 + WebSocket (ws) |
| AI | GLM-5.1 via Anthropic-compatible API |
| Voice | Web Speech API (STT + TTS) |
| MCP | Multi-platform document reader |
| Hosting | GitHub Pages (frontend) + PM2 (backend) |
| CI/CD | GitHub Actions |

## Project Structure

```
ai-voice-chat/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── components/    # VoiceChat, AudioPlayer, Transcript
│   │   ├── hooks/          # useSpeechToText, useTextToSpeech, useWebSocket
│   │   └── styles.css      # Design system CSS
│   └── package.json
├── backend/               # Node.js WebSocket server
│   ├── src/
│   │   ├── index.js        # Entry + WebSocket server
│   │   └── services/
│   │       └── mcp-doc-reader.js
│   └── package.json
├── .claude/               # Claude Code config
│   ├── settings.json       # Project-level settings
│   ├── agents/            # Custom subagents
│   │   ├── architect.json
│   │   └── explorer.json
│   ├── skills/             # Agent skills
│   │   ├── code-review/
│   │   ├── design-agent/
│   │   ├── frontend-dev/
│   │   ├── backend-dev/
│   │   └── product-manager/
│   ├── hooks/              # Pre-commit hooks
│   └── teams/              # Agent team configs
├── .mcp.json              # MCP server config
├── SPEC.md                # Project specification
└── README.md
```

## How to Run

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && node src/index.js
```

## Key Decisions

- **STT**: Browser Web Speech API (free, no API key)
- **TTS**: Browser speechSynthesis (free, no API key)
- **WS**: Direct connection to backend server (111.229.183.250:3001)
- **AI**: GLM-5.1 via Anthropic-compatible endpoint
- **SSL**: Pending — need domain name to configure WSS

## Team (Agent Teams)

6 specialized agents collaborate on this project:

| Agent | Use When |
|-------|---------|
| `/code-review` | Reviewing PRs or code |
| `/frontend-dev` | Building React features |
| `/backend-dev` | Building Node.js features |
| `/design-agent` | UI/UX design decisions |
| `/product-manager` | Planning or tracking work |
| `explorer` subagent | Exploring codebase before changes |

## Important Notes

- Frontend connects to `ws://111.229.183.250:3001` (will be `wss://` after SSL)
- Backend runs on port 3001
- GLM API has rate limits — don't spam requests
- All team-shared config goes in `.claude/` (committed to git)
- Personal overrides go in `.claude/settings.local.json` (gitignored)

## Documentation

- [SPEC.md](SPEC.md) — Full project specification
- [docs/stitch-integration.md](docs/stitch-integration.md) — Google Stitch 2.0 guide
- `.claude/skills/*/SKILL.md` — Individual agent skill docs
