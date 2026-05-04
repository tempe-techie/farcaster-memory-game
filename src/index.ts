import { join } from "node:path";
import { Hono } from "hono";
import {
  SPEC_VERSION,
  type SnapElementInput,
  type SnapFunction,
  type SnapHandlerResult,
} from "@farcaster/snap";
import { registerSnapHandler } from "@farcaster/snap-hono";

const HOME_PATH = "/";
const SNAP_PATH = "/memory-game";

const ROWS = 4;
const COLS = 4;
const CELL_COUNT = ROWS * COLS;
const PAIR_COUNT = CELL_COUNT / 2;
const ALL_MATCHED_MASK = (1 << CELL_COUNT) - 1;

const COLOR_HIDDEN = "#C4A7E7";
const COLOR_REVEALED = "#FFFFFF";
const COLOR_MISMATCH = "#EB6F92";
const COLOR_MATCHED = "#56D4A4";

const WORDS = [
  "farcaster",
  "neynar",
  "snaps",
  "rish",
  "cassie",
  "limone",
  "nouns",
  "tempe",
  "farcon",
  "beeper",
  "urbe",
  "poidh",
  "snapchain",
  "hypersnap",
  "gmfarcaster",
  "nounishprof",
  "tekrox",
  "yerbearserker",
  "noc",
  "fatty",
  "nikolaii",
  "adrienne",
  "cryptogallo",
  "justinahn",
  "arjantupan",
  "chaps",
  "yes2crypto",
  "saltorious",
  "victoctero",
  "warplets",
  "the firm",
  "rome",
  "bankr",
  "higher",
  "purple",
  "deca"
] as const;


type GameState = {
  d: string;
  w: string;
  m: number;
  r: number[];
  t0: number | null;
};

const homeSnap: SnapFunction = async (ctx) => {
  const base = snapBaseUrlFromRequest(ctx.request);

  const elements: Record<string, SnapElementInput> = {
    page: {
      type: "stack",
      props: { gap: "md" },
      children: ["welcome", "intro", "start-btn"],
    },
    welcome: {
      type: "text",
      props: {
        content: "How good is your Farcaster memory?",
        weight: "bold",
        size: "lg",
        align: "center",
      },
    },
    intro: {
      type: "text",
      props: {
        content: 'Click the "Start" button to test it out!',
        align: "center",
      },
    },
    "start-btn": {
      type: "button",
      props: { label: "Start", variant: "primary" },
      on: {
        press: {
          action: "open_snap",
          params: { target: `${base}${SNAP_PATH}` },
        },
      },
    },
  };

  return {
    version: SPEC_VERSION,
    theme: { accent: "purple" },
    ui: { root: "page", elements },
  };
};

const memoryGameSnap: SnapFunction = async (ctx) => {
  const base = snapBaseUrlFromRequest(ctx.request);
  const url = new URL(ctx.request.url);

  let state = parseState(url);

  const inputs = ctx.action.type === "post" ? ctx.action.inputs : undefined;
  const rawCell = inputs?.cell;
  const clicked = typeof rawCell === "string" ? parseCellIndex(rawCell) : null;

  if (clicked !== null) {
    state = applyClick(state, clicked, ctx.action.type === "post" ? ctx.action.timestamp : nowSeconds());
  }

  if (state.m === ALL_MATCHED_MASK) {
    const endTs = ctx.action.type === "post" ? ctx.action.timestamp : nowSeconds();
    return renderWin(base, state, endTs);
  }

  return renderGame(base, state);
};

function applyClick(state: GameState, clicked: number, ts: number): GameState {
  let { d, w, m, r, t0 } = state;

  if (r.length === 2) {
    r = [];
  }

  const isMatched = (m & (1 << clicked)) !== 0;

  if (!isMatched) {
    if (r.length === 1) {
      const first = r[0]!;
      if (clicked !== first) {
        if (d[first] === d[clicked]) {
          m = m | (1 << first) | (1 << clicked);
          r = [];
        } else {
          r = [first, clicked];
        }
      }
    } else {
      r = [clicked];
    }
  }

  if (t0 === null) {
    t0 = ts;
  }

  return { d, w, m, r, t0 };
}

