# @savri/mcp

MCP (Model Context Protocol) server for [Savri](https://savri.io) analytics. Access your website analytics data directly in Claude Desktop.

## Features

- View visitor statistics, pageviews, sessions, and bounce rates
- Analyze top pages, referrers, and visitor countries
- Create and manage conversion goals
- Set up multi-step conversion funnels
- Track custom event properties

## Quick Start

### 1. Get your API key

Go to [Savri Dashboard > Settings > API Keys](https://savri.io/settings/api-keys) and create an API key.

### 2. Configure Claude Desktop

Add to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "savri": {
      "command": "npx",
      "args": ["@savri/mcp"],
      "env": {
        "SAVRI_API_KEY": "bk_your_api_key_here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

The Savri tools will now be available.

## Available Tools

| Tool | Description |
|------|-------------|
| `savri_list_sites` | List all your websites with optional 30-day stats |
| `savri_get_stats` | Get visitor statistics with trend comparison |
| `savri_get_pages` | Get most visited pages |
| `savri_get_referrers` | Get traffic sources |
| `savri_get_countries` | Get visitor geography |
| `savri_list_goals` | List conversion goals |
| `savri_create_goal` | Create a pageview or event goal |
| `savri_delete_goal` | Delete a goal |
| `savri_list_funnels` | List conversion funnels |
| `savri_create_funnel` | Create a multi-step funnel |
| `savri_delete_funnel` | Delete a funnel |
| `savri_get_funnel_stats` | Get funnel conversion statistics |
| `savri_list_properties` | List registered event properties |
| `savri_create_property` | Register a new property |
| `savri_delete_property` | Delete a property |

## Example Prompts

Ask Claude things like:

- "Show me my website traffic for the last 30 days"
- "What are the top pages on example.com?"
- "Compare this week's traffic to last week"
- "Where is my traffic coming from?"
- "Create a goal for when users visit /thank-you"
- "Set up a checkout funnel: product -> cart -> checkout -> confirmation"

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SAVRI_API_KEY` | Yes | Your Savri API key (starts with `bk_`) |
| `SAVRI_API_URL` | No | Custom API URL (default: https://savri.io/api/v1) |

## Links

- [Savri Website](https://savri.io)
- [API Documentation](https://savri.io/docs/public-api)
- [MCP Protocol](https://modelcontextprotocol.io)

## License

MIT
