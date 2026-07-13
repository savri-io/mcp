/**
 * @savri/mcp - MCP server for Savri analytics
 *
 * Provides tools for accessing your analytics data from Claude Desktop
 * and other MCP-compatible clients.
 *
 * Setup in Claude Desktop:
 * {
 *   "mcpServers": {
 *     "savri": {
 *       "command": "npx",
 *       "args": ["@savri/mcp"],
 *       "env": {
 *         "SAVRI_API_KEY": "bk_your_api_key_here"
 *       }
 *     }
 *   }
 * }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Configuration
const API_KEY = process.env.SAVRI_API_KEY;
const BASE_URL = process.env.SAVRI_API_URL || "https://savri.io/api/v1";

// API client helper
async function apiRequest<T>(
  endpoint: string,
  options: { method?: string; body?: unknown; params?: Record<string, string> } = {}
): Promise<T> {
  if (!API_KEY) {
    throw new Error(
      "SAVRI_API_KEY environment variable is required. " +
      "Get your API key at https://savri.io/settings/api-keys"
    );
  }

  const url = new URL(`${BASE_URL}${endpoint}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`API Error (${response.status}): ${error.error || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// Format helpers
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change}%`;
}

// Create MCP server
const server = new McpServer({
  name: "savri",
  version: "0.2.0",
});

// ============================================================================
// TOOL: savri_list_sites
// ============================================================================
server.registerTool(
  "savri_list_sites",
  {
    title: "List Sites",
    description:
      "List all websites you have access to in Savri. " +
      "Use include_stats=true to get visitor/pageview counts for the last 30 days.",
    inputSchema: {
      include_stats: z.boolean().optional().describe("Include 30-day stats summary"),
    },
  },
  async ({ include_stats }) => {
    const result = await apiRequest<{
      data: Array<{
        id: string;
        name: string;
        domain: string;
        verified: boolean;
        has_data: boolean;
        group: { name: string; emoji: string | null } | null;
        stats_30d?: { visitors: number; pageviews: number };
      }>;
      meta: { total: number };
    }>("/sites", {
      params: { include_stats: include_stats ? "true" : "false" },
    });

    if (result.data.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No sites found. Add a site at https://savri.io/sites",
          },
        ],
      };
    }

    const lines = result.data.map((site) => {
      const status = site.verified ? "✓" : "○";
      const group = site.group ? `[${site.group.emoji || ""}${site.group.name}] ` : "";
      const stats = site.stats_30d
        ? ` - ${formatNumber(site.stats_30d.visitors)} visitors, ${formatNumber(site.stats_30d.pageviews)} pageviews (30d)`
        : "";
      return `${status} ${group}${site.name} (${site.domain})${stats}\n  ID: ${site.id}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `Found ${result.meta.total} site(s):\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ============================================================================
// TOOL: savri_create_site
// ============================================================================
server.registerTool(
  "savri_create_site",
  {
    title: "Create Site",
    description:
      "Add a new website to Savri. Returns the site ID and the tracking snippet " +
      "to add to the site. The domain cannot be changed afterwards.",
    inputSchema: {
      domain: z.string().describe("Domain name (e.g., 'example.com')"),
      name: z.string().optional().describe("Display name (default: the domain)"),
    },
  },
  async ({ domain, name }) => {
    const result = await apiRequest<{
      success: boolean;
      data: {
        id: string;
        domain: string;
        name: string;
        verified: boolean;
        has_data: boolean;
        tracking_snippet: string;
      };
    }>("/sites", {
      method: "POST",
      body: { domain, name },
    });

    const s = result.data;
    return {
      content: [
        {
          type: "text",
          text:
            `✅ Site created successfully!\n\n` +
            `Name: ${s.name}\nDomain: ${s.domain}\nID: ${s.id}\n\n` +
            `Tracking snippet (add to the site's <head>):\n${s.tracking_snippet}`,
        },
      ],
    };
  }
);

// ============================================================================
// TOOL: savri_rename_site
// ============================================================================
server.registerTool(
  "savri_rename_site",
  {
    title: "Rename Site",
    description:
      "Change the display name of a website. Only the name can be changed - " +
      "the domain is immutable (create a new site for a new domain).",
    inputSchema: {
      site_id: z.string().describe("Site ID (get from savri_list_sites)"),
      name: z.string().describe("New display name"),
    },
  },
  async ({ site_id, name }) => {
    const result = await apiRequest<{
      success: boolean;
      data: { id: string; domain: string; name: string };
    }>(`/sites/${site_id}`, {
      method: "PATCH",
      body: { name },
    });

    const s = result.data;
    return {
      content: [
        {
          type: "text",
          text: `✅ Site renamed successfully!\n\nName: ${s.name}\nDomain: ${s.domain}\nID: ${s.id}`,
        },
      ],
    };
  }
);

// ============================================================================
// TOOL: savri_delete_site
// ============================================================================
server.registerTool(
  "savri_delete_site",
  {
    title: "Delete Site",
    description:
      "Permanently delete a website and ALL its analytics data. This cannot be undone. " +
      "Requires the site's exact domain as confirmation.",
    inputSchema: {
      site_id: z.string().describe("Site ID (get from savri_list_sites)"),
      confirm_domain: z
        .string()
        .describe("The site's exact domain, as confirmation that the right site is being deleted"),
    },
  },
  async ({ site_id, confirm_domain }) => {
    const result = await apiRequest<{
      success: boolean;
      data: { id: string; domain: string; name: string; deleted: boolean };
    }>(`/sites/${site_id}`, {
      method: "DELETE",
      params: { confirm: confirm_domain },
    });

    const s = result.data;
    return {
      content: [
        {
          type: "text",
          text: `✅ Site "${s.name}" (${s.domain}) and all its data were permanently deleted.`,
        },
      ],
    };
  }
);

// ============================================================================
// TOOL: savri_get_stats
// ============================================================================
server.registerTool(
  "savri_get_stats",
  {
    title: "Get Stats Overview",
    description:
      "Get visitor statistics for a website. " +
      "Returns visitors, pageviews, sessions, bounce rate, and daily breakdown. " +
      "Use compare=true to see changes vs previous period.",
    inputSchema: {
      site_id: z.string().describe("Site ID (get from savri_list_sites)"),
      period: z.enum(["7d", "30d", "90d"]).optional().describe("Time period (default: 30d)"),
      compare: z.boolean().optional().describe("Compare with previous period"),
    },
  },
  async ({ site_id, period, compare }) => {
    const result = await apiRequest<{
      data: {
        period: { from: string; to: string };
        visitors: number;
        pageviews: number;
        sessions: number;
        bounce_rate: number;
        pages_per_session: number;
        comparison?: {
          period: { from: string; to: string };
          visitors: { value: number; change: number };
          pageviews: { value: number; change: number };
          sessions: { value: number; change: number };
          bounce_rate: { value: number; change: number };
        };
        daily: Array<{ date: string; visitors: number; pageviews: number }>;
      };
    }>("/stats/overview", {
      params: {
        site_id,
        period: period || "30d",
        compare: compare ? "true" : "false",
      },
    });

    const d = result.data;
    let text = `📊 Stats for ${d.period.from} to ${d.period.to}\n\n`;

    if (d.comparison) {
      text += `Visitors:     ${formatNumber(d.visitors)} (${formatChange(d.comparison.visitors.change)})\n`;
      text += `Pageviews:    ${formatNumber(d.pageviews)} (${formatChange(d.comparison.pageviews.change)})\n`;
      text += `Sessions:     ${formatNumber(d.sessions)} (${formatChange(d.comparison.sessions.change)})\n`;
      text += `Bounce Rate:  ${d.bounce_rate}% (${formatChange(d.comparison.bounce_rate.change)})\n`;
    } else {
      text += `Visitors:     ${formatNumber(d.visitors)}\n`;
      text += `Pageviews:    ${formatNumber(d.pageviews)}\n`;
      text += `Sessions:     ${formatNumber(d.sessions)}\n`;
      text += `Bounce Rate:  ${d.bounce_rate}%\n`;
    }
    text += `Pages/Session: ${d.pages_per_session}\n`;

    // Show daily trend (simplified sparkline)
    if (d.daily.length > 0) {
      const maxVisitors = Math.max(...d.daily.map((day) => day.visitors));
      const bars = d.daily.slice(-14).map((day) => {
        const height = maxVisitors > 0 ? Math.round((day.visitors / maxVisitors) * 8) : 0;
        return "▁▂▃▄▅▆▇█"[height] || "▁";
      });
      text += `\nTrend (14d): ${bars.join("")}`;
    }

    return { content: [{ type: "text", text }] };
  }
);

// ============================================================================
// TOOL: savri_get_pages
// ============================================================================
server.registerTool(
  "savri_get_pages",
  {
    title: "Get Top Pages",
    description: "Get the most visited pages on a website.",
    inputSchema: {
      site_id: z.string().describe("Site ID"),
      period: z.enum(["7d", "30d", "90d"]).optional().describe("Time period (default: 30d)"),
      limit: z.number().optional().describe("Number of pages to return (default: 10)"),
    },
  },
  async ({ site_id, period, limit }) => {
    const result = await apiRequest<{
      data: Array<{
        pathname: string;
        visitors: number;
        pageviews: number;
      }>;
    }>("/stats/pages", {
      params: {
        site_id,
        period: period || "30d",
        limit: String(limit || 10),
      },
    });

    if (result.data.length === 0) {
      return { content: [{ type: "text", text: "No page data available for this period." }] };
    }

    const lines = result.data.map(
      (page, i) =>
        `${i + 1}. ${page.pathname}\n   ${formatNumber(page.visitors)} visitors, ${formatNumber(page.pageviews)} pageviews`
    );

    return {
      content: [{ type: "text", text: `📄 Top Pages:\n\n${lines.join("\n\n")}` }],
    };
  }
);

// ============================================================================
// TOOL: savri_get_referrers
// ============================================================================
server.registerTool(
  "savri_get_referrers",
  {
    title: "Get Top Referrers",
    description: "Get traffic sources - where your visitors are coming from.",
    inputSchema: {
      site_id: z.string().describe("Site ID"),
      period: z.enum(["7d", "30d", "90d"]).optional().describe("Time period (default: 30d)"),
      limit: z.number().optional().describe("Number of referrers to return (default: 10)"),
    },
  },
  async ({ site_id, period, limit }) => {
    const result = await apiRequest<{
      data: Array<{
        source: string;
        visitors: number;
      }>;
    }>("/stats/referrers", {
      params: {
        site_id,
        period: period || "30d",
        limit: String(limit || 10),
      },
    });

    if (result.data.length === 0) {
      return { content: [{ type: "text", text: "No referrer data available for this period." }] };
    }

    const lines = result.data.map(
      (ref, i) => `${i + 1}. ${ref.source || "(direct)"} - ${formatNumber(ref.visitors)} visitors`
    );

    return {
      content: [{ type: "text", text: `🔗 Top Referrers:\n\n${lines.join("\n")}` }],
    };
  }
);

// ============================================================================
// TOOL: savri_get_countries
// ============================================================================
server.registerTool(
  "savri_get_countries",
  {
    title: "Get Visitor Countries",
    description: "Get geographic distribution of your visitors.",
    inputSchema: {
      site_id: z.string().describe("Site ID"),
      period: z.enum(["7d", "30d", "90d"]).optional().describe("Time period (default: 30d)"),
      limit: z.number().optional().describe("Number of countries to return (default: 10)"),
    },
  },
  async ({ site_id, period, limit }) => {
    const result = await apiRequest<{
      data: Array<{
        country: string;
        country_code: string;
        visitors: number;
      }>;
    }>("/stats/countries", {
      params: {
        site_id,
        period: period || "30d",
        limit: String(limit || 10),
      },
    });

    if (result.data.length === 0) {
      return { content: [{ type: "text", text: "No country data available for this period." }] };
    }

    const lines = result.data.map(
      (c, i) => `${i + 1}. ${c.country || c.country_code} - ${formatNumber(c.visitors)} visitors`
    );

    return {
      content: [{ type: "text", text: `🌍 Visitor Countries:\n\n${lines.join("\n")}` }],
    };
  }
);

// ============================================================================
// TOOL: savri_list_properties
// ============================================================================
server.registerTool(
  "savri_list_properties",
  {
    title: "List Event Properties",
    description:
      "List registered event properties for a website. " +
      "Properties must be registered before they can be tracked in events.",
    inputSchema: {
      site_id: z.string().describe("Site ID"),
    },
  },
  async ({ site_id }) => {
    const result = await apiRequest<{
      data: Array<{
        id: number;
        name: string;
        created_at: string | null;
        unique_values: number;
      }>;
      meta: { total: number };
    }>("/properties", {
      params: { site_id },
    });

    if (result.data.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No properties registered. Create one with savri_create_property.",
          },
        ],
      };
    }

    const lines = result.data.map(
      (prop) =>
        `• ${prop.name}\n  ${formatNumber(prop.unique_values)} unique values\n  ID: ${prop.id}`
    );

    return {
      content: [
        {
          type: "text",
          text: `🏷️ Event Properties (${result.meta.total}):\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ============================================================================
// TOOL: savri_create_property
// ============================================================================
server.registerTool(
  "savri_create_property",
  {
    title: "Create Event Property",
    description:
      "Register a new event property for tracking. " +
      "Properties must be registered before they can be included in events. " +
      "Names must be lowercase, start with a letter, and contain only letters, numbers, underscores, and hyphens.",
    inputSchema: {
      site_id: z.string().describe("Site ID"),
      name: z
        .string()
        .describe("Property name (e.g., 'product_id', 'category_slug', 'price')"),
    },
  },
  async ({ site_id, name }) => {
    // Validate name format
    if (!/^[a-z][a-z0-9_-]*$/.test(name)) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Property name must start with a letter and contain only lowercase letters, numbers, underscores, and hyphens",
          },
        ],
      };
    }

    const result = await apiRequest<{
      success: boolean;
      data: {
        id: number;
        name: string;
        created_at: string | null;
      };
    }>("/properties", {
      method: "POST",
      body: { site_id, name },
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ Property created successfully!\n\nName: ${result.data.name}\nID: ${result.data.id}\n\nYou can now include this property in your events.`,
        },
      ],
    };
  }
);

// ============================================================================
// TOOL: savri_delete_property
// ============================================================================
server.registerTool(
  "savri_delete_property",
  {
    title: "Delete Event Property",
    description:
      "Delete an event property. This will also remove all stored values for this property.",
    inputSchema: {
      site_id: z.string().describe("Site ID"),
      name: z.string().describe("Property name to delete"),
    },
  },
  async ({ site_id, name }) => {
    await apiRequest<{ success: boolean }>("/properties", {
      method: "DELETE",
      params: { site_id, name },
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ Property "${name}" deleted successfully.`,
        },
      ],
    };
  }
);

// ============================================================================
// TOOL: savri_list_goals
// ============================================================================
server.registerTool(
  "savri_list_goals",
  {
    title: "List Goals",
    description: "List conversion goals and their completion counts for a website.",
    inputSchema: {
      site_id: z.string().describe("Site ID"),
      period: z.enum(["7d", "30d", "90d"]).optional().describe("Time period (default: 30d)"),
    },
  },
  async ({ site_id, period }) => {
    const result = await apiRequest<{
      data: Array<{
        id: string;
        name: string;
        event_type: string;
        match_path: string | null;
        match_event: string | null;
        conversions: number;
      }>;
      meta: { period: { from: string; to: string }; total: number };
    }>("/goals", {
      params: { site_id, period: period || "30d" },
    });

    if (result.data.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No goals configured. Create one with savri_create_goal.",
          },
        ],
      };
    }

    const lines = result.data.map((goal) => {
      const type = goal.event_type === "pageview" ? `📄 ${goal.match_path}` : `⚡ ${goal.match_event}`;
      return `${goal.name}\n  ${type}\n  ${formatNumber(goal.conversions)} conversions\n  ID: ${goal.id}`;
    });

    return {
      content: [
        {
          type: "text",
          text: `🎯 Goals (${result.meta.period.from} to ${result.meta.period.to}):\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ============================================================================
// TOOL: savri_create_goal
// ============================================================================
server.registerTool(
  "savri_create_goal",
  {
    title: "Create Goal",
    description:
      "Create a new conversion goal. " +
      "Pageview goals track when users visit specific URLs. " +
      "Event goals track custom events sent from your site.",
    inputSchema: {
      site_id: z.string().describe("Site ID"),
      name: z.string().describe("Goal name (e.g., 'Newsletter Signup')"),
      event_type: z.enum(["pageview", "event"]).describe("Type of goal"),
      match_path: z
        .string()
        .optional()
        .describe("URL path to match for pageview goals (e.g., '/thank-you')"),
      match_event: z
        .string()
        .optional()
        .describe("Event name to match for event goals (e.g., 'signup_complete')"),
    },
  },
  async ({ site_id, name, event_type, match_path, match_event }) => {
    // Validate input
    if (event_type === "pageview" && !match_path) {
      return {
        content: [{ type: "text", text: "Error: match_path is required for pageview goals" }],
      };
    }
    if (event_type === "event" && !match_event) {
      return {
        content: [{ type: "text", text: "Error: match_event is required for event goals" }],
      };
    }

    const result = await apiRequest<{
      success: boolean;
      data: {
        id: string;
        name: string;
        event_type: string;
        match_path: string | null;
        match_event: string | null;
      };
    }>("/goals", {
      method: "POST",
      body: { site_id, name, event_type, match_path, match_event },
    });

    const g = result.data;
    const matchInfo = g.event_type === "pageview" ? `Path: ${g.match_path}` : `Event: ${g.match_event}`;

    return {
      content: [
        {
          type: "text",
          text: `✅ Goal created successfully!\n\nName: ${g.name}\nType: ${g.event_type}\n${matchInfo}\nID: ${g.id}`,
        },
      ],
    };
  }
);

// ============================================================================
// TOOL: savri_delete_goal
// ============================================================================
server.registerTool(
  "savri_delete_goal",
  {
    title: "Delete Goal",
    description: "Delete a conversion goal. This will also remove all conversion data for this goal.",
    inputSchema: {
      site_id: z.string().describe("Site ID"),
      goal_id: z.string().describe("Goal ID to delete"),
    },
  },
  async ({ site_id, goal_id }) => {
    await apiRequest<{ success: boolean }>("/goals", {
      method: "DELETE",
      params: { site_id, goal_id },
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ Goal deleted successfully.`,
        },
      ],
    };
  }
);

// ============================================================================
// TOOL: savri_list_funnels
// ============================================================================
server.registerTool(
  "savri_list_funnels",
  {
    title: "List Funnels",
    description: "List conversion funnels for a website.",
    inputSchema: {
      site_id: z.string().describe("Site ID"),
    },
  },
  async ({ site_id }) => {
    const result = await apiRequest<{
      data: Array<{
        id: string;
        name: string;
        description: string | null;
        steps: Array<{
          order: number;
          name: string;
          type: string;
          match_value: string;
        }>;
      }>;
      meta: { total: number };
    }>("/funnels", {
      params: { site_id },
    });

    if (result.data.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No funnels configured. Create one with savri_create_funnel.",
          },
        ],
      };
    }

    const lines = result.data.map((funnel) => {
      const steps = funnel.steps
        .map((s) => `  ${s.order}. ${s.name} (${s.type}: ${s.match_value})`)
        .join("\n");
      return `${funnel.name}${funnel.description ? ` - ${funnel.description}` : ""}\n${steps}\n  ID: ${funnel.id}`;
    });

    return {
      content: [{ type: "text", text: `📈 Funnels:\n\n${lines.join("\n\n")}` }],
    };
  }
);

// ============================================================================
// TOOL: savri_create_funnel
// ============================================================================
server.registerTool(
  "savri_create_funnel",
  {
    title: "Create Funnel",
    description:
      "Create a conversion funnel to track user journey through multiple steps. " +
      "Requires at least 2 steps. Each step can be a pageview or custom event.",
    inputSchema: {
      site_id: z.string().describe("Site ID"),
      name: z.string().describe("Funnel name (e.g., 'Checkout Flow')"),
      description: z.string().optional().describe("Funnel description"),
      steps: z
        .array(
          z.object({
            name: z.string().describe("Step name (e.g., 'View Product')"),
            type: z.enum(["pageview", "event"]).describe("Step type"),
            match_value: z.string().describe("URL path or event name to match"),
            match_type: z
              .enum(["exact", "contains", "startswith"])
              .optional()
              .describe("How to match (default: exact)"),
          })
        )
        .describe("Funnel steps (min 2)"),
    },
  },
  async ({ site_id, name, description, steps }) => {
    if (!steps || steps.length < 2) {
      return {
        content: [{ type: "text", text: "Error: At least 2 steps are required for a funnel" }],
      };
    }

    const result = await apiRequest<{
      success: boolean;
      data: {
        id: string;
        name: string;
        description: string | null;
        steps: Array<{
          order: number;
          name: string;
          type: string;
          match_value: string;
          match_type: string;
        }>;
      };
    }>("/funnels", {
      method: "POST",
      body: { site_id, name, description, steps },
    });

    const f = result.data;
    const stepList = f.steps.map((s) => `  ${s.order}. ${s.name} (${s.type}: ${s.match_value})`).join("\n");

    return {
      content: [
        {
          type: "text",
          text: `✅ Funnel created successfully!\n\nName: ${f.name}${f.description ? `\nDescription: ${f.description}` : ""}\nSteps:\n${stepList}\nID: ${f.id}`,
        },
      ],
    };
  }
);

// ============================================================================
// TOOL: savri_delete_funnel
// ============================================================================
server.registerTool(
  "savri_delete_funnel",
  {
    title: "Delete Funnel",
    description: "Delete a conversion funnel and all its steps.",
    inputSchema: {
      site_id: z.string().describe("Site ID"),
      funnel_id: z.string().describe("Funnel ID to delete"),
    },
  },
  async ({ site_id, funnel_id }) => {
    await apiRequest<{ success: boolean }>("/funnels", {
      method: "DELETE",
      params: { site_id, funnel_id },
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ Funnel deleted successfully.`,
        },
      ],
    };
  }
);

// ============================================================================
// TOOL: savri_get_funnel_stats
// ============================================================================
server.registerTool(
  "savri_get_funnel_stats",
  {
    title: "Get Funnel Statistics",
    description:
      "Get conversion statistics for a funnel, showing how users progress through each step. " +
      "Returns session counts, drop-off rates, and overall conversion.",
    inputSchema: {
      funnel_id: z.string().describe("Funnel ID"),
      period: z.enum(["7d", "30d", "90d"]).optional().describe("Time period (default: 30d)"),
    },
  },
  async ({ funnel_id, period }) => {
    const result = await apiRequest<{
      data: {
        funnel: {
          id: string;
          name: string;
          description: string | null;
        };
        period: { from: string; to: string };
        steps: Array<{
          id: string;
          order: number;
          name: string;
          type: string;
          match_value: string;
          sessions: number;
          dropoff_rate: number;
          conversion_from_start: number;
        }>;
        overall_conversion: number;
        total_entries: number;
        total_completions: number;
      };
    }>(`/funnels/${funnel_id}/stats`, {
      params: { period: period || "30d" },
    });

    const d = result.data;
    let text = `📈 ${d.funnel.name}\n`;
    text += `Period: ${d.period.from} to ${d.period.to}\n\n`;

    // Show steps with visual funnel
    d.steps.forEach((step, index) => {
      const bar = "█".repeat(Math.max(1, Math.round(step.conversion_from_start / 10)));
      const dropoff = index > 0 ? ` (↓${step.dropoff_rate}%)` : "";
      text += `${step.order}. ${step.name}${dropoff}\n`;
      text += `   ${bar} ${formatNumber(step.sessions)} sessions (${step.conversion_from_start}%)\n`;
    });

    text += `\n─────────────────────────\n`;
    text += `Overall conversion: ${d.overall_conversion}%\n`;
    text += `${formatNumber(d.total_entries)} entries → ${formatNumber(d.total_completions)} completions`;

    return { content: [{ type: "text", text }] };
  }
);

// ============================================================================
// Start server
// ============================================================================
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
