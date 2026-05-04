# Farcaster Snap Documentation

> This file aggregates all Farcaster Snap documentation (2.0) for LLM consumption.
> Source: https://docs.farcaster.xyz/snap/

---

## Introduction

# Introduction

Snaps are simple, nimble apps embedded in Farcaster casts. They render in the feed and
respond to user input — buttons, sliders, text — without executing any code on the
client. A snap server returns JSON; the Farcaster client displays it.

> **Beta:** This is all still in beta and may change significantly over the next few
> weeks or months.

Using Claude Code? Tell your agent to

```bash
use https://docs.farcaster.xyz/snap/SKILL.md to build me an app that
```

## Learn

- [Building a Snap](/snap/building) — Ways to create a snap, from AI-assisted generation
  to manual implementation with the template.
- [Integrating Snaps](/snap/integrating) — How to serve snap JSON alongside your normal
  site using content negotiation on the `Accept` header.
- [Persistent State](/snap/persistent-state) — The key-value store available on every
  snap handler invocation for persisting state between requests.
- [Examples](/snap/examples) — Sample snap response payloads showing common UI patterns.

## Reference

- [Spec](/snap/spec-overview) — The full HTTP protocol: content negotiation,
  request/response lifecycle, versioning, and validation rules.
- [HTTP Headers](/snap/http-headers) — `Accept`, `Content-Type`, `Vary`, and `Link` for
  snap responses and fallbacks.
- [Elements](/snap/elements) — All 16 components: display, data, container, and field
  types.
- [Buttons](/snap/buttons) — The `button` component, variants, layout, and how POST
  payloads are constructed when a user taps.
- [Surfaces](/snap/surfaces) — The app surface where a snap interaction happens.
- [Actions](/snap/actions) — The 9 action types and their params.
- [Effects](/snap/effects) — Page-level overlays (confetti, etc.) that fire on render.
- [Constraints](/snap/constraints) — Per-component validation limits and URL rules.
- [Theme & Styling](/snap/theme) — How accent colors work and why snaps specify only a
  palette name rather than hex values.
- [Color Palette](/snap/colors) — The named palette colors available for accent,
  progress bars, and bar charts.
- [Authentication](/snap/auth) — How POST requests are authenticated with JSON Farcaster
  Signatures (JFS) and how servers verify them.

## Agents

- [Agents](/snap/agents) — Machine-readable docs, the skill file, and starting points
  for AI tools building or integrating snaps.

## Contributing