function renderGame(base: string, state: GameState): SnapHandlerResult {
  const target = `${base}${SNAP_PATH}${encodeState(state)}`;
  const restartTarget = `${base}${SNAP_PATH}?reset=1`;
  const shareUrl = `${base}${HOME_PATH}`;
  const matchedCount = countSetBits(state.m) / 2;

  const elapsedLabel =
    state.t0 === null ? "0:00" : formatElapsed(Math.max(0, nowSeconds() - state.t0));

  const elements: Record<string, SnapElementInput> = {
    page: {
      type: "stack",
      props: { gap: "md" },
      children: ["title", "subtitle", "status", "grid", "actions"],
    },
    title: {
      type: "text",
      props: { content: "Farcaster Memory Game", weight: "bold", size: "lg" },
    },
    subtitle: {
      type: "text",
      props: {
        content: "Find matching cards and test your Farcaster memory.",
        size: "sm",
      },
    },
    status: {
      type: "text",
      props: {
        content: `${elapsedLabel} \u00b7 pairs ${matchedCount}/${PAIR_COUNT}`,
        size: "sm",
      },
    },
    grid: {
      type: "cell_grid",
      props: {
        name: "cell",
        cols: COLS,
        rows: ROWS,
        gap: "sm",
        rowHeight: 56,
        select: "off",
        cells: buildCells(state),
      },
      on: {
        press: {
          action: "submit",
          params: { target },
        },
      },
    },
    actions: {
      type: "stack",
      props: { direction: "horizontal", gap: "sm" },
      children: ["restart", "share"],
    },
    restart: {
      type: "button",
      props: { label: "Restart", variant: "secondary" },
      on: {
        press: {
          action: "submit",
          params: { target: restartTarget },
        },
      },
    },
    share: {
      type: "button",
      props: { label: "Share", variant: "secondary", icon: "share" },
      on: {
        press: {
          action: "compose_cast",
          params: {
            text: "I'm playing the Farcaster Memory Game! Can you beat me?",
            embeds: [shareUrl],
          },
        },
      },
    },
  };

  return {
    version: SPEC_VERSION,
    theme: { accent: "purple" },
    ui: { root: "page", elements },
  };
}

function renderWin(base: string, state: GameState, endTs: number): SnapHandlerResult {
  const elapsed = state.t0 === null ? 0 : Math.max(0, endTs - state.t0);
  const playAgainTarget = `${base}${SNAP_PATH}?reset=1`;
  const shareUrl = `${base}${HOME_PATH}`;
  const elapsedLabel = formatElapsed(elapsed);

  const elements: Record<string, SnapElementInput> = {
    page: {
      type: "stack",
      props: { gap: "md" },
      children: ["title", "time", "subtitle", "actions"],
    },
    title: {
      type: "text",
      props: { content: "You won!", weight: "bold", size: "lg", align: "center" },
    },
    time: {
      type: "text",
      props: {
        content: `Time: ${elapsedLabel}`,
        weight: "bold",
        align: "center",
      },
    },
    subtitle: {
      type: "text",
      props: {
        content: `All ${PAIR_COUNT} pairs matched.`,
        size: "sm",
        align: "center",
      },
    },
    actions: {
      type: "stack",
      props: { direction: "horizontal", gap: "sm" },
      children: ["again", "share"],
    },
    again: {
      type: "button",
      props: { label: "Play again", variant: "primary" },
      on: {
        press: {
          action: "submit",
          params: { target: playAgainTarget },
        },
      },
    },
    share: {
      type: "button",
      props: { label: "Share", variant: "secondary", icon: "share" },
      on: {
        press: {
          action: "compose_cast",
          params: {
            text: `I have completed the Farcaster memory game in ${elapsedLabel} - can you beat me?`,
            embeds: [shareUrl],
          },
        },
      },
    },
  };

  return {
    version: SPEC_VERSION,
    theme: { accent: "purple" },
    effects: ["confetti"],
    ui: { root: "page", elements },
  };
}

function buildCells(state: GameState): Array<{
  row: number;
  col: number;
  color: string;
  content?: string;
  value: string;
}> {
  const { d, w, m, r } = state;
  const mismatch = r.length === 2;
  const revealedSet = new Set(r);
  const wordIndices = decodeWordSelection(w);

  const cells: Array<{
    row: number;
    col: number;
    color: string;
    content?: string;
    value: string;
  }> = [];

  for (let i = 0; i < CELL_COUNT; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const isMatched = (m & (1 << i)) !== 0;
    const isRevealed = revealedSet.has(i);

    let color: string;
    let content: string | undefined;

    if (isMatched) {
      color = COLOR_MATCHED;
      content = wordForCell(d, wordIndices, i);
    } else if (isRevealed) {
      color = mismatch ? COLOR_MISMATCH : COLOR_REVEALED;
      content = wordForCell(d, wordIndices, i);
    } else {
      color = COLOR_HIDDEN;
    }

    const cell: {
      row: number;
      col: number;
      color: string;
      content?: string;
      value: string;
    } = { row, col, color, value: String(i) };
    if (content !== undefined) cell.content = content;
    cells.push(cell);
  }

  return cells;
}

function wordForCell(d: string, wordIndices: number[], cellIdx: number): string {
  const slot = parseInt(d[cellIdx]!, 10) - 1;
  return WORDS[wordIndices[slot]!] ?? "?";
}

