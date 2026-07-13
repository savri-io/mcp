# @savri/mcp

MCP (Model Context Protocol) server for Savri analytics. Use your website analytics data directly in Claude Desktop.

## Setup

### 1. Get your API key

Go to [Savri Dashboard > Settings > API](https://besokskollen.se/dashboard/settings/api) and create an API key with `read` scope (add `write` scope if you want to create goals/funnels).

### 2. Configure Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

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

The Savri tools will now be available in Claude.

## Available Tools

| Tool | Description |
|------|-------------|
| `savri_list_sites` | List all your websites |
| `savri_create_site` | Add a new website and get the tracking snippet |
| `savri_rename_site` | Change a site's display name (the domain is immutable) |
| `savri_delete_site` | Permanently delete a site (requires the domain as confirmation) |
| `savri_get_stats` | Get visitor statistics (visitors, pageviews, bounce rate) |
| `savri_get_pages` | Get top pages |
| `savri_get_referrers` | Get traffic sources |
| `savri_get_countries` | Get visitor countries |
| `savri_list_properties` | List registered event properties |
| `savri_create_property` | Register a new event property |
| `savri_delete_property` | Delete an event property |
| `savri_list_goals` | List conversion goals |
| `savri_create_goal` | Create a new goal |
| `savri_delete_goal` | Delete a goal |
| `savri_list_funnels` | List conversion funnels |
| `savri_create_funnel` | Create a new funnel |
| `savri_delete_funnel` | Delete a funnel |
| `savri_get_funnel_stats` | Get funnel conversion statistics |

## Example Usage

Ask Claude things like:

- "Show me my website traffic for the last 30 days"
- "What are the top pages on example.com?"
- "Compare this week's traffic to last week"
- "Where is my traffic coming from?"
- "Create a goal for when users visit /thank-you"
- "Set up a checkout funnel: product page -> cart -> checkout -> confirmation"

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SAVRI_API_KEY` | Yes | Your Savri API key |
| `SAVRI_API_URL` | No | Custom API URL (default: https://besokskollen.se/api/v1) |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
SAVRI_API_KEY=your_key node dist/index.js
```

## Links

- [Savri Dashboard](https://besokskollen.se/dashboard)
- [API Documentation](https://besokskollen.se/docs/public-api)
- [MCP Protocol](https://modelcontextprotocol.io)