- See the [GitHub repo](https://github.com/farcasterxyz/snap)

---

## Building Snaps with AI

# Building Snaps with AI

This page collects everything an AI agent or automated tool needs to work with Farcaster
Snaps.

## Creating a snap with an agent

If you use a coding agent like [Claude Code](https://claude.ai/code), you can ask it to
install a skill that generates snaps from natural language:

```bash
install the farcaster-snap skill from https://docs.farcaster.xyz/snap/SKILL.md
make ... a Farcaster Snap poll asking users to pick their favorite variety of mole
```

The skill will:

1. Read the full snap spec
2. Generate valid snap code
3. Deploy it to a live URL

This is the fastest way to go from idea to working snap.

## Machine-readable documentation

The full docs are available in machine-readable form:

- **[/llms.txt](/snap/llms.txt)** — all documentation concatenated into a single plain-text
  file, suitable for pasting into a context window or fetching at the start of a session
- any page of the docs can be requested with the `Accept: text/markdown` HTTP header to
  get Markdown-fromatted docs and save on tokens.
- **`/markdown-content/`** — individual pages as plain markdown (e.g.
  `/markdown-content/spec-overview`, `/markdown-content/elements`, etc)

---

## Building a Snap

# Building a Snap

There are several ways to create a Farcaster Snap, from AI-assisted generation to manual
implementation.

## Designing for the feed

Snaps render at a fixed width (~480px) inside Farcaster client feeds. Most clients clip
snap content at around **500px in height** — anything below that line is not visible to
users without scrolling or expansion (behavior varies by client).

Design your snap's primary content to fit within this visible area. Use the
[Emulator](https://farcaster.xyz/~/developers/snaps) to preview your snap — it shows a
500px height indicator so you can see where content will be clipped.

## Agent Skill

If you use a coding agent like [Claude Code](https://claude.ai/code), you can ask it to
install a skill that generates snaps from natural language:

```bash
install the farcaster-snap skill from https://docs.farcaster.xyz/snap/SKILL.md
make me a Farcaster Snap poll asking users to pick their favorite variety of mole
```

The skill will:

1. Read the full snap spec
2. Generate valid snap code
3. Deploy it to a live URL

This is the fastest way to go from idea to working snap.

## Template (Hono)

The `snap-template/` directory is a starter project using [Hono](https://hono.dev) with
the `@farcaster/snap-hono` package:

```bash
# From the repo root
cp -r snap-template my-snap
cd my-snap
pnpm install
```

Edit `src/index.ts` to implement your snap logic:

```typescript
import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";

const app = new Hono();

registerSnapHandler(app, async (ctx) => {
  if (ctx.action.type === "get") {
    return {
      version: "2.0",
      theme: { accent: "purple" },
      ui: {
        root: "page",
        elements: {
          page: {
            type: "stack",
            props: {},
            children: ["title", "body", "action"],
          },
          title: {
            type: "text",
            props: { content: "My Snap", weight: "bold" },
          },
          body: {
            type: "text",
            props: { content: "Hello world" },
          },
          action: {
            type: "button",
            props: { label: "Refresh", variant: "primary" },
            on: {
              press: {
                action: "submit",
                params: { target: "https://my-snap.com/" },
              },
            },
          },
        },
      },
    };
  }

  // Handle POST interactions
  const { user, inputs } = ctx.action;
  const fid = user.fid;
  const url = new URL(ctx.request.url);
  const action = url.searchParams.get("action"); // e.g. ?action=vote
  // ... your logic here
});
```

Run locally:

```bash
SKIP_JFS_VERIFICATION=1 pnpm dev  # http://localhost:3003
```

## Testing

Use the [Emulator](https://farcaster.xyz/~/developers/snaps) to test your snap. Enter
your snap's URL and interact with it -- the emulator signs messages automatically, so no
signature bypass is needed.

## Deploying

Snaps can be deployed anywhere that serves HTTP. Common options:

- **Vercel** -- works with the Hono template out of the box
- **Any Node.js host** -- the Hono template includes a standalone server

Set `SNAP_PUBLIC_BASE_URL` to your deployment origin (no trailing slash) so button
target URLs resolve correctly.

After deploying, verify your snap works:

```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' https://your-snap-url.com/
```

You should get valid JSON with content type `application/vnd.farcaster.snap+json`.

## Common pitfalls

### Missing `.js` on local imports

The template is an ESM project (`"type": "module"`). All relative imports **must include
the `.js` extension**, even though the source files are `.ts`:

```ts
// ✅ correct
import { foo } from "./foo.js";

// ❌ wrong — breaks on deploy with `500 FUNCTION_INVOCATION_FAILED`
import { foo } from "./foo";
```

Omitting the extension is a silent trap: `tsx` accepts bare imports in local dev, and the
TypeScript `"bundler"` module resolution used to accept them at typecheck too — but the
Vercel Edge / Node ESM runtime enforces the extension, so every route returns
`500 FUNCTION_INVOCATION_FAILED` after deploy. The current template's `tsconfig.json`
uses `"moduleResolution": "NodeNext"` so `pnpm build` (`tsc --noEmit`) now catches this
at build time.

Bare package imports (`hono`, `@farcaster/snap`, etc.) do not need an extension.

---

## Integrating Snaps

# Integrating Snaps

If you already have a website and want it to render as a snap when shared on Farcaster,
you need to serve snap JSON from the **same URL** as your site when the client requests
it. You can use HTTP headers to serve snaps and HTML from the same URL. See
[HTTP Headers](/http-headers) for details.

## Dynamic sites (Node.js, Hono, Express)

If your site has a server, add middleware that checks for the snap media type in
`Accept` before your existing routes.

### With Hono

```typescript
import { Hono } from "hono";

const app = new Hono();

// Snap handler -- runs before your existing routes
app.get("/", async (c, next) => {
  const accept = c.req.header("Accept") || "";
  if (!accept.includes("application/vnd.farcaster.snap+json")) {
    return next(); // Not a snap request, continue to normal site
  }

  // Return snap JSON
  return c.json(
    {
      version: "2.0",
      theme: { accent: "purple" },
      ui: {
        root: "page",
        elements: {
          page: {
            type: "stack",
            props: {},
            children: ["title", "body", "cta"],
          },
          title: {
            type: "text",
            props: { content: "My Site", weight: "bold" },
          },
          body: {
            type: "text",
            props: { content: "Welcome to my site on Farcaster.", size: "sm" },
          },
          cta: {
            type: "button",
            props: { label: "Visit site", variant: "primary" },
            on: {
              press: {
                action: "open_url",
                params: { target: "https://example.com" },
              },
            },
          },
        },
      },
    },
    200,
    {
      "Content-Type": "application/vnd.farcaster.snap+json",
      Vary: "Accept",
    },
  );
});

// Your existing routes continue to work
app.get("/", (c) => c.html("<h1>My normal website</h1>"));
```

### With Express

```typescript
app.get("/", (req, res, next) => {
  const accept = req.headers.accept || "";
  if (!accept.includes("application/vnd.farcaster.snap+json")) {
    return next();
  }

  res.set("Content-Type", "application/vnd.farcaster.snap+json");
  res.set("Vary", "Accept");
  res.json({
    version: "2.0",
    theme: { accent: "blue" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "body"],
        },
        title: {
          type: "text",
          props: { content: "My Site", weight: "bold" },
        },
        body: {
          type: "text",
          props: { content: "Check us out on Farcaster.", size: "sm" },
        },
      },
    },
  });
});
```

## Static sites (GitHub Pages, Netlify, S3)

Static hosts can't do server-side content negotiation. Use one of these approaches to
honor [HTTP Headers](/http-headers) at the edge:

### Option 1: Cloudflare Worker proxy

Put a Cloudflare Worker in front of your static site. It inspects `Accept` and routes
snap requests to a separate snap server.

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const accept = request.headers.get("Accept") || "";
    const url = new URL(request.url);

    if (accept.includes("application/vnd.farcaster.snap+json")) {
      // Forward to your snap server (e.g. deployed on host.neynar.app)
      const snapUrl = "https://my-snap.host.neynar.app" + url.pathname;
      return fetch(snapUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
    }

    // Forward to your static site
    return fetch(request);
  },
};
```

Deploy the snap server separately (e.g. using the
[snap template](https://github.com/farcasterxyz/snap/tree/main/template) on
[host.neynar.app](https://host.neynar.app)) and point the worker at it.

### Option 2: Vercel Edge Middleware

If your static site is on Vercel, add a `middleware.ts` at the project root:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const accept = request.headers.get("Accept") || "";

  if (accept.includes("application/vnd.farcaster.snap+json")) {
    // Rewrite to your snap API route or external snap server
    return NextResponse.rewrite(
      new URL("https://my-snap.host.neynar.app" + request.nextUrl.pathname),
    );
  }

  return NextResponse.next();
}
```

### Option 3: Separate snap URL

The simplest approach -- deploy your snap to a different URL entirely and share that URL
in casts. Your website stays untouched.

- Website: `https://example.com`
- Snap: `https://example-snap.host.neynar.app`

Users who click the link in a browser go to the snap's fallback page (which previews the
snap and links to your site). Farcaster clients render the snap inline.

## Handling POST interactions

If your snap has buttons with `submit` actions, the Farcaster client sends signed POST
requests to the button's `target` URL. For static site setups (Options 1-3 above), these
POSTs go to your snap server, not the static site.

Make sure your snap's button targets point to the snap server URL, not the static site:

```json
{
  "type": "button",
  "props": { "label": "Vote", "variant": "primary" },
  "on": {
    "press": {
      "action": "submit",
      "params": { "target": "https://my-snap.host.neynar.app/vote" }
    }
  }
}
```

## Rendering snaps in a client

If you're building a Farcaster client that displays snaps, see the
[Clients](/snap/client-overview) section for rendering guides, action handler
documentation, and the client upgrade guide.

## Testing

Test content negotiation with curl:

```bash
# Should return your normal HTML
curl -sS https://example.com/

# Should return snap JSON
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' https://example.com/
```

Then test interactively at
[farcaster.xyz/~/developers/snaps](https://farcaster.xyz/~/developers/snaps) -- enter
your URL and click Load snap. The emulator sends real signed POST requests, so buttons
work exactly like in the feed.

---

## Persistent State

# Persistent State

**Key-value storage is optional** and lives in your server code, not in
`@farcaster/snap` itself.

**For coding agents:** use `@farcaster/snap-turso`. It exports a `DataStore` with:

- **`await store.get(key)`** — returns a JSON-serializable value or `null` if the key is
  missing.
- **`await store.set(key, value)`** — writes the value (overwrites an existing key).

Create a single store when the process starts (module scope), then close over it inside
your `SnapFunction`.

```ts
import type { SnapFunction } from "@farcaster/snap";
import { createTursoDataStore } from "@farcaster/snap-turso";

const store = createTursoDataStore();

const snap: SnapFunction = async (ctx) => {
  const visits = ((await store.get("visits")) as number) ?? 0;
  await store.set("visits", visits + 1);
  return {
    version: "2.0",
    ui: {
      root: "page",
      elements: {
        page: { type: "stack", props: {}, children: ["count"] },
        count: {
          type: "text",
          props: { content: `Visits: ${visits + 1}` },
        },
      },
    },
  };
};
```

`createTursoDataStore()` uses an in-memory map for local development and testing.

**Full wiring example** lives in the repo template — start from
[`template/src/index.ts`](https://github.com/farcasterxyz/snap/blob/main/template/src/index.ts).

---

## Examples

# Examples

Real-world examples of `SnapResponse` payloads showing common patterns.

## Paginated Gallery / Multiple Buttons

A multi-page gallery with Previous / Next navigation using query parameters.

The handler reads `?idx=N` from the URL and returns different content for each page.
Buttons use `action: "submit"` with a `target` URL that includes the next or previous
index.

You can use this same approach if you have multiple buttons on the same page that do
different things: give each button a different `target` using GET params. Then the
server will know which button was clicked.

### First page (`?idx=0`)

<SnapPreview
  snap={{
    version: "2.0",
    theme: { accent: "blue" },
    ui: {
      root: "page",
      elements: {
        page: { type: "stack", props: {}, children: ["title", "counter", "nav"] },
        title: { type: "text", props: { content: "Alpha", weight: "bold" } },
        counter: { type: "text", props: { content: "1 of 5", size: "sm" } },
        nav: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["prev-btn", "next-btn"],
        },
        "prev-btn": {
          type: "button",
          props: { label: "Previous" },
          on: {
            press: {
              action: "submit",
              params: { target: "https://example.com/?idx=0" },
            },
          },
        },
        "next-btn": {
          type: "button",
          props: { label: "Next", variant: "primary" },
          on: {
            press: {
              action: "submit",
              params: { target: "https://example.com/?idx=1" },
            },
          },
        },
      },
    },
  }}
/>

### After tapping Next (`?idx=1`)

<SnapPreview
  snap={{
    version: "2.0",
    theme: { accent: "blue" },
    ui: {
      root: "page",
      elements: {
        page: { type: "stack", props: {}, children: ["title", "counter", "nav"] },
        title: { type: "text", props: { content: "Bravo", weight: "bold" } },
        counter: { type: "text", props: { content: "2 of 5", size: "sm" } },
        nav: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["prev-btn", "next-btn"],
        },
        "prev-btn": {
          type: "button",
          props: { label: "Previous" },
          on: {
            press: {
              action: "submit",
              params: { target: "https://example.com/?idx=0" },
            },
          },
        },
        "next-btn": {
          type: "button",
          props: { label: "Next", variant: "primary" },
          on: {
            press: {
              action: "submit",
              params: { target: "https://example.com/?idx=2" },
            },
          },
        },
      },
    },
  }}
/>

### Handler code

```ts
import type { SnapFunction } from "@farcaster/snap";

const items = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"];

function snapBaseUrlFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host");
  const host = (forwardedHost ?? hostHeader)?.split(",")[0].trim();
  const isLoopback =
    host !== undefined && /^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?$/.test(host);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto = forwardedProto
    ? forwardedProto.split(",")[0].trim().toLowerCase()
    : isLoopback
      ? "http"
      : "https";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return `http://localhost:${process.env.PORT ?? "3003"}`.replace(/\/$/, "");
}

const snap: SnapFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const idx = Math.max(
    0,
    Math.min(items.length - 1, parseInt(url.searchParams.get("idx") ?? "0", 10) || 0),
  );
  const prev = Math.max(0, idx - 1);
  const next = Math.min(items.length - 1, idx + 1);
  const base = snapBaseUrlFromRequest(ctx.request);

  return {
    version: "2.0",
    theme: { accent: "blue" },
    ui: {
      root: "page",
      elements: {
        page: { type: "stack", props: {}, children: ["title", "counter", "nav"] },
        title: { type: "text", props: { content: items[idx], weight: "bold" } },
        counter: {
          type: "text",
          props: { content: `${idx + 1} of ${items.length}`, size: "sm" },
        },
        nav: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["prev-btn", "next-btn"],
        },
        "prev-btn": {
          type: "button",
          props: { label: "Previous" },
          on: {
            press: { action: "submit", params: { target: `${base}/?idx=${prev}` } },
          },
        },
        "next-btn": {
          type: "button",
          props: { label: "Next", variant: "primary" },
          on: {
            press: { action: "submit", params: { target: `${base}/?idx=${next}` } },
          },
        },
      },
    },
  };
};
```

## Collaborative Wordle

A word game with a text input and submit button.

### First page (feed card)

<SnapPreview
  snap={{
    version: "2.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "guess", "meta", "submit-btn"],
        },
        title: {
          type: "text",
          props: { content: "Daily Wordle \u00b7 Day 12", weight: "bold" },
        },
        guess: {
          type: "input",
          props: {
            name: "guess",
            label: "Your guess",
            placeholder: "Type 5-letter word...",
          },
        },
        meta: {
          type: "text",
          props: { content: "1,247 guesses today \u00b7 Attempt 4/6", size: "sm" },
        },
        "submit-btn": {
          type: "button",
          props: { label: "Submit guess", variant: "primary" },
          on: {
            press: {
              action: "submit",
              params: { target: "https://wordle.example.com/guess" },
            },
          },
        },
      },
    },
  }}
/>

```json
{
  "version": "2.0",
  "theme": { "accent": "green" },
  "ui": {
    "root": "page",
    "elements": {
      "page": {
        "type": "stack",
        "props": {},
        "children": ["title", "guess", "meta", "submit-btn"]
      },
      "title": {
        "type": "text",
        "props": { "content": "Daily Wordle · Day 12", "weight": "bold" }
      },
      "guess": {
        "type": "input",
        "props": {
          "name": "guess",
          "label": "Your guess",
          "placeholder": "Type 5-letter word...",
          "maxLength": 5
        }
      },
      "meta": {
        "type": "text",
        "props": { "content": "1,247 guesses today · Attempt 4/6", "size": "sm" }
      },
      "submit-btn": {
        "type": "button",
        "props": { "label": "Submit guess", "variant": "primary" },
        "on": {
          "press": {
            "action": "submit",
            "params": { "target": "https://wordle.example.com/guess" }
          }
        }
      }
    }
  }
}
```

### Response after submitting a guess

<SnapPreview
  snap={{
    version: "2.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "result", "meta", "open-btn"],
        },
        title: {
          type: "text",
          props: { content: "Daily Wordle \u00b7 Day 12", weight: "bold" },
        },
        result: {
          type: "text",
          props: { content: "Your guess has been submitted!", align: "center" },
        },
        meta: {
          type: "text",
          props: {
            content: "The crowd\u2019s most popular guess will be locked in at 6pm",
            size: "sm",
          },
        },
        "open-btn": {
          type: "button",
          props: { label: "Open full game" },
          on: {
            press: {
              action: "open_mini_app",
              params: { target: "https://wordle.example.com/app" },
            },
          },
        },
      },
    },
  }}
/>

```json
{
  "version": "2.0",
  "theme": { "accent": "green" },
  "ui": {
    "root": "page",
    "elements": {
      "page": {
        "type": "stack",
        "props": {},
        "children": ["title", "result", "meta", "open-btn"]
      },
      "title": {
        "type": "text",
        "props": { "content": "Daily Wordle · Day 12", "weight": "bold" }
      },
      "result": {
        "type": "text",
        "props": {
          "content": "Your guess has been submitted!",
          "align": "center"
        }
      },
      "meta": {
        "type": "text",
        "props": {
          "content": "The crowd's most popular guess will be locked in at 6pm",
          "size": "sm"
        }
      },
      "open-btn": {
        "type": "button",
        "props": { "label": "Open full game" },
        "on": {
          "press": {
            "action": "open_mini_app",
            "params": { "target": "https://wordle.example.com/app" }
          }
        }
      }
    }
  }
}
```

## This or That

A voting snap with a choice group and progress bars for results.

### First page (feed card)

<SnapPreview
  snap={{
    version: "2.0",
    theme: { accent: "blue" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "meta", "vote", "vote-btn"],
        },
        title: { type: "text", props: { content: "Startup dilemmas", weight: "bold" } },
        meta: {
          type: "text",
          props: { content: "by @dwr.eth \u00b7 3.1k voted", size: "sm" },
        },
        vote: {
          type: "toggle_group",
          props: {
            name: "vote",
            orientation: "vertical",
            options: ["Move fast, break things", "Move deliberately, build trust"],
          },
        },
        "vote-btn": {
          type: "button",
          props: { label: "Vote", variant: "primary" },
          on: {
            press: {
              action: "submit",
              params: { target: "https://example.com/thisorthat/vote" },
            },
          },
        },
      },
    },
  }}
/>

```json
{
  "version": "2.0",
  "theme": { "accent": "blue" },
  "ui": {
    "root": "page",
    "elements": {
      "page": {
        "type": "stack",
        "props": {},
        "children": ["title", "meta", "vote", "vote-btn"]
      },
      "title": {
        "type": "text",
        "props": { "content": "Startup dilemmas", "weight": "bold" }
      },
      "meta": {
        "type": "text",
        "props": { "content": "by @dwr.eth · 3.1k voted", "size": "sm" }
      },
      "vote": {
        "type": "toggle_group",
        "props": {
          "name": "vote",
          "orientation": "vertical",
          "options": ["Move fast, break things", "Move deliberately, build trust"]
        }
      },
      "vote-btn": {
        "type": "button",
        "props": { "label": "Vote", "variant": "primary" },
        "on": {
          "press": {
            "action": "submit",
            "params": { "target": "https://example.com/thisorthat/vote" }
          }
        }
      }
    }
  }
}
```

### Response after voting

<SnapPreview
  snap={{
    version: "2.0",
    theme: { accent: "blue" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: [
            "title",
            "opt-a-label",
            "opt-a-bar",
            "opt-b-label",
            "opt-b-bar",
            "actions",
          ],
        },
        title: { type: "text", props: { content: "Startup dilemmas", weight: "bold" } },
        "opt-a-label": {
          type: "text",
          props: { content: "Move fast, break things", size: "sm" },
        },
        "opt-a-bar": { type: "progress", props: { value: 38, max: 100, label: "38%" } },
        "opt-b-label": {
          type: "text",
          props: { content: "Move deliberately, build trust", size: "sm" },
        },
        "opt-b-bar": {
          type: "progress",
          props: { value: 62, max: 100, label: "62% \u00b7 3,102 votes" },
        },
        actions: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["next-btn", "share-btn"],
        },
        "next-btn": {
          type: "button",
          props: { label: "Next question", variant: "primary" },
          on: {
            press: {
              action: "submit",
              params: { target: "https://example.com/thisorthat/next" },
            },
          },
        },
        "share-btn": {
          type: "button",
          props: { label: "Share results", icon: "share" },
          on: {
            press: {
              action: "open_url",
              params: { target: "https://example.com/thisorthat/share/abc123" },
            },
          },
        },
      },
    },
  }}
/>

```json
{
  "version": "2.0",
  "theme": { "accent": "blue" },
  "ui": {
    "root": "page",
    "elements": {
      "page": {
        "type": "stack",
        "props": {},
        "children": [
          "title",
          "opt-a-label",
          "opt-a-bar",
          "opt-b-label",
          "opt-b-bar",
          "actions"
        ]
      },
      "title": {
        "type": "text",
        "props": { "content": "Startup dilemmas", "weight": "bold" }
      },
      "opt-a-label": {
        "type": "text",
        "props": { "content": "Move fast, break things", "size": "sm" }
      },
      "opt-a-bar": {
        "type": "progress",
        "props": { "value": 38, "max": 100, "label": "38%" }
      },
      "opt-b-label": {
        "type": "text",
        "props": { "content": "Move deliberately, build trust", "size": "sm" }
      },
      "opt-b-bar": {
        "type": "progress",
        "props": { "value": 62, "max": 100, "label": "62% · 3,102 votes" }
      },
      "actions": {
        "type": "stack",
        "props": { "direction": "horizontal", "gap": "sm" },
        "children": ["next-btn", "share-btn"]
      },
      "next-btn": {
        "type": "button",
        "props": { "label": "Next question", "variant": "primary" },
        "on": {
          "press": {
            "action": "submit",
            "params": { "target": "https://example.com/thisorthat/next" }
          }
        }
      },
      "share-btn": {
        "type": "button",
        "props": { "label": "Share results", "icon": "share" },
        "on": {
          "press": {
            "action": "open_url",
            "params": { "target": "https://example.com/thisorthat/share/abc123" }
          }
        }
      }
    }
  }
}
```

---

## Upgrading from v1.0

# Upgrading from v1.0 to v2.0

This guide covers the breaking changes between snap spec v1.0 and v2.0, and what you
need to update in your snap server.

## Version field

Change the `version` field in your snap response from `"1.0"` to `"2.0"`:

```json
{
  "version": "2.0",
  "theme": { "accent": "purple" },
  "ui": { ... }
}
```

## Authentication changes

The POST payload shape has changed. v2 adds `audience`, `user`, and `surface`, and
removes `button_index`.

### Removed: `button_index`

The `button_index` field is no longer included in POST payloads. If your server reads
`ctx.action.button_index`, remove that code. Instead, use distinct `submit` target URLs
for each button to distinguish which button was pressed:

```typescript
// Before (v1): read button_index
const idx = ctx.action.button_index;

// After (v2): use the request URL to distinguish buttons
const url = new URL(ctx.request.url);
const action = url.searchParams.get("action"); // e.g. ?action=vote or ?action=skip
```

### Added: `audience`, `user`, and `surface`

Every v2 POST payload includes `audience` (server origin), `user`, and `surface`. The
top-level `fid` field is deprecated in favor of `user.fid` but is still temporarily
necessary with the same value during a migration phase.

If you use `@farcaster/snap-hono`, these fields are validated automatically by
`parseRequest`. No code changes needed on your end — just upgrade the package.

If you handle verification manually, you MUST:

1. Verify `audience` matches your server's origin
2. Reject requests with timestamps outside your allowed skew (default 5 minutes)

Prefer reading **`ctx.action.user.fid`** in new code; **`ctx.action.fid`** remains for
compatibility.

See [Authentication](/snap/auth) and [Surfaces](/snap/surfaces) for the full spec.

## Structural constraints (new)

v2 enforces structural limits on your snap's UI tree to prevent endlessly tall or
complex snaps:

| Constraint             | Limit                                      |
| ---------------------- | ------------------------------------------ |
| Total elements         | Max **64** in `ui.elements`                |
| Root children          | Max **7** on the root element              |
| Children per container | Max **6** per `stack` or `item_group`      |
| Nesting depth          | Max **5** levels from root to deepest leaf |

Snaps that exceed these limits will fail validation and not render. If your v1 snap has
large or deeply nested UIs, you may need to restructure.

See [Constraints](/snap/constraints) for the full list.

## Client upgrade required

Farcaster clients **must** be updated to send `audience`, `user`, and `surface` in every
POST payload. v2 snap servers will reject requests that omit these fields. See the
[Client Upgrade Guide](/snap/client-upgrade) for the full payload format and fallback
behavior for older servers.

## Package updates

Update your dependencies to the latest versions:

```bash
pnpm update @farcaster/snap @farcaster/snap-hono
```

The latest `@farcaster/snap-hono` handles all v2 changes automatically — `parseRequest`
validates the POST payload, and the response validator enforces structural constraints.

## Testing

Use the [Emulator](https://farcaster.xyz/~/developers/snaps) to test your upgraded snap.
The emulator supports both v1 and v2 snaps and will show validation errors if your snap
violates any v2 constraints.

## Checklist

- [ ] Set `version` to `"2.0"` in your snap response
- [ ] Remove any code that reads `button_index`
- [ ] Use distinct submit target URLs to distinguish buttons
- [ ] Verify your UI tree fits within structural constraints
- [ ] Update `@farcaster/snap` and `@farcaster/snap-hono` packages
- [ ] Ensure your Farcaster client sends `audience`, `user`, and `surface` in POST
      payloads ([details](/snap/client-upgrade))
- [ ] Test in the emulator

---

## Overview

# Overview

## Overview

A Farcaster Snap is an interactive embed inside a cast. It renders as a card in the feed
and can be multi-page, stateful, and dynamic. Snaps are defined by a JSON response
served by an external server. The Farcaster client renders the JSON — it never executes
arbitrary code.

Snaps are the evolution of Frames: richer components, multi-page flows, dynamic content,
and the same server-driven model.

Example interaction:

1. A cast embed points to a URL that implements the snap protocol
2. The client GETs that URL, signaling snap support. The server responds with a JSON
   SnapResponse (GET MAY include optional viewer identity via `X-Snap-Payload`; see
   [Authentication](/snap/auth))
3. The client renders the `ui` tree using the component catalog
4. The user interacts with field components (`input`, `slider`, `switch`,
   `toggle_group`) — values are stored locally
5. The user taps a `button` element whose `on.press` is bound to a `submit` action
6. The client collects all field values and POSTs a signed payload to the `target` URL
7. The server returns a new SnapResponse — the client renders it as the next page
8. Repeat

## Content Negotiation

The snap media type is `application/vnd.farcaster.snap+json`. Clients and servers use
HTTP headers (`Accept`, `Content-Type`, `Vary`, and `Link`) to signal Snap support and
so the same URL can serve snap JSON or fallback content. See
[HTTP Headers](/http-headers) for details.

## Authentication

Main page: [Authentication](/snap/auth)

Snap POST requests use **JSON Farcaster Signatures (JFS)** for authentication.

## Response Structure

Valid snap responses have roughly this shape:

```json
{
  "version": "2.0",
  "theme": { "accent": "purple" },
  "effects": ["confetti"],
  "ui": {
    "root": "page",
    "elements": {
      "page": {
        "type": "stack",
        "props": {},
        "children": ["header", "guess", "submit"]
      },
      "header": {
        "type": "item",
        "props": { "title": "Daily Wordle", "description": "Attempt 3 of 6" }
      },
      "guess": {
        "type": "input",
        "props": { "name": "word", "label": "Your guess", "maxLength": 5 }
      },
      "submit": {
        "type": "button",
        "props": { "label": "Submit", "variant": "primary" },
        "on": {
          "press": {
            "action": "submit",
            "params": { "target": "https://wordle.example.com/guess" }
          }
        }
      }
    }
  }
}
```

### Top-Level Fields

| Field          | Type             | Required | Default                | Description                                                    |
| -------------- | ---------------- | -------- | ---------------------- | -------------------------------------------------------------- |
| `version`      | `"2.0"`          | Yes      |                        | Spec version                                                   |
| `theme`        | object           | No       | `{ accent: "purple" }` | Theme configuration                                            |
| `theme.accent` | PaletteColor     | No       | `"purple"`             | Accent color for buttons, progress bars, etc.                  |
| `effects`      | string[]         | No       |                        | Visual effects applied on render. See [Effects](/snap/effects) |
| `ui`           | json-render Spec | Yes      |                        | The UI tree                                                    |

### The `ui` Field

The `ui` field is a [json-render](https://json-render.dev/) Spec — a flat element map
with typed components, props, and event bindings.

| Field         | Type                        | Required | Description                                   |
| ------------- | --------------------------- | -------- | --------------------------------------------- |
| `ui.root`     | string                      | Yes      | ID of the root element                        |
| `ui.elements` | Record\<string, UIElement\> | Yes      | Flat map of all elements by ID                |
| `ui.state`    | Record\<string, unknown\>   | No       | Initial state for the json-render state store |

### Element Structure

Every element in `ui.elements` follows this shape:

| Field      | Type     | Required | Description                                                            |
| ---------- | -------- | -------- | ---------------------------------------------------------------------- |
| `type`     | string   | Yes      | Component name (see [Elements](/snap/elements))                        |
| `props`    | object   | No       | Component-specific properties (omit or use `{}` if none)               |
| `children` | string[] | No       | Child element IDs (for containers and action slots)                    |
| `on`       | object   | No       | Event bindings — `on.press` triggers an action when a button is tapped |

### POST Payload

When a `submit` action fires, the client sends a JFS-signed envelope containing:

| Field       | Type                    | Description                                                 |
| ----------- | ----------------------- | ----------------------------------------------------------- |
| `fid`       | number                  | **Deprecated** — same as `user.fid`; kept for compatibility |
| `inputs`    | Record\<string, value\> | Field values keyed by component `name` prop                 |
| `timestamp` | number                  | Unix timestamp in seconds                                   |
| `audience`  | string                  | Origin of the intended recipient; must match server origin  |
| `user`      | `{ fid: number }`       | User taking the action (canonical identity)                 |
| `surface`   | discriminated union     | Interaction context — see [Surfaces](/snap/surfaces)        |

The POST is sent to the URL in the button’s `submit` action (`params.target`). The
`audience` must match the snap server’s origin. Use **different targets** for different
buttons—for example distinct paths or query strings—so your server can tell which action
ran.

Input values by field type:

| Component                 | Value sent |
| ------------------------- | ---------- |
| `input`                   | string     |
| `slider`                  | number     |
| `switch`                  | boolean    |
| `toggle_group` (single)   | string     |
| `toggle_group` (multiple) | string[]   |

## Broken Snaps

If the snap URL is unreachable, returns invalid JSON, or fails schema validation:

- The embed does **not** render in the feed
- The cast displays normally with the snap URL shown as plain text in the cast body
- The client may cache the last valid first page and show it with a "stale" indicator,
  at its discretion

If a `submit` action fails (timeout, server error, or invalid JSON response):

- The client stays on the current page — it is never replaced with a blank screen or
  error page
- An inline error is shown on the current page: "Something went wrong. Tap to retry."
- The user can retry the same button tap, or close/navigate away from the snap

## Navigation

There is no client-managed back button. Navigation is server-driven.

If a snap wants "go back" functionality, it includes a `button` with a `submit` action
that POSTs to the server, and the server returns the appropriate previous page. The
server is responsible for maintaining navigation state.

## Versioning

The `version` field is required on every response. Clients must check this field.

- If the version is supported, render normally
- If the version is newer than the client supports, show a fallback: the snap name/URL
  with a message "Update Farcaster to view this snap"
- Snaps should target the lowest version that supports their component types

## Validator (`@farcaster/snap`)

Runtime validation lives in
[`@farcaster/snap`](https://github.com/farcasterxyz/snap/tree/main/pkgs/snap)
(`pkgs/snap`). The package validates snap JSON against the schema.

```bash
pnpm --filter @farcaster/snap test
```

Hono-oriented HTTP wiring (`registerSnapHandler`) is in
[`@farcaster/snap-hono`](https://github.com/farcasterxyz/snap/tree/main/pkgs/hono).

---

## HTTP Headers

# HTTP Headers

Snaps use the media type `application/vnd.farcaster.snap+json`. Clients and servers
coordinate snap responses with `Accept`, `Content-Type`, `Vary`, `Link`, and optionally
`X-Snap-Payload` on GET requests.

The spec has one goal: **a snap URL must never be silently missed.** Any HTTP client
performing a plain `GET` must be able to identify a snap — without knowing in advance
to ask for snap content.

## `Accept` (requests)

A client MAY include `application/vnd.farcaster.snap+json` in the `Accept` header to
indicate snap support.

- If `application/vnd.farcaster.snap+json` is the highest-priority acceptable type,
  the server MUST return a snap response.
- If the request does not indicate snap support, the server SHOULD return valid HTML
  (not snap), so that shared links render for users who open them in a browser.
- If the request does not indicate snap support and snap is the only representation
  the server supports, the server MUST return the snap directly — it has no valid
  alternative.

## `Content-Type` (responses)

A snap response MUST set `Content-Type: application/vnd.farcaster.snap+json`, and a
client receiving that `Content-Type` MUST render the body as a snap.

## `X-Snap-Payload` (requests)

On GET, a client MAY send optional viewer-authentication data as a JFS compact string in the `X-Snap-Payload` header. See [Authentication — Authenticated GETs](/snap/auth#authenticated-gets).

## `Vary` (responses)

When the representation depends on `Accept`, the server MUST include `Vary: Accept`
so caches and intermediaries key correctly.

Snap servers that return snap JSON SHOULD also include `Vary: X-Snap-Payload` when they support authenticated GETs, so caches distinguish anonymous and viewer-specific representations.

When a snap response depends on viewer identity (`action.user` from GET or POST), the server SHOULD set `Cache-Control: private` or a short `max-age` together with `Vary: X-Snap-Payload` to avoid leaking personalized content between viewers.

## `Link` (responses)

A URL that is available as a snap MUST be discoverable on a plain `GET`. A server
satisfies this in one of two ways:

1. Return the snap directly with
   `Content-Type: application/vnd.farcaster.snap+json`, **or**
2. Return HTML with a `Link` header advertising the snap as an alternate:

   ```
   Link: </resource>; rel="alternate"; type="application/vnd.farcaster.snap+json"
   ```

The only non-compliant pattern is HTML without a `Link` header — such a URL is
invisible to any client that did not already know to ask for snap content.

## Caching

Clients MAY cache GET responses from snap servers to avoid extraneous re-fetching.

---

## Elements

# Elements

Snaps are built from 16 components organized into four categories. Every component lives
in `ui.elements` as a named entry. The `type` field names the component; `props` carries
its configuration; `children` names child element IDs; `on` binds event handlers.

```json
"my-element": {
  "type": "text",
  "props": { "content": "Hello" }
}
```

| #   | Component                     | Category  | Description                               |
| --- | ----------------------------- | --------- | ----------------------------------------- |
| 1   | [badge](#badge)               | Display   | Inline label with color and icon          |
| 2   | [button](#button)             | Display   | Action button with variants and icon      |
| 3   | [icon](#icon)                 | Display   | Standalone icon from curated set          |
| 4   | [image](#image)               | Display   | HTTPS image with aspect ratio             |
| 5   | [item](#item)                 | Display   | Content row with actions slot             |
| 6   | [item_group](#item_group)     | Container | Groups items into a styled list           |
| 7   | [progress](#progress)         | Display   | Horizontal progress bar                   |
| 8   | [separator](#separator)       | Display   | Visual divider                            |
| 9   | [stack](#stack)               | Container | Vertical or horizontal layout             |
| 10  | [text](#text)                 | Display   | Text block with size and weight           |
| 11  | [bar_chart](#bar_chart)       | Data      | Horizontal bar chart with labeled bars    |
| 12  | [cell_grid](#cell_grid)       | Data      | Colored cell grid, optionally interactive |
| 13  | [input](#input)               | Field     | Text or number input                      |
| 14  | [slider](#slider)             | Field     | Numeric range slider                      |
| 15  | [switch](#switch)             | Field     | Boolean toggle                            |
| 16  | [toggle_group](#toggle_group) | Field     | Single or multi-select choice group       |

**Field components** (`input`, `slider`, `switch`, `toggle_group`) collect user input.
Their values are sent in the POST payload under `inputs[name]` when a `submit` action
fires.

---

## badge

Inline label with color and optional icon. Use for metadata, status indicators, and
counts alongside content. `"default"` (filled) draws attention; `"outline"` is subtler.
Pair with an icon for scannability.

[Interactive preview on docs site]

| Prop      | Type         | Required | Default     | Description                                    |
| --------- | ------------ | -------- | ----------- | ---------------------------------------------- |
| `label`   | string       | Yes      |             | Display text. Max 30 chars                     |
| `variant` | string       | No       | `"default"` | `"default"` (filled) or `"outline"` (bordered) |
| `color`   | PaletteColor | No       | `"accent"`  | Badge color                                    |
| `icon`    | IconName     | No       |             | Leading icon                                   |

```json
{ "type": "badge", "props": { "label": "New" } }
```

```json
{ "type": "badge", "props": { "label": "Live", "color": "green", "icon": "zap" } }
```

```json
{
  "type": "badge",
  "props": { "label": "ERC-20", "variant": "outline", "color": "blue" }
}
```

---

## button

Fires actions via `on.press` — the standard way to commit user input. Default variant is
`"secondary"` (bordered); use `"primary"` (filled) for the main CTA, typically one per
page. ([cell_grid](#cell_grid) also fires actions, via `on.press` per cell.) See
[Actions](/snap/actions) for the full list of action types.

[Interactive preview on docs site]

| Prop      | Type     | Required | Default       | Description               |
| --------- | -------- | -------- | ------------- | ------------------------- |
| `label`   | string   | Yes      |               | Button text. Max 30 chars |
| `variant` | string   | No       | `"secondary"` | Visual style              |
| `icon`    | IconName | No       |               | Leading icon              |

### Variants

| Variant     | Description                                       |
| ----------- | ------------------------------------------------- |
| `primary`   | Solid accent background, white text — primary CTA |
| `secondary` | Accent-colored border, transparent fill           |

```json
{
  "type": "button",
  "props": { "label": "Submit", "variant": "primary" },
  "on": {
    "press": { "action": "submit", "params": { "target": "https://my-snap.com/" } }
  }
}
```

```json
{
  "type": "button",
  "props": { "label": "Open" },
  "on": {
    "press": { "action": "open_url", "params": { "target": "https://example.com" } }
  }
}
```

---

## icon

Standalone icon from the curated set. Best as a visual accent inside item action slots
or horizontal stacks. Avoid using icons as standalone content — pair with text or use
inside a badge.

[Interactive preview on docs site]

| Prop    | Type         | Required | Default    | Description                    |
| ------- | ------------ | -------- | ---------- | ------------------------------ |
| `name`  | IconName     | Yes      |            | Icon identifier                |
| `color` | PaletteColor | No       | `"accent"` | Icon color                     |
| `size`  | string       | No       | `"md"`     | `"sm"` (16px) or `"md"` (20px) |

```json
{ "type": "icon", "props": { "name": "star", "color": "amber" } }
```

### Available Icons

| Category   | Icons                                                      |
| ---------- | ---------------------------------------------------------- |
| Navigation | `arrow-right` `arrow-left` `external-link` `chevron-right` |
| Status     | `check` `x` `alert-triangle` `info` `clock`                |
| Social     | `heart` `message-circle` `repeat` `share` `user` `users`   |
| Content    | `star` `trophy` `zap` `flame` `gift`                       |
| Media      | `image` `play` `pause`                                     |
| Commerce   | `wallet` `coins`                                           |
| Actions    | `plus` `minus` `refresh-cw` `bookmark`                     |
| Feedback   | `thumbs-up` `thumbs-down` `trending-up` `trending-down`    |

---

## image

HTTPS image with fixed aspect ratio. Use `"16:9"` for hero and banner images, `"1:1"`
for avatars or thumbnails, `"4:3"` for general photos, and `"9:16"` for tall portrait
content.

[Interactive preview on docs site]

| Prop     | Type   | Required | Description                        |
| -------- | ------ | -------- | ---------------------------------- |
| `url`    | string | Yes      | HTTPS URL. GIFs autoplay and loop. |
| `aspect` | string | Yes      | `"1:1"` `"16:9"` `"4:3"` `"9:16"`  |
| `alt`    | string | No       | Alt text for accessibility         |

```json
{
  "type": "image",
  "props": { "url": "https://example.com/photo.jpg", "aspect": "16:9" }
}
```

---

## item

The go-to component for structured content rows: leaderboards, settings, key-value info.
Has a title, optional description, and an actions slot on the right side. Put badges,
buttons, or icons in `children` for the action slot. Items are not interactive — don't
use navigation-style affordances like `chevron-right`, `arrow-right`, or `external-link`
that imply the row itself is clickable.

[Interactive preview on docs site]

| Prop          | Type   | Required | Default     | Description                               |
| ------------- | ------ | -------- | ----------- | ----------------------------------------- |
| `title`       | string | Yes      |             | Primary text. Max 100 chars               |
| `description` | string | No       |             | Secondary text below title. Max 160 chars |
| `variant`     | string | No       | `"default"` | Visual style                              |

### Variants

| Variant   | Description              |
| --------- | ------------------------ |
| `default` | No background, no border |

### Children

Rendered in the **actions slot** (right side). Badges, buttons, and icons are all fair
game — the item itself is not clickable, so pick trailing content that reads as content
(status icon, badge, button), not navigation. Avoid `chevron-right`, `arrow-right`, or
`external-link` on a plain item; they imply the row itself navigates.

```json
"score": {
  "type": "item",
  "props": { "title": "Engagement Score", "description": "Based on 24h activity" },
  "children": ["score-badge"]
},
"score-badge": { "type": "badge", "props": { "label": "92", "color": "green" } }
```

```json
"share": {
  "type": "item",
  "props": { "title": "Share this Snap", "description": "Pre-fill the composer" },
  "children": ["share-btn"]
},
"share-btn": {
  "type": "button",
  "props": { "label": "Share", "icon": "share" },
  "on": { "press": { "action": "compose_cast", "params": { "text": "Check out Snaps!" } } }
}
```

---

## item_group

Wraps related items for visual grouping. Use `separator: true` for settings-style lists
and `border: true` for card-like sections.

[Interactive preview on docs site]

| Prop        | Type    | Required | Default | Description                                          |
| ----------- | ------- | -------- | ------- | ---------------------------------------------------- |
| `border`    | boolean | No       | `false` | Show border around the group                         |
| `separator` | boolean | No       | `false` | Show divider lines between items                     |
| `gap`       | string  | No       |         | Spacing between items: `"none"` `"sm"` `"md"` `"lg"` |

**Children**: `item` elements only.

```json
"results": {
  "type": "item_group",
  "props": {},
  "children": ["r1", "r2", "r3"]
},
"r1": { "type": "item", "props": { "title": "First place", "description": "Alice" } },
"r2": { "type": "item", "props": { "title": "Second place", "description": "Bob" } },
"r3": { "type": "item", "props": { "title": "Third place", "description": "Charlie" } }
```

---

## progress

Horizontal progress bar for completion, scores, or any bounded numeric value. Always
uses the theme accent color. The label appears above the bar — use it for context like
"78%" or "Level 3 of 5".

[Interactive preview on docs site]

| Prop    | Type   | Required | Description                            |
| ------- | ------ | -------- | -------------------------------------- |
| `value` | number | Yes      | Current value (0 to max, finite)       |
| `max`   | number | Yes      | Maximum value (must be > 0, finite)    |
| `label` | string | No       | Label text above the bar. Max 60 chars |

```json
{ "type": "progress", "props": { "value": 65, "max": 100, "label": "Upload progress" } }
```

---

## separator

Visual divider between logical sections of a page. Most snaps use 2-4 separators.
Overusing them creates visual clutter.

[Interactive preview on docs site]

| Prop          | Type   | Required | Default        | Description                    |
| ------------- | ------ | -------- | -------------- | ------------------------------ |
| `orientation` | string | No       | `"horizontal"` | `"horizontal"` or `"vertical"` |

```json
{ "type": "separator", "props": {} }
```

---

## stack

Layout container for arranging children. Every page starts with a vertical stack as
root. Use horizontal stacks for button rows, badge groups, or side-by-side cards.
Nested **stack** children of a horizontal stack flex as peers (equal share of the row by default), so you usually do not need `columns` just to place two sections side by side.
`justify: "between"` is useful for navigation bars.

[Interactive preview on docs site]

| Prop        | Type   | Required | Default            | Description                                                            |
| ----------- | ------ | -------- | ------------------ | ---------------------------------------------------------------------- |
| `direction` | string | No       | `"vertical"`       | `"vertical"` or `"horizontal"`                                         |
| `gap`       | string | No       | column-aware       | Spacing between children: `"none"` `"sm"` `"md"` `"lg"` (see below)    |
| `justify`   | string | No       |                    | Content alignment: `"start"` `"center"` `"end"` `"between"` `"around"` |
| `columns`   | number | No       |                    | Horizontal stacks only: `2`–`6` for an explicit equal column grid. Omit when children are stacks — nested stacks flex as row peers automatically. |

### Gap

`gap` resolves to a different pixel value depending on `direction`. Horizontal stacks use a tighter scale because their children sit side-by-side and tend to be wider:

| Size   | Vertical | Horizontal |
| ------ | -------- | ---------- |
| `none` | 0px      | 0px        |
| `sm`   | 8px      | 4px        |
| `md`   | 16px     | 8px        |
| `lg`   | 24px     | 16px       |

When `gap` is omitted, vertical stacks default to `"md"`. Horizontal stacks pick a default based on column count — denser layouts get tighter gaps:

| Columns | Default        |
| ------- | -------------- |
| 2       | `"lg"` (16px)  |
| 3       | `"md"` (8px)   |
| 4–6     | `"sm"` (4px)   |
| unknown | `"md"` (8px)   |

Column count is taken from `columns` when set, or inferred from button-row children. **An explicit `gap` always wins** — override the default when you have a deliberate visual reason (extra breathing room around a hero row, a visually compact toolbar, a hero+supporting-button pair where the loose `lg` default would feel disconnected).

```json
"page": {
  "type": "stack",
  "props": {},
  "children": ["header", "content", "actions"]
}
```

```json
"row": {
  "type": "stack",
  "props": { "direction": "horizontal", "gap": "sm" },
  "children": ["b1", "b2", "b3"]
}
```

---

## text

The primary content element. Use `weight: "bold"` for headings and emphasis. Use
`size: "sm"` for captions, timestamps, and secondary info.

[Interactive preview on docs site]

| Prop      | Type   | Required | Default    | Description                     |
| --------- | ------ | -------- | ---------- | ------------------------------- |
| `content` | string | Yes      |            | Text content. Max 320 chars     |
| `size`    | string | No       | `"md"`     | `"md"` (body), `"sm"` (caption) |
| `weight`  | string | No       | `"normal"` | `"bold"` `"normal"`             |
| `align`   | string | No       | `"left"`   | `"left"` `"center"` `"right"`   |

```json
{ "type": "text", "props": { "content": "Welcome to Snaps", "weight": "bold" } }
```

```json
{
  "type": "text",
  "props": { "content": "Last updated 2 hours ago", "size": "sm", "align": "center" }
}
```

---

## bar_chart

Horizontal bar chart for displaying ranked or comparative data. Each bar shows a label
on the left, a colored fill bar, and a numeric value on the right. Use for poll results,
leaderboards, or any ranked values.

[Interactive preview on docs site]

| Prop    | Type         | Required | Default    | Description                 |
| ------- | ------------ | -------- | ---------- | --------------------------- |
| `bars`  | object[]     | Yes      |            | 1–6 bar entries (see below) |
| `max`   | number       | No       | max value  | Upper bound for bar scale   |
| `color` | PaletteColor | No       | `"accent"` | Default bar color           |

### Bar Object

| Prop    | Type         | Required | Description             |
| ------- | ------------ | -------- | ----------------------- |
| `label` | string       | Yes      | Bar label. Max 40 chars |
| `value` | number       | Yes      | Bar value (≥ 0)         |
| `color` | PaletteColor | No       | Per-bar color override  |

```json
{
  "type": "bar_chart",
  "props": {
    "bars": [
      { "label": "Poblano", "value": 42 },
      { "label": "Negro", "value": 38 },
      { "label": "Verde", "value": 15, "color": "green" }
    ]
  }
}
```

---

## cell_grid

Grid of colored cells for pixel art, game boards, color pickers, and small data
matrices. Cells are defined sparsely — only specify cells that have color or content.

There are two interaction modes, and they are mutually exclusive:

1. **Press to act** — leave `select` at `"off"` and bind `on.press`. Each press writes the
   pressed cell's `value` (or `"row,col"` if no `value` is set) to `inputs[name]` and fires
   the bound action (e.g. `submit`). No selection ring; cells behave like a grid of buttons.
2. **Press to select** — set `select: "single"` or `"multiple"`. Each press accumulates
   selection state with a visual ring; nothing is posted. Pair with a separate `button`
   that submits the accumulated selection. Multi-select joins values with `|`.

Don't combine `on.press` with a non-`"off"` `select` mode — the auto-fire would defeat
the accumulating selection. The component ignores `on.press` whenever `select` is on.

[Interactive preview on docs site]

| Prop        | Type     | Required | Default      | Description                                                         |
| ----------- | -------- | -------- | ------------ | ------------------------------------------------------------------- |
| `name`      | string   | No       | `"grid_tap"` | POST inputs key for the tapped or selected cells                    |
| `cols`      | number   | Yes      |              | Column count (2–32)                                                 |
| `rows`      | number   | Yes      |              | Row count (2–16)                                                    |
| `cells`     | object[] | Yes      |              | Sparse cell definitions (see below)                                 |
| `gap`       | string   | No       | `"sm"`       | Cell spacing: `"none"` (0px) `"sm"` (1px) `"md"` (2px) `"lg"` (4px) |
| `rowHeight` | number   | No       | `28`         | Pixel height per row (8–64). Grid height = rows × rowHeight         |
| `select`    | string   | No       | `"off"`      | Selection mode: `"off"` (use with `on.press`) `"single"` `"multiple"` |

### Events

| Event | Fires when                                                                 |
| ----- | -------------------------------------------------------------------------- |
| `press` | A cell is pressed, **only when `select` is `"off"`**. `inputs[name]` is set to the pressed cell's `value` (or `"row,col"` if no `value` is set) before the action runs, so a bound `submit` POST includes the pressed cell. |

### Cell Object

| Prop      | Type         | Required | Description            |
| --------- | ------------ | -------- | ---------------------- |
| `row`     | number       | Yes      | Row index (0-based)    |
| `col`     | number       | Yes      | Column index (0-based) |
| `color`   | PaletteColor or `#rrggbb` | No       | Cell fill color (hex is independent of page accent) |
| `content` | string       | No       | Cell text content      |
| `value`   | string       | No       | POST value when this cell is pressed/selected (1–30 chars). When omitted, `"row,col"` is used. Use this for grids whose cells carry meaningful labels (calendar days, alphabet pickers, region maps) so action handlers don't need to reverse-lookup row/col. |

**Press to act** — `select: "off"` (default) + `on.press`. Each press fires immediately:

```json
{
  "type": "cell_grid",
  "props": {
    "name": "color_grid",
    "cols": 4,
    "rows": 4,
    "cells": [
      { "row": 0, "col": 0, "color": "red" },
      { "row": 0, "col": 3, "color": "blue" }
    ]
  },
  "on": {
    "press": { "action": "submit", "params": { "target": "https://my-snap.com/" } }
  }
}
```

**Press to select** — `select: "single"` or `"multiple"`. Presses update the selection
without posting; pair with a `button` that submits when the user is done:

```json
{
  "type": "cell_grid",
  "props": {
    "cols": 4,
    "rows": 4,
    "cells": [
      { "row": 0, "col": 0, "color": "red" },
      { "row": 0, "col": 3, "color": "blue" },
      { "row": 1, "col": 1, "color": "green", "content": "X" },
      { "row": 3, "col": 3, "color": "purple" }
    ],
    "select": "multiple"
  }
}
```

**Value-bearing cells** — when each cell represents a meaningful label (a calendar
day, an alphabet letter, a region code), set `value` to keep the action handler
clean. The handler receives the value directly instead of having to translate
`"row,col"` back into a label:

```json
{
  "type": "cell_grid",
  "props": {
    "name": "day",
    "cols": 7,
    "rows": 5,
    "cells": [
      { "row": 0, "col": 0, "value": "1", "content": "1" },
      { "row": 0, "col": 1, "value": "2", "content": "2" },
      { "row": 0, "col": 2, "value": "3", "content": "3" }
    ]
  },
  "on": {
    "press": { "action": "submit", "params": { "target": "https://my-snap.com/" } }
  }
}
```

The POST handler reads `inputs.day` as `"3"` directly — no row/col math.

---

## input

Text or number input field for short free-text entry. Set `type: "number"` for numeric
input (changes the mobile keyboard). Always provide a `label` for accessibility. Value
is collected in POST inputs under `name`.

[Interactive preview on docs site]

| Prop           | Type   | Required | Default  | Description                          |
| -------------- | ------ | -------- | -------- | ------------------------------------ |
| `name`         | string | Yes      |          | Input name (POST inputs key)         |
| `type`         | string | No       | `"text"` | `"text"` or `"number"`               |
| `label`        | string | No       |          | Label text above input. Max 60 chars |
| `placeholder`  | string | No       |          | Placeholder text. Max 60 chars       |
| `defaultValue` | string | No       |          | Pre-filled value                     |
| `maxLength`    | number | No       |          | Max character count (1–280)          |

POST value: string.

```json
{
  "type": "input",
  "props": { "name": "email", "label": "Email", "placeholder": "you@example.com" }
}
```

---

## slider

Numeric range slider for bounded choices like ratings, quantities, or percentages.
Always set meaningful `min`/`max` values and add a `label` so users know what they're
adjusting. Value is collected in POST inputs under `name`.

[Interactive preview on docs site]

| Prop           | Type    | Required | Default  | Description                                 |
| -------------- | ------- | -------- | -------- | ------------------------------------------- |
| `name`         | string  | Yes      |          | Slider name (POST inputs key)               |
| `min`          | number  | Yes      |          | Minimum value (must be ≤ max)               |
| `max`          | number  | Yes      |          | Maximum value (must be ≥ min)               |
| `step`         | number  | No       | `1`      | Increment step (must be > 0, finite)        |
| `defaultValue` | number  | No       | midpoint | Initial value (must be between min and max) |
| `label`        | string  | No       |          | Label text above slider. Max 60 chars       |
| `showValue`    | boolean | No       | `false`  | Display the current value next to the label |

POST value: number.

```json
{
  "type": "slider",
  "props": {
    "name": "rating",
    "label": "Rating (1–10)",
    "min": 1,
    "max": 10,
    "showValue": true
  }
}
```

---

## switch

Boolean toggle for binary preferences (on/off, yes/no). Good for settings-style pages —
the label should describe the enabled state ("Enable notifications", not "Notifications
toggle"). Value is collected in POST inputs under `name`.

[Interactive preview on docs site]

| Prop             | Type    | Required | Default | Description                                |
| ---------------- | ------- | -------- | ------- | ------------------------------------------ |
| `name`           | string  | Yes      |         | Switch name (POST inputs key)              |
| `label`          | string  | No       |         | Label text beside the switch. Max 60 chars |
| `defaultChecked` | boolean | No       | `false` | Initial checked state                      |

POST value: boolean.

```json
{
  "type": "switch",
  "props": { "name": "notifications", "label": "Enable notifications" }
}
```

---

## toggle_group

Choice group for selecting between 2-6 discrete options. Prefer this over multiple
buttons when the choices are parallel and exclusive. Use `multiple: true` for
multi-select scenarios like tags or interests. Value is collected in POST inputs under
`name`.

[Interactive preview on docs site]

| Prop           | Type               | Required | Default        | Description                                    |
| -------------- | ------------------ | -------- | -------------- | ---------------------------------------------- |
| `name`         | string             | Yes      |                | Group name (POST inputs key)                   |
| `options`      | string[]           | Yes      |                | Choice labels. Min 2, max 6. Each max 30 chars |
| `multiple`     | boolean            | No       | `false`        | Allow multiple selections                      |
| `orientation`  | string             | No       | `"horizontal"` | `"horizontal"` or `"vertical"`                 |
| `defaultValue` | string or string[] | No       |                | Pre-selected option(s)                         |
| `variant`      | string             | No       | `"default"`    | `"default"` (solid) or `"outline"` (bordered)  |
| `label`        | string             | No       |                | Label text above the group. Max 60 chars       |

POST value: the selected option string (or string[] when `multiple` is `true`).

```json
{
  "type": "toggle_group",
  "props": {
    "name": "plan",
    "label": "Choose a plan",
    "options": ["Free", "Pro", "Team"]
  }
}
```

```json
{
  "type": "toggle_group",
  "props": {
    "name": "interests",
    "label": "Select interests",
    "multiple": true,
    "orientation": "vertical",
    "options": ["Dev", "Design", "Data", "Product"]
  }
}
```

---

## Buttons

# Buttons

Buttons are `button` components in `ui.elements`. They are not a separate top-level
array — they are elements like any other, placed wherever makes sense in the layout.

A button fires an action when tapped. Actions are bound via the `on.press` field. See
[Actions](/snap/actions) for the full list.

[Interactive preview on docs site]

```json
"submit-btn": {
  "type": "button",
  "props": { "label": "Submit", "variant": "primary" },
  "on": {
    "press": {
      "action": "submit",
      "params": { "target": "https://my-snap.com/vote" }
    }
  }
}
```

## Button Properties

| Prop      | Type     | Required | Default       | Description                                       |
| --------- | -------- | -------- | ------------- | ------------------------------------------------- |
| `label`   | string   | Yes      |               | Button text. Max 30 chars                         |
| `variant` | string   | No       | `"secondary"` | Visual style (see below)                          |
| `icon`    | IconName | No       |               | Leading icon. See [icon set](/snap/elements#icon) |

### Variants

| Variant     | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `primary`   | Solid accent background, white text — use for the primary CTA |
| `secondary` | Accent-colored border, transparent fill                       |

## Button Layout

Place buttons inside a `stack` component. Use `direction: "horizontal"` for a row of
buttons, or the default `"vertical"` for a stacked column.

```json
"actions": {
  "type": "stack",
  "props": { "direction": "horizontal", "gap": "sm" },
  "children": ["btn-yes", "btn-no"]
},
"btn-yes": {
  "type": "button",
  "props": { "label": "Yes", "variant": "primary" },
  "on": { "press": { "action": "submit", "params": { "target": "https://my-snap.com/yes" } } }
},
"btn-no": {
  "type": "button",
  "props": { "label": "No" },
  "on": { "press": { "action": "submit", "params": { "target": "https://my-snap.com/no" } } }
}
```

## Action Types

The four most common actions on buttons:

| Action          | Behavior                                                        |
| --------------- | --------------------------------------------------------------- |
| `submit`        | POST to the snap server, receive the next page                  |
| `open_url`      | Open a URL in the browser                                       |
| `open_mini_app` | Open a URL as a Farcaster mini app                              |
| client actions  | `view_cast`, `view_profile`, `compose_cast`, `send_token`, etc. |

See [Actions](/snap/actions) for parameters and examples for each type.

## Target URLs

For `submit`, `open_url`, and `open_mini_app`, `params.target` is an HTTPS URL in
production.

For local development, `http://` is valid only when the host is loopback: `localhost`,
`127.0.0.1`, or IPv6 loopback (`[::1]` / `::1`).

## Input Data in POST Requests

When a `submit` action fires, the client collects values from all field components on
the current page and includes them in the POST body under `inputs`.

| Component                 | POST value |
| ------------------------- | ---------- |
| `input`                   | string     |
| `slider`                  | number     |
| `switch`                  | boolean    |
| `toggle_group` (single)   | string     |
| `toggle_group` (multiple) | string[]   |

Field components without a user interaction are included with their default values.

Each `submit` button specifies a **target URL**; the client POSTs to that URL, so
multiple buttons are distinguished by different targets (for example `?action=save` vs
`?action=cancel`), not by a separate index field.

```json
{
  "fid": 12345,
  "inputs": {
    "username": "alice",
    "rating": 7,
    "notifications": true,
    "plan": "Pro"
  },
  "timestamp": 1717200000,
  "audience": "https://my-snap.example.com",
  "user": {
    "fid": 12345
  },
  "surface": {
    "type": "standalone"
  }
}
```

Set `surface.type` as appropriate. See [Surfaces](/snap/surfaces).

---

## Surfaces

# Surfaces

The `surface` field in the payload describes where the user interaction happened — for
example in the feed on a cast, or outside cast context.

Clients MUST include `surface` on every authenticated `submit` (see
[Actions — submit](/snap/actions#submit)).

## Discriminated shape

`surface` is a discriminated object on `type`:

| `surface.type` | Meaning                                                   |
| -------------- | --------------------------------------------------------- |
| `standalone`   | not tied to a specific cast (e.g. opened in an emulator). |
| `cast`         | interaction in a cast context                             |

### Standalone

```json
"surface": {
  "type": "standalone"
}
```

### Cast

```json
"surface": {
  "type": "cast",
  "cast": {
    "hash": "0xb79dbbc1a9f31365f8c4f722c4a6c5a6b7c8d9e0",
    "author": {
      "fid": 67890
    }
  }
}
```

## Client integration

For a client-side upgrade checklist and TypeScript-oriented examples, see
[Upgrading from v1.0 (clients)](/snap/client-upgrade).

---

## Effects

# Effects

Effects are page-level overlays that fire when a page is rendered. They trigger on both
the initial load (GET) and after `submit` responses.

## Available Effects

| Effect | Behavior |
| --- | --- |
| `confetti` | One-time shower of confetti particles falling from the top of the snap |
| `fireworks` | Staggered radial bursts that explode outward from random positions |

Effects fire once per page render. If a `submit` action returns the same page with
`"effects": ["confetti"]`, the confetti fires again. They do not repeat on client-side
re-renders of the same page.

## Preview

[Interactive preview on docs site]

## Usage

Add the `effects` array at the top level of the snap response:

```json
{
  "version": "2.0",
  "effects": ["confetti"],
  "ui": {
    "root": "page",
    "elements": {
      "page": {
        "type": "stack",
        "props": { "gap": "md" },
        "children": ["title", "body"]
      },
      "title": {
        "type": "text",
        "props": { "content": "You won!", "weight": "bold", "align": "center" }
      },
      "body": {
        "type": "text",
        "props": {
          "content": "Congratulations on completing the challenge!",
          "align": "center"
        }
      }
    }
  }
}
```

## When to Use Effects

Effects are best for:

- **Celebrations** — completing a challenge, winning a game
- **Milestones** — reaching a streak, hitting a follower count
- **Completion states** — finishing a multi-page flow

Use effects sparingly. They are most impactful when unexpected and earned, not when they
appear on every page transition.

---

## Theme & Styling

# Theme & Styling

Snaps specify only an accent color. The client handles all other styling, including
light/dark mode from app settings.

## How Theming Works

The snap provides a single `theme.accent` color. The Farcaster client uses this accent to style interactive elements, then derives everything else -- backgrounds, text colors, borders, spacing -- from its own design system and the user's current light/dark mode preference.

```json
{
  "version": "2.0",
  "theme": { "accent": "purple" },
  "ui": {
    "root": "page",
    "elements": {
      "page": { "type": "stack", "props": {}, "children": ["title"] },
      "title": { "type": "text", "props": { "content": "My Snap", "weight": "bold" } }
    }
  }
}
```

### Theme Properties

| Property       | Required | Values                                                                                                     |
| -------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `theme`        | No       | Theme object. If omitted, defaults apply                                                                   |
| `theme.accent` | No       | Palette color name: `gray`, `blue`, `red`, `amber`, `green`, `teal`, `purple`, `pink`. Default: `"purple"` |

### Accent Color Palette

| Color | Light | Dark |
|-------|-------|------|
| `gray` | [Interactive preview on docs site] `#6E6A86` | [Interactive preview on docs site] `#908CAA` |
| `blue` | [Interactive preview on docs site] `#286983` | [Interactive preview on docs site] `#9CCFD8` |
| `red` | [Interactive preview on docs site] `#B4637A` | [Interactive preview on docs site] `#EB6F92` |
| `amber` | [Interactive preview on docs site] `#EA9D34` | [Interactive preview on docs site] `#F6C177` |
| `green` | [Interactive preview on docs site] `#3E8F8F` | [Interactive preview on docs site] `#56D4A4` |
| `teal` | [Interactive preview on docs site] `#56949F` | [Interactive preview on docs site] `#3E8FB0` |
| `purple` | [Interactive preview on docs site] `#907AA9` | [Interactive preview on docs site] `#C4A7E7` |
| `pink` | [Interactive preview on docs site] `#D7827E` | [Interactive preview on docs site] `#EBBCBA` |

## Accent Surfaces

The accent color is used for:

- Primary button fill
- Progress bar fill (unless overridden by `color`)
- Slider active track and thumb
- Button group selected option highlight
- Toggle active state fill
- Interactive grid tap highlight

## What Snaps Cannot Control

Snaps intentionally have no control over visual details. This keeps snaps consistent within the Farcaster feed and prevents visual clutter.

Snaps **cannot** specify:

- Font family, font size, or font weight
- Padding, margins, or spacing
- Border radius, shadows, or decorative styling
- Custom CSS or inline styles
- Background colors on individual elements (except grid cells)
- Element pixel dimensions
- Light/dark mode

The client is responsible for all layout decisions — spacing between elements, card
padding, font rendering, and responsive behavior — so snaps look native in every
Farcaster client.

---

## Color Palette

# Color Palette

All colors in snaps (accent, progress bar, bar chart) are specified as **named palette
colors**, not hex values. The client maps each name to a hex value appropriate for its
current light/dark mode. This ensures visual consistency across the feed and guarantees
readability in both modes.

The palette has 8 colors:

| Name | Light | Dark |
| -------- | --------- | --------- |
| `gray` | [Interactive preview on docs site] `#6E6A86` | [Interactive preview on docs site] `#908CAA` |
| `blue` | [Interactive preview on docs site] `#286983` | [Interactive preview on docs site] `#9CCFD8` |
| `red` | [Interactive preview on docs site] `#B4637A` | [Interactive preview on docs site] `#EB6F92` |
| `amber` | [Interactive preview on docs site] `#EA9D34` | [Interactive preview on docs site] `#F6C177` |
| `green` | [Interactive preview on docs site] `#3E8F8F` | [Interactive preview on docs site] `#56D4A4` |
| `teal` | [Interactive preview on docs site] `#56949F` | [Interactive preview on docs site] `#3E8FB0` |
| `purple` | [Interactive preview on docs site] `#907AA9` | [Interactive preview on docs site] `#C4A7E7` |
| `pink` | [Interactive preview on docs site] `#D7827E` | [Interactive preview on docs site] `#EBBCBA` |

The snap specifies a name (e.g. `"blue"`). The client resolves it to the correct hex for
the current mode.

## Where Palette Colors Are Used

**`page.theme.accent`** — one of the 8 palette names (default: `"purple"`).

```json
{
  "theme": { "accent": "blue" }
}
```

**`progress.color`** — `"accent"` (uses theme accent) or any palette name.

```json
{ "type": "progress", "value": 72, "max": 100, "color": "green" }
```

**`bar_chart.color`** — `"accent"` or any palette name (default bar fill).

**`bar_chart.bars[].color`** — any palette name (per-bar override).

**Exception:** `grid.cells[].color` accepts free hex (`#RRGGBB`). Games and pixel
canvases need arbitrary colors for content like Wordle tiles and pixel art.

```json
{
  "type": "bar_chart",
  "bars": [
    { "label": "Yes", "value": 62, "color": "green" },
    { "label": "No", "value": 38, "color": "red" }
  ]
}
```

Where the accent color appears on UI surfaces is documented on
[Theme & Styling](/snap/theme#accent-surfaces).

## Grid Cell Colors (Exception)

Each cell can specify an arbitrary hex color via `cells[].color` (see exception above).
This is necessary for game boards, pixel art, and other visual applications where the
color IS the content.

```json
{
  "type": "cell_grid",
  "cols": 5,
  "rows": 6,
  "cells": [
    { "row": 0, "col": 0, "color": "#22C55E", "content": "C" },
    { "row": 0, "col": 1, "color": "#6B7280", "content": "R" },
    { "row": 0, "col": 2, "color": "#CA8A04", "content": "A" }
  ]
}
```

Global styling limits (fonts, spacing, light/dark mode, etc.) are on
[Theme & Styling](/snap/theme#snaps-cannot-specify).

---

## Actions

# Actions

Actions are bound to elements via the `on` field. Buttons use `on.press` to trigger an
action when tapped.

```json
"my-button": {
  "type": "button",
  "props": { "label": "Go" },
  "on": {
    "press": {
      "action": "submit",
      "params": { "target": "https://my-snap.com/" }
    }
  }
}
```

| Action                          | Description                   |
| ------------------------------- | ----------------------------- |
| [submit](#submit)               | POST to server, get next page |
| [open_url](#open_url)           | Open external URL in browser  |
| [open_snap](#open_snap)         | Open a snap URL inline        |
| [open_mini_app](#open_mini_app) | Launch mini app               |
| [view_cast](#view_cast)         | Navigate to a cast            |
| [view_profile](#view_profile)   | Navigate to a profile         |
| [compose_cast](#compose_cast)   | Open cast composer            |
| [view_token](#view_token)       | View token in wallet          |
| [send_token](#send_token)       | Open send token flow          |
| [swap_token](#swap_token)       | Open swap token flow          |

---

## submit

POST to the snap server with a signed payload containing the user's FID, all collected
field input values, and a timestamp. The server returns the next snap page.

This is the primary interaction mechanism — how snaps navigate between pages. It is the
only action that triggers a server round-trip.

| Param    | Type   | Required | Description                                         |
| -------- | ------ | -------- | --------------------------------------------------- |
| `target` | string | Yes      | URL to POST to (HTTPS, or http://localhost for dev) |

```json
{
  "type": "button",
  "props": { "label": "Submit", "variant": "primary" },
  "on": {
    "press": {
      "action": "submit",
      "params": { "target": "https://my-snap.com/api/vote" }
    }
  }
}
```

See [Buttons — Input Data in POST Requests](/snap/buttons#input-data-in-post-requests)
for the full payload shape, and [Surfaces](/snap/surfaces) for the required `surface`
field (`standalone` vs `cast`).

---

## open_url

Open a URL in the system browser. No server round-trip. No input collection.

| Param    | Type   | Required | Description |
| -------- | ------ | -------- | ----------- |
| `target` | string | Yes      | URL to open |

```json
{
  "type": "button",
  "props": { "label": "Learn More", "icon": "external-link" },
  "on": {
    "press": {
      "action": "open_url",
      "params": { "target": "https://docs.farcaster.xyz/snap" }
    }
  }
}
```

---

## open_snap

Open a snap URL inline. Unlike `open_url`, the client renders the target as a snap
rather than opening a browser. Use this when linking to another snap from a button.

| Param    | Type   | Required | Description      |
| -------- | ------ | -------- | ---------------- |
| `target` | string | Yes      | Snap URL to open |

```json
{
  "type": "button",
  "props": { "label": "View Poll" },
  "on": {
    "press": {
      "action": "open_snap",
      "params": { "target": "https://poll.example.com/" }
    }
  }
}
```

---

## open_mini_app

Open a URL as an in-app Farcaster mini app.

| Param    | Type   | Required | Description  |
| -------- | ------ | -------- | ------------ |
| `target` | string | Yes      | Mini app URL |

```json
{
  "type": "button",
  "props": { "label": "Open App", "icon": "arrow-right" },
  "on": {
    "press": {
      "action": "open_mini_app",
      "params": { "target": "https://my-miniapp.com" }
    }
  }
}
```

---

## view_cast

Navigate to a cast by its hash.

| Param  | Type   | Required | Description                      |
| ------ | ------ | -------- | -------------------------------- |
| `hash` | string | Yes      | Cast hash (e.g. `"0xabc123..."`) |

```json
{
  "type": "button",
  "props": { "label": "View Cast" },
  "on": {
    "press": {
      "action": "view_cast",
      "params": { "hash": "0x0000000000000000000000000000000000000001" }
    }
  }
}
```

---

## view_profile

Navigate to a Farcaster user's profile.

| Param | Type   | Required | Description       |
| ----- | ------ | -------- | ----------------- |
| `fid` | number | Yes      | Farcaster user ID |

```json
{
  "type": "button",
  "props": { "label": "View Profile", "icon": "user" },
  "on": {
    "press": {
      "action": "view_profile",
      "params": { "fid": 3 }
    }
  }
}
```

---

## compose_cast

Open the cast composer with optional pre-filled content.

| Param        | Type     | Required | Description               |
| ------------ | -------- | -------- | ------------------------- |
| `text`       | string   | No       | Pre-filled cast text      |
| `channelKey` | string   | No       | Target channel key        |
| `embeds`     | string[] | No       | URLs to embed in the cast |

> Put URLs in `embeds`, not in `text`.

```json
{
  "type": "button",
  "props": { "label": "Share", "icon": "share" },
  "on": {
    "press": {
      "action": "compose_cast",
      "params": {
        "text": "Check out this snap!",
        "embeds": ["https://my-snap.com"]
      }
    }
  }
}
```

---

## view_token

View a token in the wallet. The token is identified by a
[CAIP-19](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-19.md) asset
identifier.

| Param   | Type   | Required | Description              |
| ------- | ------ | -------- | ------------------------ |
| `token` | string | Yes      | CAIP-19 token identifier |

```json
{
  "type": "button",
  "props": { "label": "View Token", "icon": "wallet" },
  "on": {
    "press": {
      "action": "view_token",
      "params": {
        "token": "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
      }
    }
  }
}
```

---

## send_token

Open the send flow for a token.

| Param              | Type   | Required | Description                     |
| ------------------ | ------ | -------- | ------------------------------- |
| `token`            | string | Yes      | CAIP-19 token identifier        |
| `amount`           | string | No       | Pre-filled amount               |
| `recipientFid`     | number | No       | Recipient identified by FID     |
| `recipientAddress` | string | No       | Recipient identified by address |

```json
{
  "type": "button",
  "props": { "label": "Send USDC", "icon": "coins" },
  "on": {
    "press": {
      "action": "send_token",
      "params": {
        "token": "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "amount": "10.00",
        "recipientFid": 3
      }
    }
  }
}
```

---

## swap_token

Open the swap flow between two tokens.

| Param       | Type   | Required | Description                              |
| ----------- | ------ | -------- | ---------------------------------------- |
| `sellToken` | string | No       | CAIP-19 identifier for the token to sell |
| `buyToken`  | string | No       | CAIP-19 identifier for the token to buy  |

```json
{
  "type": "button",
  "props": { "label": "Swap to USDC", "icon": "refresh-cw" },
  "on": {
    "press": {
      "action": "swap_token",
      "params": {
        "sellToken": "eip155:8453/slip44:60",
        "buyToken": "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
      }
    }
  }
}
```

---

## Constraints

# Constraints

Component-level constraints enforced by the json-render catalog. Violating these causes
validation to fail and the snap to not render.

## Component Constraints

| Component      | Prop           | Constraint                            |
| -------------- | -------------- | ------------------------------------- |
| `badge`        | `label`        | Min 1, max 30 chars                   |
| `button`       | `label`        | Min 1, max 30 chars                   |
| `item`         | `title`        | Min 1, max 100 chars                  |
| `item`         | `description`  | Max 160 chars                         |
| `progress`     | `value`        | Finite number, 0 to `max`             |
| `progress`     | `max`          | Finite number > 0                     |
| `progress`     | `label`        | Max 60 chars                          |
| `text`         | `content`      | Min 1, max 320 chars                  |
| `input`        | `name`         | Min 1 char                            |
| `input`        | `maxLength`    | 1 to 280                              |
| `input`        | `label`        | Max 60 chars                          |
| `input`        | `placeholder`  | Max 60 chars                          |
| `slider`       | `min`          | Must be ≤ `max`                       |
| `slider`       | `max`          | Must be ≥ `min`                       |
| `slider`       | `step`         | Finite number > 0                     |
| `slider`       | `defaultValue` | Must be between `min` and `max`       |
| `slider`       | `label`        | Max 60 chars                          |
| `switch`       | `name`         | Min 1 char                            |
| `switch`       | `label`        | Max 60 chars                          |
| `toggle_group` | `options`      | Min 2, max 6 items. Each max 30 chars |
| `toggle_group` | `label`        | Max 60 chars                          |
| `image`        | `url`          | HTTPS URL                             |
| `bar_chart`    | `bars`         | Min 1, max 6 items                    |
| `bar_chart`    | `bars[].label` | Min 1, max 40 chars                   |
| `bar_chart`    | `bars[].value` | Must not exceed `max` (if set)        |
| `cell_grid`    | `cols`         | 2 to 32                               |
| `cell_grid`    | `rows`         | 2 to 16                               |
| `cell_grid`    | `cells[].row`  | 0 to `rows - 1`                       |
| `cell_grid`    | `cells[].col`  | 0 to `cols - 1`                       |
| `cell_grid`    | `cells[].color`| Palette color name or `#rrggbb` hex   |
| `cell_grid`    | `rowHeight`    | 8 to 64                               |

## Structural Constraints

Snap UI trees are limited to prevent endlessly tall or overly complex snaps from
rendering in clients.

| Constraint           | Limit                                                             |
| -------------------- | ----------------------------------------------------------------- |
| Total elements       | Max **64** elements in `ui.elements`                              |
| Root children        | Max **7** children on the root element                            |
| Children per element | Max **6** children per non-root container (`stack`, `item_group`) |
| Nesting depth        | Max **5** levels from root to deepest leaf                        |

Exceeding any of these limits causes validation to fail and the snap to not render.

## Response Constraints

| Constraint            | Limit                                              |
| --------------------- | -------------------------------------------------- |
| `version`             | Must be `"2.0"`                                    |
| `theme.accent`        | Must be a named palette color                      |
| `ui.root`             | Must be an ID present in `ui.elements`             |
| `submit` target URL   | HTTPS in production; http://localhost valid in dev |
| POST response timeout | 5 seconds                                          |

## Validation

Schema validation runs at render time. If the snap response fails validation, the snap
does not render — the cast falls back to showing the URL as plain text.

### URL Validation

For `submit`, `open_url`, and `open_mini_app` actions, `params.target` must use
**HTTPS** in production. As an exception for local development and emulators,
**`http://` is allowed** when the host is loopback only: `localhost`, `127.0.0.1`, or
IPv6 loopback (`[::1]` / `::1`). Non-loopback HTTP targets are invalid.

No `javascript:` URIs.

---

## Authentication

# Authentication

Every POST request from the client to a snap server MUST be authenticated with
[JSON Farcaster Signatures](https://github.com/farcasterxyz/protocol/discussions/208)
(JFS).

GET requests MAY include viewer identity when the client sends an optional
`X-Snap-Payload` header (see [Authenticated GETs](#authenticated-gets)). Authentication
on GET is optional and best-effort: servers SHOULD support anonymous GET requests when
the header is absent.

## How It Works

When a user taps a `post` button, the Farcaster client:

1. Collects all input values from the current page
2. Builds a payload with the user's identity (user.fid), timestamp, audience, and other
   payload fields that are unrelated to authentication.
3. Signs the payload using the user's Farcaster signer key
4. Sends the signed JFS compact string as the POST body

The snap server then:

1. Verifies the JFS signature cryptographically
2. Checks the signing key against hub state for the claimed FID
3. Validates that `audience` matches the server's origin
4. Validates `timestamp` for replay protection
5. Processes the request and returns a new page

## JFS Payload Shape

The decoded JFS payload (signed inside JFS, not sent as bare JSON):

```json
{
  "fid": 12345,
  "inputs": {
    "guess": "CLASS",
    "vote": "Tabs"
  },
  "timestamp": 1710864000,
  "audience": "https://snap.example.com",
  "user": {
    "fid": 12345
  },
  "surface": {
    "type": "standalone"
  }
}
```

## Audience

The payload MUST contain an `audience` field set to the origin of the snap server the
request is intended for. Origin = scheme + host + port (port only needed if it is not
the default port for that scheme)

Servers MUST reject requests where `audience` does not match the server's own origin.
This prevents a signed payload meant for one snap from being replayed against a
different snap server.

## Replay protection

The payload MUST contain a `timestamp` field (Unix seconds).

Servers MUST reject requests with timestamps outside an allowed skew (default 5
minutes).

If strict replay protection is needed beyond that, clients should add a `nonce` field
(unique per request) to the signed payload.

## Authenticated GETs

Clients MAY attach a JFS payload to snap GET requests using the `X-Snap-Payload` request
header. The value uses the compact JFS form:

```
X-Snap-Payload: BASE64URL(header).BASE64URL(payload).BASE64URL(signature)
```

- Sending this header on GET requests is optional. Snaps that do not send
  `X-Snap-Payload`.
- If the header is present, servers MUST reject a malformed, expired, or invalid values
  with a 4xx response.
- When a response depends on `action.user` (or other viewer-specific data), the server
  SHOULD send `Cache-Control: private` or a short `max-age` together with
  `Vary: X-Snap-Payload` so personalized responses are not shared incorrectly between
  viewers. See [HTTP Headers](/snap/http-headers).

### `action.user` on GET is never guaranteed

Servers MUST NOT depend on receiving a viewer FID on a GET. Each GET is an independent
request, and `X-Snap-Payload` may be absent for any number of reasons. Design every snap
so that anonymous GETs work and make sense. Treat `action.user` on GET as a strict
enhancement: when present, you may personalize; when absent, render a working signed-out
experience.

## Requirements

- The client MUST send a valid JFS for every authenticated POST
- The client MUST include the user's FID, `audience` (server origin) and `timestamp`
  (Unix seconds) in every payload
- The server MUST verify the JFS cryptographically and MUST verify the signing key
  against hub (or equivalent) state for the FID
- The server MUST verify that `audience` matches its own origin
- The server MUST enforce timestamp skew checks

## JSON Farcaster Signatures (JFS) Format

JFS is a standardized way for Farcaster identities to sign arbitrary payloads. It
consists of three components:

1. **Header** — metadata (FID, key type, key)
2. **Payload** — the content being signed
3. **Signature** — the cryptographic signature

### Compact Serialization

JFS uses a dot-separated format similar to JWT:

```
BASE64URL(header) . BASE64URL(payload) . BASE64URL(signature)
```

The signing input is constructed as:

```
ASCII(BASE64URL(UTF8(Header)) || '.' || BASE64URL(Payload))
```

### Key Types

JFS supports three key types:

| Type      | Signature Method | Description                              |
| --------- | ---------------- | ---------------------------------------- |
| `custody` | ERC-191          | Signature from the FID's custody address |
| `auth`    | ERC-191          | Signature from a registered auth address |
| `app_key` | EdDSA            | Signature from a registered App Key      |

For snaps, the client typically uses `app_key` (EdDSA signature from the user's
registered signer key).

### Verification

To verify a JFS:

1. Decode the header and extract the `fid`, `type`, and `key`
2. Verify the FID is registered and the key is active for that FID
3. Verify the signature matches the signing input using the declared key
4. Query a Farcaster Hub to confirm the key is currently associated with the FID

### Reference Implementation

The official JFS Node.js package is
[`@farcaster/jfs`](https://github.com/farcasterxyz/auth-monorepo).

## Server-Side Verification with @farcaster/snap-hono

The `@farcaster/snap-hono` package handles JFS verification automatically:

```typescript
import { registerSnapHandler } from "@farcaster/snap-hono";

registerSnapHandler(
  app,
  async (ctx) => {
    // On POST: ctx.action.user.fid is verified — the JFS signature was checked
    // ctx.action.inputs contains the user's input values
    // On GET: if (ctx.action.user) { … } for optional viewer-aware first loads (X-Snap-Payload)
    // Distinguish buttons via distinct submit target URLs on each button (ctx.request.url)
  },
  {
    skipJFSVerification: false, // set to `true` for local dev
  },
);
```

Set `SKIP_JFS_VERIFICATION=1` in your environment to skip JFS verification for local
development.

---

## Overview

# Building a Farcaster Client with Snaps

This section is for developers building a Farcaster client that wants to display and
interact with snaps. If you're building a snap server, see the [Learn](/snap/building)
section instead.

## What Clients Do

A Farcaster client is responsible for:

1. **Fetching** snap JSON from a URL via content negotiation
2. **Rendering** the snap UI from the JSON response
3. **Handling interactions** — when a user taps a button, the client builds a signed
   POST payload and sends it to the snap server
4. **Displaying the response** — the server returns a new snap page, and the client
   renders it

## Package

The `@farcaster/snap` package provides everything a client needs:

- **React and React Native components** for rendering snap UI (`SnapCard`)
- **Type definitions** for snap pages, actions, and handlers
- **Payload encoding** utilities for building POST requests

```bash
pnpm add @farcaster/snap
```

## Guides

- [Rendering Snaps](/snap/client-rendering) — how to fetch, render, and handle snap
  interactions using `SnapCard`
- [Upgrading from v1.0](/snap/client-upgrade) — breaking changes between v1 and v2
  that clients must handle, including the v2 POST payload format and fallback behavior
  for older servers

---

## Rendering Snaps

# Rendering Snaps

This guide covers how to fetch, render, and interact with snap content using the
`@farcaster/snap` package.

## Fetching Snaps

Request snap JSON by sending an `Accept` header with the snap media type:

```typescript
const response = await fetch(snapUrl, {
  headers: {
    Accept: "application/vnd.farcaster.snap+json",
  },
});

const snap = await response.json();
```

If the server supports snaps, it returns JSON with `version`, `theme`, and `ui` fields.
If not, it returns its normal HTML response.

## SnapCard Component

`SnapCard` is the primary component for rendering a snap. It handles version detection,
validation, and rendering automatically.

### React (Web)

```tsx
import { SnapCard } from "@farcaster/snap/react";
import type { SnapPage, SnapActionHandlers } from "@farcaster/snap/react";
```

### React Native

```tsx
import { SnapCard } from "@farcaster/snap/react-native";
import type { SnapPage, SnapActionHandlers } from "@farcaster/snap/react-native";
```

The React Native `SnapCard` accepts the same props plus optional `colors` and
`borderRadius` for native styling.

### Props

| Prop                      | Type                 | Default  | Description                             |
| ------------------------- | -------------------- | -------- | --------------------------------------- |
| `snap`                    | `SnapPage`           | required | The snap JSON response                  |
| `handlers`                | `SnapActionHandlers` | required | Action callbacks                        |
| `loading`                 | `boolean`            | `false`  | Show loading state                      |
| `appearance`              | `"light" \| "dark"`  | `"dark"` | Color scheme                            |
| `maxWidth`                | `number`             | `480`    | Maximum width in pixels                 |
| `showOverflowWarning`     | `boolean`            | `false`  | Show overflow indicator at 500px        |
| `actionError`             | `string \| null`     | -        | Error message to display below the snap |
| `onValidationError`       | `(result) => void`   | -        | Called when validation fails            |
| `validationErrorFallback` | `ReactNode`          | -        | Custom fallback for validation errors   |

## Action Handlers

The `handlers` prop defines how the client responds to user interactions. Every snap
action type maps to a handler function that the client must implement.

| Handler         | Params                                                   | Description                                                                                                                                          |
| --------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `submit`        | `(target: string, inputs: Record<string, value>)`        | POST signed payload to `target` with collected input values. Returns the next snap page. This is the only handler that involves a server round-trip. |
| `open_url`      | `(target: string)`                                       | Open an external URL in the system browser or in-app browser.                                                                                        |
| `open_snap`     | `(target: string)`                                       | Open a snap URL inline — render the target as a snap rather than opening a browser.                                                                  |
| `open_mini_app` | `(target: string)`                                       | Open a URL as a Farcaster mini app (in-app webview).                                                                                                 |
| `view_cast`     | `({ hash: string })`                                     | Navigate to a cast by its hash.                                                                                                                      |
| `view_profile`  | `({ fid: number })`                                      | Navigate to a user profile by Farcaster ID.                                                                                                          |
| `compose_cast`  | `({ text?, channelKey?, embeds? })`                      | Open the cast composer with optional pre-filled text, channel, and embeds.                                                                           |
| `view_token`    | `({ token: string })`                                    | View a token in the wallet. Token is a [CAIP-19](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-19.md) identifier.                      |
| `send_token`    | `({ token, amount?, recipientFid?, recipientAddress? })` | Open the send flow for a token (CAIP-19). Optional pre-filled amount and recipient.                                                                  |
| `swap_token`    | `({ sellToken?, buyToken? })`                            | Open the swap flow between two tokens (CAIP-19).                                                                                                     |

The `submit` handler is the most important — it's how snaps navigate between pages. All
input values from `input`, `slider`, `switch`, and `toggle_group` elements are
automatically collected and passed as the `inputs` parameter. See
[Upgrading from v1.0](/snap/client-upgrade) for the POST payload format.

## Full Example

This example shows the complete flow: rendering a snap, handling submit with a signed
POST, parsing the server response, and displaying errors.

```tsx
import { useState, useCallback } from "react";
import { SnapCard } from "@farcaster/snap/react";
import { encodePayload } from "@farcaster/snap/server";
import type { SnapPage, SnapActionHandlers } from "@farcaster/snap/react";

function SnapRenderer({
  initialSnap,
  snapUrl,
  user,
  castFromContext,
}: {
  initialSnap: SnapPage;
  snapUrl: string;
  user: { fid: number; signerKey: SignerKey };
  /** When the snap is shown inside a cast, pass hash + author FID for `surface`. */
  castFromContext?: { hash: string; authorFid: number };
}) {
  const [snap, setSnap] = useState(initialSnap);
  const [currentUrl, setCurrentUrl] = useState(snapUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (target: string, inputs: Record<string, unknown>) => {
      setLoading(true);
      setError(null);

      try {
        // Build the v2 payload
        const payload = {
          fid: user.fid,
          user: { fid: user.fid },
          inputs,
          timestamp: Math.floor(Date.now() / 1000),
          audience: new URL(target).origin,
          surface: castFromContext
            ? {
                type: "cast" as const,
                cast: {
                  hash: castFromContext.hash,
                  author: { fid: castFromContext.authorFid },
                },
              }
            : { type: "standalone" as const },
        };

        // Sign with JFS and send
        const body = {
          header: encodeJFSHeader(user.signerKey),
          payload: encodePayload(payload),
          signature: signPayload(payload, user.signerKey),
        };

        const res = await fetch(target, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/vnd.farcaster.snap+json",
          },
          body: JSON.stringify(body),
        });

        // Parse the response
        const json = await res.json();

        if (!res.ok) {
          // Server returns { error: string } on failure
          throw new Error(json.error ?? `Server error (${res.status})`);
        }

        // Success — render the next snap page
        setSnap(json as SnapPage);
        setCurrentUrl(target);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setLoading(false);
      }
    },
    [user, castFromContext],
  );

  const handlers: SnapActionHandlers = {
    submit: (target, inputs) => void handleSubmit(target, inputs),
    open_url: (target) => window.open(target, "_blank"),
    open_snap: (target) => navigateToSnap(target),
    open_mini_app: (target) => openMiniApp(target),
    view_cast: ({ hash }) => navigateToCast(hash),
    view_profile: ({ fid }) => navigateToProfile(fid),
    compose_cast: (params) => openComposer(params),
    view_token: ({ token }) => openTokenView(token),
    send_token: (params) => openSendFlow(params),
    swap_token: (params) => openSwapFlow(params),
  };

  return (
    <SnapCard
      snap={snap}
      handlers={handlers}
      loading={loading}
      appearance="dark"
      actionError={error}
    />
  );
}
```

### How errors flow

When a submit action fails, the error flows through to the user like this:

1. The client POSTs the signed payload to the snap server
2. The server returns a 4xx response with `{ "error": "..." }` — for example
   `{ "error": "payload audience does not match expected origin" }`
3. The client catches the error and sets it in state
4. `SnapCard` receives the error via the `actionError` prop and renders it below the
   snap content, outside the 500px clipped area so it's always visible
5. On the next successful submit, the client clears the error

Common server errors include:

- **400** — invalid payload (missing fields, validation failure)
- **401** — JFS signature verification failed
- **400** `origin_mismatch` — audience doesn't match the server origin
- **400** `replay` — timestamp outside allowed skew

## Display Guidelines

- **Width**: Snaps are designed for a fixed width of ~480px
- **Height**: Snaps clip at **500px**. Content below this is hidden
- **No client-side code execution**: Snaps are pure JSON — never execute scripts or
  inject user-provided HTML

---

## Upgrading from v1.0

# Upgrading from v1.0

This guide covers what Farcaster clients must change when upgrading from snap spec v1.0
to v2.0. Both the POST payload format and the fallback behavior have changed.

## POST Payload Changes

### New required fields: `audience`, `user`, and `surface`

v2 POST payloads must include `audience`, `user`, and `surface`:

| Field      | Type                | Description                                                    |
| ---------- | ------------------- | -------------------------------------------------------------- |
| `audience` | `string`            | Origin of the target snap server (`scheme://host`)             |
| `user`     | `{ fid: number }`   | User taking the action                                         |
| `surface`  | discriminated union | Where the interaction happens — see [Surfaces](/snap/surfaces) |

**`audience`** prevents a signed payload meant for one snap from being replayed against
a different server. Set it to `new URL(snapUrl).origin`.

The top-level **`fid`** field is deprecated in favor of `user.fid` but MUST still be
included with the same value until older integrations no longer depend on it.

### Removed: button_index

The `button_index` field is no longer included in v2 POST payloads. Snap servers now use
distinct `submit` target URLs to identify which button was pressed. Clients should set
the POST URL from the button's `on.press.params.target`.

### v2 payload example

```typescript
// When embedded in a cast, set castContext to { hash, authorFid }; otherwise undefined.
declare const castContext: { hash: string; authorFid: number } | undefined;
const payload = {
  fid: user.fid,
  user: { fid: user.fid },
  inputs: collectInputValues(),
  timestamp: Math.floor(Date.now() / 1000),
  audience: new URL(targetUrl).origin,
  surface: castContext
    ? {
        type: "cast",
        cast: {
          hash: castContext.hash,
          author: { fid: castContext.authorFid },
        },
      }
    : { type: "standalone" },
};
```

## Fallback to v1 on Failure

Not all snap servers have upgraded to v2 yet. Clients **must** handle the case where a
v2 POST fails by falling back to the v1 payload format.

The recommended flow:

1. Send the v2 payload (with `audience`, `user`, and `surface`, without `button_index`)
2. If the server returns an error (4xx), retry with a v1 payload (with `button_index`,
   without `audience` / `user` / `surface`)
3. If the retry also fails, display the error to the user

```typescript
async function submitAction(
  targetUrl: string,
  user: User,
  inputs: Record<string, unknown>,
  buttonIndex: number,
  castContext?: { hash: string; authorFid: number },
) {
  // Try v2 first
  const v2Payload = {
    fid: user.fid,
    user: { fid: user.fid },
    inputs,
    timestamp: Math.floor(Date.now() / 1000),
    audience: new URL(targetUrl).origin,
    surface: castContext
      ? {
          type: "cast" as const,
          cast: {
            hash: castContext.hash,
            author: { fid: castContext.authorFid },
          },
        }
      : { type: "standalone" as const },
  };

  let response = await sendSignedPost(targetUrl, v2Payload);

  if (!response.ok) {
    // Fall back to v1
    const v1Payload = {
      fid: user.fid,
      inputs,
      timestamp: Math.floor(Date.now() / 1000),
      button_index: buttonIndex,
    };

    response = await sendSignedPost(targetUrl, v1Payload);
  }

  if (!response.ok) {
    throw new Error(`Snap server error: ${response.status}`);
  }

  return response.json();
}
```

This fallback ensures clients work with both old (v1) and new (v2) snap servers during
the transition period.

## Structural Constraints

v2 snaps enforce structural limits on the UI tree. Clients should expect all v2 snaps to
fit within these bounds:

| Constraint             | Limit                            |
| ---------------------- | -------------------------------- |
| Total elements         | 64                               |
| Root children          | 7                                |
| Children per container | 6                                |
| Nesting depth          | 5 levels                         |
| Height                 | 500px (clip content beyond this) |

## Checklist

- [ ] Send `audience`, `user: { fid }`, and `surface` in every v2 POST (keep top-level
      `fid` equal to `user.fid` until deprecated field is removed)
- [ ] Use `surface.type: "cast"` with `cast.hash` and `cast.author` when in cast
      context; otherwise `surface.type: "standalone"`
- [ ] Remove `button_index` from v2 payloads
- [ ] Implement v1 fallback — retry with `button_index` and without v2-only fields if
      the v2 POST fails
- [ ] Clip snap rendering at 500px height
- [ ] Use the button's `target` URL as the POST destination