function parseState(url: URL): GameState {
  if (url.searchParams.get("reset") === "1") {
    return { d: generateDeck(), w: pickWords(), m: 0, r: [], t0: null };
  }

  const dRaw = url.searchParams.get("d") ?? "";
  const wRaw = url.searchParams.get("w") ?? "";
  const dValid = isValidDeck(dRaw);
  const wValid = isValidWordSelection(wRaw);

  // If either is missing/invalid, regenerate both so they stay paired.
  const d = dValid && wValid ? dRaw : generateDeck();
  const w = dValid && wValid ? wRaw : pickWords();

  const mRaw = url.searchParams.get("m") ?? "";
  const mParsed = mRaw === "" ? 0 : parseInt(mRaw, 16);
  const m = Number.isFinite(mParsed) && mParsed >= 0 && mParsed <= ALL_MATCHED_MASK ? mParsed : 0;

  const rRaw = url.searchParams.get("r") ?? "";
  const r = parseRevealed(rRaw, m);

  const t0Raw = url.searchParams.get("t0") ?? "";
  const t0Parsed = t0Raw === "" ? null : parseInt(t0Raw, 10);
  const t0 = t0Parsed !== null && Number.isFinite(t0Parsed) && t0Parsed > 0 ? t0Parsed : null;

  return { d, w, m, r, t0 };
}

function encodeState(state: GameState): string {
  const params = new URLSearchParams();
  params.set("d", state.d);
  params.set("w", state.w);
  if (state.m !== 0) params.set("m", state.m.toString(16));
  if (state.r.length > 0) params.set("r", state.r.join(","));
  if (state.t0 !== null) params.set("t0", String(state.t0));
  return `?${params.toString()}`;
}

function parseRevealed(raw: string, matchedMask: number): number[] {
  if (raw === "") return [];
  const parts = raw.split(",").slice(0, 2);
  const out: number[] = [];
  const seen = new Set<number>();
  for (const part of parts) {
    const n = parseInt(part, 10);
    if (!Number.isFinite(n) || n < 0 || n >= CELL_COUNT) continue;
    if (seen.has(n)) continue;
    if ((matchedMask & (1 << n)) !== 0) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function parseCellIndex(raw: string): number | null {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0 || n >= CELL_COUNT) return null;
  return n;
}

function isValidDeck(d: string): boolean {
  if (d.length !== CELL_COUNT) return false;
  const counts = new Array(PAIR_COUNT + 1).fill(0);
  for (let i = 0; i < d.length; i++) {
    const c = d.charCodeAt(i) - 48;
    if (c < 1 || c > PAIR_COUNT) return false;
    counts[c]++;
  }
  for (let v = 1; v <= PAIR_COUNT; v++) {
    if (counts[v] !== 2) return false;
  }
  return true;
}

function generateDeck(): string {
  const arr: number[] = [];
  for (let v = 1; v <= PAIR_COUNT; v++) {
    arr.push(v, v);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr.join("");
}

function pickWords(): string {
  const pool: number[] = [];
  for (let i = 0; i < WORDS.length; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, PAIR_COUNT).join(",");
}

function isValidWordSelection(w: string): boolean {
  const parts = w.split(",");
  if (parts.length !== PAIR_COUNT) return false;
  const seen = new Set<number>();
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return false;
    const n = parseInt(part, 10);
    if (n < 0 || n >= WORDS.length) return false;
    if (seen.has(n)) return false;
    seen.add(n);
  }
  return true;
}

function decodeWordSelection(w: string): number[] {
  return w.split(",").map((s) => parseInt(s, 10));
}

function countSetBits(n: number): number {
  let count = 0;
  let x = n;
  while (x !== 0) {
    x &= x - 1;
    count++;
  }
  return count;
}

function formatElapsed(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

const fontsDir = join(process.cwd(), "assets/fonts");

const app = new Hono();

const ogFonts = [
  { path: join(fontsDir, "inter-latin-400-normal.woff"), weight: 400 as const },
  { path: join(fontsDir, "inter-latin-700-normal.woff"), weight: 700 as const },
];

registerSnapHandler(app, homeSnap, {
  path: HOME_PATH,
  og: { fonts: ogFonts },
});

registerSnapHandler(app, memoryGameSnap, {
  path: SNAP_PATH,
  og: { fonts: ogFonts },
});

export default app;

function snapBaseUrlFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host");
  const host = (forwardedHost ?? hostHeader)?.split(",")[0].trim();
  const isLoopback =
    host !== undefined &&
    /^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?$/.test(host);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto = forwardedProto
    ? forwardedProto.split(",")[0].trim().toLowerCase()
    : isLoopback
      ? "http"
      : "https";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return `http://localhost:${process.env.PORT ?? "3003"}`.replace(/\/$/, "");
}
