import * as React from "react"
import { useEffect, useRef, useMemo, useState } from "react"
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from "remotion"
import { PHASES, s } from "./config"

/*
  hero_context_layer — Canvas-based knowledge graph animation.

  Adapted for Remotion:
  - RAF loop removed; canvas redraws on each frame via useEffect([frame])
  - Random message selection replaced with deterministic frame-based cycling
  - ResizeObserver/window resize replaced with fixed dims from useVideoConfig
  - URL.createObjectURL replaced with data URLs (safe in headless Chrome)
  - CSS keyframe card animation replaced with frame-derived opacity
  - delayRender/continueRender used for async image loading
  - CSS transitions removed
*/

// ─── SVG Assets ─────────────────────────────────────────────────────────────────

function ease(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function clamp(t: number) {
    return Math.max(0, Math.min(1, t))
}

const FINEGRAINED_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <g fill="#ffffff">
    <rect x="41.1" y="0.0" width="19.5" height="18.4" rx="1" ry="1"/>
    <rect x="0.0" y="1.1" width="15.1" height="18.4" rx="1" ry="1"/>
    <rect x="20.5" y="1.1" width="10.8" height="11.9" rx="1" ry="1"/>
    <rect x="68.1" y="1.1" width="20.5" height="21.6" rx="1" ry="1"/>
    <rect x="99.5" y="1.1" width="13.0" height="13.0" rx="1" ry="1"/>
    <rect x="122.2" y="1.1" width="11.9" height="11.9" rx="1" ry="1"/>
    <rect x="145.9" y="1.1" width="21.6" height="19.5" rx="1" ry="1"/>
    <rect x="177.3" y="1.1" width="22.7" height="23.8" rx="1" ry="1"/>
    <rect x="115.7" y="19.5" width="19.5" height="20.5" rx="1" ry="1"/>
    <rect x="19.5" y="27.0" width="19.5" height="19.5" rx="1" ry="1"/>
    <rect x="59.5" y="29.2" width="16.2" height="17.3" rx="1" ry="1"/>
    <rect x="86.5" y="29.2" width="21.6" height="22.7" rx="1" ry="1"/>
    <rect x="0.0" y="31.4" width="11.9" height="10.8" rx="1" ry="1"/>
    <rect x="157.8" y="34.6" width="19.5" height="19.5" rx="1" ry="1"/>
    <rect x="187.0" y="36.8" width="10.8" height="10.8" rx="1" ry="1"/>
    <rect x="130.8" y="46.5" width="18.4" height="19.5" rx="1" ry="1"/>
    <rect x="36.8" y="54.1" width="21.6" height="20.5" rx="1" ry="1"/>
    <rect x="0.0" y="55.1" width="21.6" height="21.6" rx="1" ry="1"/>
    <rect x="69.2" y="59.5" width="14.1" height="13.0" rx="1" ry="1"/>
    <rect x="178.4" y="60.5" width="21.6" height="22.7" rx="1" ry="1"/>
    <rect x="103.8" y="61.6" width="19.5" height="20.5" rx="1" ry="1"/>
    <rect x="27.0" y="64.9" width="7.6" height="6.5" rx="1" ry="1"/>
    <rect x="93.0" y="64.9" width="6.5" height="10.8" rx="1" ry="1"/>
    <rect x="147.0" y="71.4" width="18.4" height="18.4" rx="1" ry="1"/>
    <rect x="131.9" y="77.8" width="8.6" height="8.6" rx="1" ry="1"/>
    <rect x="46.5" y="82.2" width="21.6" height="22.7" rx="1" ry="1"/>
    <rect x="25.9" y="85.4" width="10.8" height="10.8" rx="1" ry="1"/>
    <rect x="0.0" y="87.6" width="16.2" height="19.5" rx="1" ry="1"/>
    <rect x="77.8" y="87.6" width="21.6" height="22.7" rx="1" ry="1"/>
    <rect x="165.4" y="95.1" width="13.0" height="15.1" rx="1" ry="1"/>
    <rect x="116.8" y="96.2" width="20.5" height="19.5" rx="1" ry="1"/>
    <rect x="185.9" y="96.2" width="10.8" height="10.8" rx="1" ry="1"/>
    <rect x="145.9" y="104.9" width="9.7" height="9.7" rx="1" ry="1"/>
    <rect x="21.6" y="110.3" width="22.7" height="20.5" rx="1" ry="1"/>
    <rect x="65.9" y="115.7" width="17.3" height="18.4" rx="1" ry="1"/>
    <rect x="50.8" y="118.9" width="7.6" height="8.6" rx="1" ry="1"/>
    <rect x="1.1" y="120.0" width="9.7" height="10.8" rx="1" ry="1"/>
    <rect x="150.3" y="120.0" width="20.5" height="21.6" rx="1" ry="1"/>
    <rect x="179.5" y="121.1" width="20.5" height="21.6" rx="1" ry="1"/>
    <rect x="96.2" y="124.3" width="19.5" height="19.5" rx="1" ry="1"/>
    <rect x="127.6" y="130.8" width="10.8" height="9.7" rx="1" ry="1"/>
    <rect x="47.6" y="138.4" width="19.5" height="19.5" rx="1" ry="1"/>
    <rect x="77.8" y="141.6" width="10.8" height="13.0" rx="1" ry="1"/>
    <rect x="0.0" y="142.7" width="22.7" height="22.7" rx="1" ry="1"/>
    <rect x="104.9" y="151.4" width="17.3" height="18.4" rx="1" ry="1"/>
    <rect x="135.1" y="151.4" width="19.5" height="20.5" rx="1" ry="1"/>
    <rect x="166.5" y="153.5" width="14.1" height="14.1" rx="1" ry="1"/>
    <rect x="189.2" y="153.5" width="10.8" height="11.9" rx="1" ry="1"/>
    <rect x="33.5" y="158.9" width="18.4" height="18.4" rx="1" ry="1"/>
    <rect x="73.5" y="164.3" width="19.5" height="18.4" rx="1" ry="1"/>
    <rect x="0.0" y="175.1" width="27.0" height="24.9" rx="1" ry="1"/>
    <rect x="187.0" y="178.4" width="13.0" height="14.1" rx="1" ry="1"/>
    <rect x="149.2" y="179.5" width="20.5" height="20.5" rx="1" ry="1"/>
    <rect x="129.7" y="181.6" width="13.0" height="11.9" rx="1" ry="1"/>
    <rect x="98.4" y="183.8" width="19.5" height="16.2" rx="1" ry="1"/>
    <rect x="57.3" y="187.0" width="14.1" height="11.9" rx="1" ry="1"/>
    <rect x="36.8" y="188.1" width="13.0" height="10.8" rx="1" ry="1"/>
    <rect x="80.0" y="189.2" width="13.0" height="10.8" rx="1" ry="1"/>
  </g>
</svg>`.trim()

const LINEAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="200" height="200" viewBox="0 0 100 100"><path fill="#222326" d="M1.22541 61.5228c-.2225-.9485.90748-1.5459 1.59638-.857L39.3342 97.1782c.6889.6889.0915 1.8189-.857 1.5964C20.0515 94.4522 5.54779 79.9485 1.22541 61.5228ZM.00189135 46.8891c-.01764375.2833.08887215.5599.28957165.7606L52.3503 99.7085c.2007.2007.4773.3075.7606.2896 2.3692-.1476 4.6938-.46 6.9624-.9259.7645-.157 1.0301-1.0963.4782-1.6481L2.57595 39.4485c-.55186-.5519-1.49117-.2863-1.648174.4782-.465915 2.2686-.77832 4.5932-.92588465 6.9624ZM4.21093 29.7054c-.16649.3738-.08169.8106.20765 1.1l64.77602 64.776c.2894.2894.7262.3742 1.1.2077 1.7861-.7956 3.5171-1.6927 5.1855-2.684.5521-.328.6373-1.0867.1832-1.5407L8.43566 24.3367c-.45409-.4541-1.21271-.3689-1.54074.1832-.99132 1.6684-1.88843 3.3994-2.68399 5.1855ZM12.6587 18.074c-.3701-.3701-.393-.9637-.0443-1.3541C21.7795 6.45931 35.1114 0 49.9519 0 77.5927 0 100 22.4073 100 50.0481c0 14.8405-6.4593 28.1724-16.7199 37.3375-.3903.3487-.984.3258-1.3542-.0443L12.6587 18.074Z"/></svg>`.trim()

const ZOOM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"><path fill="#0b5cff" d="M100.051 104.226c0 6.917-5.608 12.525-12.525 12.525H33.253c-13.835 0-25.05-11.215-25.05-25.05V45.778c0-6.917 5.608-12.525 12.525-12.525h54.274c13.835 0 25.05 11.215 25.05 25.05v58.448ZM131.78 40.766l-18.37 13.777c-3.154 2.366-5.01 6.078-5.01 10.02v20.874c0 3.943 1.856 7.655 5.01 10.02l18.37 13.777c4.128 3.096 10.02.151 10.02-5.01V45.776c0-5.16-5.892-8.106-10.02-5.01Z"/></svg>`.trim()

const SLACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="127" height="127"><path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A"/><path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0"/><path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="#2EB67D"/><path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E"/></svg>`.trim()

const GITHUB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96"><path fill="#24292f" d="M41.44 69.38C28.81 67.85 19.91 58.76 19.91 46.99c0-4.79 1.72-9.95 4.59-13.4-1.24-3.16-1.05-9.86.39-12.63 3.83-.48 9 1.53 12.06 4.3 3.64-1.14 7.47-1.72 12.16-1.72s7.81.58 11.26 1.63c2.97-2.68 8.23-4.69 12.06-4.21 1.34 2.58 1.53 9.28.29 12.54 3.06 3.64 4.69 8.52 4.69 13.5 0 11.77-8.9 20.67-21.72 22.3 3.25 2.1 5.46 6.7 5.46 11.96v9.95c0 2.87 2.39 4.5 5.26 3.35C84.41 87.95 98 70.63 98 49.19 98 22.11 75.99 0 48.9 0 21.82 0 0 22.11 0 49.19c0 21.25 13.49 38.86 31.68 45.46 2.58.96 5.07-.76 5.07-3.35v-7.66c-1.34.57-3.06.96-4.59.96-6.32 0-10.05-3.45-12.73-9.86-1.05-2.58-2.2-4.11-4.4-4.4-1.15-.1-1.53-.57-1.53-1.15 0-1.15 1.91-2.01 3.83-2.01 2.78 0 5.17 1.72 7.66 5.26 1.91 2.78 3.92 4.02 6.31 4.02s4.53-.86 6.73-3.06c1.63-1.63 2.87-3.06 4.02-4.02Z"/></svg>`.trim()

const NOTION_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#fff"/><path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="#000"/></svg>`.trim()

const GLASS_URL =
    "https://res.cloudinary.com/dxlsglpxy/image/upload/v1771307170/Group_1-2_xv2cxc.png"

const AVATAR_URLS: Record<string, string> = {
    eduardo: "https://res.cloudinary.com/dxlsglpxy/image/upload/v1771023073/f709d5ea-b06c-4b64-b07f-be783893600f_p2wq71.jpg",
    jon:     "https://res.cloudinary.com/dxlsglpxy/image/upload/v1771026281/Image_wsx6sx.jpg",
    alex:    "https://res.cloudinary.com/dxlsglpxy/image/upload/v1771026637/Image_1_jnoj87.jpg",
    maya:    "https://res.cloudinary.com/dxlsglpxy/image/upload/v1771027023/Image_2_l8cbeh.jpg",
}

// ─── Messages ───────────────────────────────────────────────────────────────────

const MESSAGES = [
    { source: "github",      nodeId: "github",   text: "PR #247: Add rate limiter middleware to API gateway",              person: "Eduardo",      direction: "to"   },
    { source: "github",      nodeId: "github",   text: "Merged: Refactor embedding pipeline to batch processing",          person: "Jon",          direction: "to"   },
    { source: "github",      nodeId: "github",   text: "PR #251: Fix connection pooling in auth service",                   person: "Jon",          direction: "to"   },
    { source: "github",      nodeId: "github",   text: "Review approved: Migration to async handlers in /events",          person: "Maya",         direction: "to"   },
    { source: "github",      nodeId: "github",   text: "Commit: Update PyTorch to 2.3 — resolves CUDA compat",            person: "Alex",         direction: "to"   },
    { source: "github",      nodeId: "github",   text: "PR #260: Replace polling with WebSocket in dashboard",             person: "Jon",          direction: "to"   },
    { source: "github",      nodeId: "github",   text: "Issue #189: API latency spike after deploying queue changes",      person: "Eduardo",      direction: "to"   },
    { source: "slack",       nodeId: "slack",    text: "Added a timer to the API due to SLA terms with our vendor",        person: "Eduardo",      direction: "to"   },
    { source: "slack",       nodeId: "slack",    text: "Embedding model swap needs to happen before we scale inference",   person: "Jon",          direction: "to"   },
    { source: "slack",       nodeId: "slack",    text: "QA found a regression in auth flow — blocking the release",        person: "Maya",         direction: "to"   },
    { source: "slack",       nodeId: "slack",    text: "Decided: going with Redis Streams over Kafka for v1",              person: "Eduardo",      direction: "to"   },
    { source: "slack",       nodeId: "slack",    text: "Let's deprecate the REST endpoint and move to GraphQL",            person: "Eduardo",      direction: "to"   },
    { source: "slack",       nodeId: "slack",    text: "New caching layer cut p99 latency from 800ms to 120ms",           person: "Maya",         direction: "to"   },
    { source: "slack",       nodeId: "slack",    text: "ML pipeline is still writing to the old schema",                   person: "Alex",         direction: "to"   },
    { source: "slack",       nodeId: "slack",    text: "We should pin the numpy version — broke overnight on CI",          person: "Jon",          direction: "to"   },
    { source: "zoom",        nodeId: "zoom",     text: "Meeting: Prioritize the migration before Q3 launch",               person: "Eduardo",      direction: "to"   },
    { source: "zoom",        nodeId: "zoom",     text: "Standup: Blocked on data team — need prod replica access",         person: "Jon",          direction: "to"   },
    { source: "zoom",        nodeId: "zoom",     text: "Sprint retro: Testing bottleneck is the auth service mock",        person: "Maya",         direction: "to"   },
    { source: "zoom",        nodeId: "zoom",     text: "Design review: New ingestion flow handles 3x throughput",          person: "Alex",         direction: "to"   },
    { source: "zoom",        nodeId: "zoom",     text: "1:1: Proposing we split the monolith by domain",                   person: "Jon",          direction: "to"   },
    { source: "zoom",        nodeId: "zoom",     text: "Agreed to adopt OpenTelemetry for distributed tracing",            person: "Alex",         direction: "to"   },
    { source: "linear",      nodeId: "linear",   text: "FG-342: Implement webhook retry queue — In Progress",              person: "Maya",         direction: "to"   },
    { source: "linear",      nodeId: "linear",   text: "FG-358: Auth service timeout under load — High Priority",          person: "Maya",         direction: "to"   },
    { source: "linear",      nodeId: "linear",   text: "FG-371: Update ML pipeline for batch inference — Done",            person: "Alex",         direction: "to"   },
    { source: "linear",      nodeId: "linear",   text: "FG-389: Add distributed tracing to payment flow",                  person: "Eduardo",      direction: "to"   },
    { source: "linear",      nodeId: "linear",   text: "FG-401: Deprecate REST v1 endpoints — Backlog",                   person: "Eduardo",      direction: "to"   },
    { source: "linear",      nodeId: "linear",   text: "FG-412: Vector DB query optimization for >10k contexts",           person: "Jon",          direction: "to"   },
    { source: "cursor",      nodeId: "fg-core",  text: "Refactored: Extracted shared auth logic into @fg/auth-core",       person: "Code_Agent_2", direction: "to"   },
    { source: "cursor",      nodeId: "fg-api",   text: "Auto-fix: Resolved 12 type errors after TS 5.4 upgrade",          person: "Code_Agent_1", direction: "to"   },
    { source: "cursor",      nodeId: "fg-core",  text: "Test coverage for /api/v2/context: 43% → 89%",                    person: "QA_Agent_3",   direction: "to"   },
    { source: "cursor",      nodeId: "fg-ml",    text: "Generated: API client SDK from updated OpenAPI spec",              person: "Code_Agent_2", direction: "to"   },
    { source: "cursor",      nodeId: "fg-api",   text: "Regression: /health endpoint returns 503 after deploy",            person: "QA_Agent_5",   direction: "to"   },
    { source: "cursor",      nodeId: "fg-ml",    text: "Migration: Converted 47 files from CommonJS to ESM",              person: "Code_Agent_1", direction: "to"   },
    { source: "cursor",      nodeId: "fg-core",  text: "Linear ticket — Server ping microservice: Done",                   person: "QA_Agent_5",   direction: "to"   },
    { source: "finegrained", nodeId: "jon",      text: "Query: Why are we not using the newest version of PyTorch?",      person: "Jon",          direction: "from" },
    { source: "finegrained", nodeId: "eduardo",  text: "Query: Who decided to use Redis Streams and why?",                person: "Eduardo",      direction: "from" },
    { source: "finegrained", nodeId: "maya",     text: "Context: Auth service was last refactored in Sprint 14 by Sai",   person: "Maya",         direction: "from" },
    { source: "finegrained", nodeId: "alex",     text: "Query: What are the SLA requirements for /v2/ingest?",            person: "Alex",         direction: "from" },
    { source: "finegrained", nodeId: "jon",      text: "Context: Vendor API rate limit increased to 5k/min in Jan",       person: "Jon",          direction: "from" },
    { source: "finegrained", nodeId: "jon",      text: "Query: Which services depend on legacy auth token format?",       person: "Jon",          direction: "from" },
    { source: "finegrained", nodeId: "jon",      text: "Context: Eduardo proposed GraphQL migration in Dec planning",     person: "Jon",          direction: "from" },
    { source: "finegrained", nodeId: "eduardo",  text: "Query: What broke when we last updated numpy?",                   person: "Eduardo",      direction: "from" },
    { source: "finegrained", nodeId: "maya",     text: "Query: What's the test coverage for the worker queue?",          person: "Maya",         direction: "from" },
    { source: "finegrained", nodeId: "eduardo",  text: "Context: Circuit breaker was added to vendor calls in Sprint 18", person: "Eduardo",      direction: "from" },
    { source: "finegrained", nodeId: "alex",     text: "Query: Who has access to the prod database replicas?",            person: "Alex",         direction: "from" },
    { source: "finegrained", nodeId: "maya",     text: "Query: What was the outcome of last week's architecture review?",person: "Maya",         direction: "from" },
    { source: "finegrained", nodeId: "eduardo",  text: "Context: Batch inference was shipped in FG-371 by Alex",         person: "Eduardo",      direction: "from" },
    { source: "finegrained", nodeId: "jon",      text: "Query: Which PR introduced the WebSocket dashboard change?",      person: "Jon",          direction: "from" },
    { source: "finegrained", nodeId: "maya",     text: "Context: Redis Streams decision was made in Sprint 11 by Bella",  person: "Maya",         direction: "from" },
    { source: "finegrained", nodeId: "maya",     text: "Query: How did we handle the auth regression last time?",         person: "Maya",         direction: "from" },
    { source: "cursor",      nodeId: "fg-infra", text: "Terraform: Updated ECS task definitions for auto-scaling",        person: "Code_Agent_1", direction: "to"   },
    { source: "cursor",      nodeId: "fg-infra", text: "CI pipeline reduced from 14min to 6min via caching layers",       person: "Code_Agent_2", direction: "to"   },
    { source: "cursor",      nodeId: "fg-infra", text: "Dockerfile optimized: image size down from 1.2GB to 340MB",       person: "QA_Agent_3",   direction: "to"   },
    { source: "cursor",      nodeId: "fg-infra", text: "Added health check endpoints to all staging environments",         person: "Code_Agent_1", direction: "to"   },
    { source: "cursor",      nodeId: "fg-infra", text: "Secrets rotation automated via AWS Secrets Manager cron",         person: "Code_Agent_2", direction: "to"   },
    { source: "notion",      nodeId: "notion",   text: "ADR-014: Chose connection pooling over per-request DB conns",     person: "Jon",          direction: "to"   },
    { source: "notion",      nodeId: "notion",   text: "Postmortem: Feb 3 auth outage — root cause was stale token cache",person: "Maya",         direction: "to"   },
    { source: "notion",      nodeId: "notion",   text: "Engineering wiki: Vendor API integration guide updated for v3",   person: "Eduardo",      direction: "to"   },
    { source: "notion",      nodeId: "notion",   text: "RFC: Proposal to move feature flags from env vars to LaunchDarkly",person: "Alex",        direction: "to"   },
    { source: "notion",      nodeId: "notion",   text: "Sprint 20 planning: ML pipeline refactor scoped to 3 weeks",      person: "Jon",          direction: "to"   },
]

// ─── Source Configs ──────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
    github:      "#d97706",
    slack:       "#d97706",
    zoom:        "#d97706",
    linear:      "#d97706",
    cursor:      "#ef4444",
    finegrained: "#4182F4",
    notion:      "#d97706",
}

const SOURCE_ACCENT: Record<string, string> = {
    github:      "#24292f",
    slack:       "#E01E5A",
    zoom:        "#2D8CFF",
    linear:      "#5E6AD2",
    cursor:      "#6366f1",
    finegrained: "#4182F4",
    notion:      "#000000",
}

const SOURCE_LABEL: Record<string, string> = {
    github: "GitHub", slack: "Slack", zoom: "Zoom", linear: "Linear",
    cursor: "Cursor", finegrained: "FineGrained", notion: "Notion",
}

// ─── Node Definitions ─────────────────────────────────────────────────────────────

const OUTER_NODES = [
    { id: "eduardo", label: "Eduardo", type: "person", initials: "ER", x: 0.18, y: 0.14, hue: 210 },
    { id: "jon",     label: "Jon",     type: "person", initials: "JW", x: 0.06, y: 0.45, hue: 210 },
    { id: "maya",    label: "Maya",    type: "person", initials: "MR", x: 0.72, y: 0.88, hue: 210 },
    { id: "alex",    label: "Alex",    type: "person", initials: "AT", x: 0.90, y: 0.62, hue: 210 },
    { id: "github",  label: "GitHub",  type: "system" },
    { id: "slack",   label: "Slack",   type: "system" },
    { id: "zoom",    label: "Zoom",    type: "system" },
    { id: "linear",  label: "Linear",  type: "system" },
    { id: "notion",  label: "Notion",  type: "system" },
    { id: "fg-core", label: "core",    type: "repo"   },
    { id: "fg-api",  label: "api",     type: "repo"   },
    { id: "fg-ml",   label: "ml",      type: "repo"   },
    { id: "fg-infra",label: "infra",   type: "repo"   },
] as const

const CENTER = { x: 0.5, y: 0.5 }

const NODE_STYLES = {
    person: { fill: "#ecfdf5", stroke: "#34d399", strokeActive: "#10b981", glowColor: "34, 211, 153" },
    system: { fill: "#fefce8", stroke: "#fbbf24", strokeActive: "#f59e0b", glowColor: "251, 191, 36" },
    repo:   { fill: "#fef2fe", stroke: "#f87171", strokeActive: "#ef4444", glowColor: "248, 113, 113" },
}

// ─── Animation constants ──────────────────────────────────────────────────────────

const CYCLE_FRAMES     = s(PHASES.hero.cycleSeconds)
const PULSE_FRAMES     = s(PHASES.hero.pulseSeconds)
const CARD_FADE_FRAMES = s(PHASES.hero.cardFadeSeconds)
const NODE_APPEAR_FRAME = 21 // change this number to control when node appears

// ─── Canvas Utilities ─────────────────────────────────────────────────────────────

function borderPoint(cx: number, cy: number, radius: number, tx: number, ty: number) {
    const dx = tx - cx, dy = ty - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return { x: cx + radius, y: cy }
    return { x: cx + (dx / dist) * radius, y: cy + (dy / dist) * radius }
}

function drawSystemLogo(
    ctx: CanvasRenderingContext2D,
    id: string,
    cx: number, cy: number, size: number,
    logos: Record<string, HTMLImageElement | null>
) {
    const img = logos[id]
    if (!img) return
    ctx.save()
    const s = size * 0.42
    ctx.drawImage(img, cx - s * 0.6, cy - s * 0.6, s * 1.2, s * 1.2)
    ctx.restore()
}

function drawPersonAvatar(
    ctx: CanvasRenderingContext2D,
    node: { hue?: number },
    cx: number, cy: number, radius: number
) {
    const hue = node.hue || 200
    const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
    grad.addColorStop(0, `hsl(${hue}, 60%, 65%)`)
    grad.addColorStop(1, `hsl(${(hue + 30) % 360}, 55%, 55%)`)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = grad
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
    ctx.fillStyle = `hsl(${hue}, 50%, 85%)`
    ctx.beginPath()
    ctx.arc(cx, cy - radius * 0.15, radius * 0.32, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx, cy + radius * 0.55, radius * 0.52, radius * 0.35, 0, Math.PI, 0, true)
    ctx.fill()
    ctx.restore()
}

function drawRepoIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, label: string) {
    const s = size * 0.3
    ctx.save()
    ctx.translate(cx, cy)
    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = s * 0.16
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.moveTo(-s * 0.35, -s * 0.55)
    ctx.lineTo(-s * 0.05, -s * 0.25)
    ctx.lineTo(-s * 0.35, s * 0.05)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(s * 0.05, s * 0.05)
    ctx.lineTo(s * 0.35, s * 0.05)
    ctx.stroke()
    ctx.font = `600 ${size * 0.15}px "SF Mono","Fira Code","Consolas",monospace`
    ctx.fillStyle = "#ef4444"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillText("/" + label, 0, s * 0.45)
    ctx.restore()
}

function drawFineGrainedSVG(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, radius: number,
    img: HTMLImageElement | null
) {
    if (!img) return
    const size = radius * 1
    ctx.save()
    ctx.globalAlpha = 1
    ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size)
    ctx.restore()
}

// ─── Main Component ───────────────────────────────────────────────────────────────

export default function hero_context_layer() {
    const frame = useCurrentFrame()
    const { width, height, fps } = useVideoConfig()

    const dims = { w: width, h: height }
    const CENTER_RADIUS = Math.min(width, height) * 0.07
    const OUTER_RADIUS  = Math.min(width, height) * 0.045

    // ─── Image loading with delayRender ──────────────────────────────────────
    const [renderHandle] = useState(() => delayRender("Loading hero images"))
    const [imagesReady, setImagesReady] = useState(false)

    const avatarImgsRef  = useRef<Record<string, HTMLImageElement | null>>({})
    const fgIconRef      = useRef<HTMLImageElement | null>(null)
    const glassIconRef   = useRef<HTMLImageElement | null>(null)
    const linearIconRef  = useRef<HTMLImageElement | null>(null)
    const zoomIconRef    = useRef<HTMLImageElement | null>(null)
    const slackIconRef   = useRef<HTMLImageElement | null>(null)
    const githubIconRef  = useRef<HTMLImageElement | null>(null)
    const notionIconRef  = useRef<HTMLImageElement | null>(null)
    const canvasRef      = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        // 5 SVG logos + 4 avatars + glass icon + FG icon = 11 total
        // Count fgIcon separately since it also uses svg data url
        const total = 11
        let loaded = 0

        const onLoad = () => {
            loaded++
            if (loaded >= total) {
                setImagesReady(true)
                continueRender(renderHandle)
            }
        }

        const loadSvg = (svg: string, ref: React.MutableRefObject<HTMLImageElement | null>) => {
            // Use encodeURIComponent to handle non-ASCII safely
            const url = `data:image/svg+xml,${encodeURIComponent(svg)}`
            const img = new Image()
            img.onload = onLoad
            img.onerror = onLoad
            img.src = url
            ref.current = img
        }

        loadSvg(FINEGRAINED_SVG, fgIconRef)
        loadSvg(LINEAR_SVG,     linearIconRef)
        loadSvg(ZOOM_SVG,       zoomIconRef)
        loadSvg(SLACK_SVG,      slackIconRef)
        loadSvg(GITHUB_SVG,     githubIconRef)
        loadSvg(NOTION_SVG,     notionIconRef)

        // External images
        const glassImg = new Image()
        glassImg.crossOrigin = "anonymous"
        glassImg.onload = onLoad
        glassImg.onerror = onLoad
        glassImg.src = GLASS_URL
        glassIconRef.current = glassImg

        Object.entries(AVATAR_URLS).forEach(([id, url]) => {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = onLoad
            img.onerror = onLoad
            img.src = url
            avatarImgsRef.current[id] = img
        })
    }, [])

    // ─── Positioned nodes (fixed dims, computed once) ─────────────────────────
    const positionedNodes = useMemo(() => {
        const { w, h } = dims
        const priorityOrder = [
            "eduardo", "fg-api", "jon", "github", "slack", "fg-core",
            "alex", "notion", "linear", "maya", "zoom", "fg-ml", "fg-infra",
        ]
        let maxNodes
        if (w < 400) maxNodes = 9
        else if (w < 600) maxNodes = 9
        else if (w < 900) maxNodes = 12
        else maxNodes = OUTER_NODES.length

        const visibleIds = new Set(priorityOrder.slice(0, maxNodes))
        const filteredNodes = (OUTER_NODES as readonly any[]).filter((n) => visibleIds.has(n.id))

        const padX = 0.09, padY = 0.09, stretch = 1.5
        const baseR = 0.5 - Math.max(padX, padY)
        const rx = baseR + (0.5 - padX - baseR) * stretch
        let ry = baseR + (0.5 - padY - baseR) * stretch

        const aspect = w / h
        const isNarrow = aspect < 0.7

        if (isNarrow) {
            ry = 0.42
            const half = Math.ceil(filteredNodes.length / 2)
            return filteredNodes.map((node, i) => {
                const isTop = i < half
                const groupSize = isTop ? half : filteredNodes.length - half
                const indexInGroup = isTop ? i : i - half
                const arcSpan = Math.PI * 0.4
                const arcCenter = isTop ? -Math.PI / 2 : Math.PI / 2
                const offset = groupSize === 1 ? 0 : (indexInGroup / (groupSize - 1) - 0.5) * arcSpan
                const angle = arcCenter + offset
                return { ...node, x: CENTER.x + Math.cos(angle) * rx, y: CENTER.y + Math.sin(angle) * ry }
            })
        } else {
            return filteredNodes.map((node, i) => {
                const angle = (i / filteredNodes.length) * Math.PI * 2 - Math.PI / 2
                return { ...node, x: CENTER.x + Math.cos(angle) * rx, y: CENTER.y + Math.sin(angle) * ry }
            })
        }
    }, [dims.w, dims.h])

    // ─── Frame-based animation state ──────────────────────────────────────────
    const cycleIndex   = Math.floor(frame / CYCLE_FRAMES)
    const frameInCycle = frame % CYCLE_FRAMES
    const rippleProg = clamp((frameInCycle - PULSE_FRAMES) / (CYCLE_FRAMES - PULSE_FRAMES))

    const inboundMsgs    = MESSAGES.filter(m => m.direction === "to")
    const inboundNodeIds = [...new Set(inboundMsgs.map(m => m.nodeId))]

    // Deterministic pseudo-random seeded on cycleIndex (safe for Remotion frame rendering)
    const rnd1 = (Math.sin(cycleIndex * 127.1 + 311.7) * 43758.5453) % 1
    const rnd2 = (Math.sin(cycleIndex * 269.5 + 183.3) * 43758.5453) % 1
    const r1 = rnd1 < 0 ? rnd1 + 1 : rnd1
    const r2 = rnd2 < 0 ? rnd2 + 1 : rnd2

    const currentNodeId = inboundNodeIds[Math.floor(r1 * inboundNodeIds.length)]
    const nodePool      = inboundMsgs.filter(m => m.nodeId === currentNodeId)
    const currentMsg    = nodePool[Math.floor(r2 * nodePool.length)]

    const isInbound = true
    const outerNode = positionedNodes.find(n => n.id === currentMsg.nodeId) || positionedNodes[0]

    const pulseProgress  = Math.min(frameInCycle / PULSE_FRAMES, 1)
    const isPulseActive  = frameInCycle < PULSE_FRAMES
    const cardOpacity    = Math.min(frameInCycle / CARD_FADE_FRAMES, 1)

    // Time proxy for breathing effects (mimics `timestamp` in ms)
    const t = (frame / fps) * 1000
    const nodeOpacity = frame >= NODE_APPEAR_FRAME ? 1 : 0

    // ─── Canvas draw ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!imagesReady) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const { w, h } = dims

        canvas.width  = w * dpr
        canvas.height = h * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, w, h)

        const cxC = CENTER.x * w
        const cyC = CENTER.y * h
        const cR = CENTER_RADIUS
        const nodePixels = new Map(positionedNodes.map(node => [
            node.id,
            {
                x: w / 2 + (node.x - 0.5) * h,
                y: h / 2 + (node.y - 0.5) * h,
            }
        ]))

        // Draw edges (center-to-center; outer nodes + center circle drawn on top create natural gap)
        positionedNodes.forEach((node) => {
            const { x: nx, y: ny } = nodePixels.get(node.id)!
            ctx.beginPath()
            ctx.moveTo(nx, ny)
            ctx.lineTo(cxC, cyC)
            ctx.strokeStyle = "rgba(71,85,105,0.7)"
            ctx.lineWidth = 1
            ctx.setLineDash([9, 14])
            ctx.stroke()
            ctx.setLineDash([])
        })

        // Draw outer nodes
        positionedNodes.forEach((node) => {
            const { x: nx, y: ny } = nodePixels.get(node.id)!
            const style = NODE_STYLES[node.type as keyof typeof NODE_STYLES]
            const r = OUTER_RADIUS

            ctx.beginPath()
            ctx.arc(nx, ny, r, 0, Math.PI * 2)
            ctx.fillStyle = style.fill
            ctx.fill()
            ctx.strokeStyle = style.stroke
            ctx.lineWidth = 1.8
            ctx.stroke()

            if (node.type === "person") {
                const avatarImg = avatarImgsRef.current[node.id]
                if (avatarImg) {
                    ctx.save()
                    ctx.beginPath()
                    ctx.arc(nx, ny, r - 1, 0, Math.PI * 2)
                    ctx.clip()
                    ctx.drawImage(avatarImg, nx - r, ny - r, r * 2, r * 2)
                    ctx.restore()
                } else {
                    drawPersonAvatar(ctx, node, nx, ny, r)
                }
                ctx.beginPath()
                ctx.arc(nx, ny, r, 0, Math.PI * 2)
                ctx.strokeStyle = style.stroke
                ctx.lineWidth = 2
                ctx.stroke()
            } else if (node.type === "system") {
                drawSystemLogo(ctx, node.id, nx, ny, r * 2, {
                    linear:  linearIconRef.current,
                    zoom:    zoomIconRef.current,
                    slack:   slackIconRef.current,
                    github:  githubIconRef.current,
                    notion:  notionIconRef.current,
                })
            } else if (node.type === "repo") {
                drawRepoIcon(ctx, nx, ny, OUTER_RADIUS * 2, node.label)
            }
        })

        // (central node rendered as HTML overlay — see JSX below)

        // Active pulse
        if (isPulseActive && outerNode) {
            const { x: outerX, y: outerY } = nodePixels.get(outerNode.id) || { x: cxC, y: cyC }

            const fromCenter = !isInbound
            const startPt = fromCenter
                ? borderPoint(cxC, cyC, cR, outerX, outerY)
                : borderPoint(outerX, outerY, OUTER_RADIUS, cxC, cyC)
            const endPt = fromCenter
                ? borderPoint(outerX, outerY, OUTER_RADIUS, cxC, cyC)
                : borderPoint(cxC, cyC, cR, outerX, outerY)

            const eased = pulseProgress
            const px = startPt.x + (endPt.x - startPt.x) * eased
            const py = startPt.y + (endPt.y - startPt.y) * eased

            const sourceColor = "#4182F4"

            const trailLen   = 0.35
            const trailStart = Math.max(0, eased - trailLen)
            const tsx = startPt.x + (endPt.x - startPt.x) * trailStart
            const tsy = startPt.y + (endPt.y - startPt.y) * trailStart

            const trailGrad = ctx.createLinearGradient(tsx, tsy, px, py)
            trailGrad.addColorStop(0, "transparent")
            trailGrad.addColorStop(0.3, sourceColor + "20")
            trailGrad.addColorStop(1, sourceColor + "C0")

            ctx.beginPath()
            ctx.moveTo(tsx, tsy)
            ctx.lineTo(px, py)
            ctx.strokeStyle = trailGrad
            ctx.lineWidth = 3
            ctx.lineCap = "round"
            ctx.stroke()

            const dotGlow = ctx.createRadialGradient(px, py, 0, px, py, 24)
            dotGlow.addColorStop(0, sourceColor + "80")
            dotGlow.addColorStop(0.4, sourceColor + "30")
            dotGlow.addColorStop(1, "transparent")
            ctx.beginPath()
            ctx.arc(px, py, 24, 0, Math.PI * 2)
            ctx.fillStyle = dotGlow
            ctx.fill()

            ctx.beginPath()
            ctx.arc(px, py, 4, 0, Math.PI * 2)
            ctx.fillStyle = sourceColor
            ctx.fill()
            ctx.beginPath()
            ctx.arc(px, py, 2, 0, Math.PI * 2)
            ctx.fillStyle = "#ffffff"
            ctx.fill()
        }
    }, [frame, imagesReady])

    // ─── Context card position ─────────────────────────────────────────────────
    const { w: dw, h: dh } = dims
    const cxC_ = CENTER.x * dw
    const cyC_ = CENTER.y * dh
    const cardW  = 290
    const cardGap = 20
    const cardX  = cxC_ - cardW / 2
    const cardY  = outerNode && outerNode.y < 0.5
        ? cyC_ + CENTER_RADIUS + cardGap
        : cyC_ - CENTER_RADIUS - cardGap

    // Card slides in from below or above (frame-derived, not CSS animation)
    const slideOffset = outerNode && outerNode.y < 0.5
        ? (1 - cardOpacity) * 6   // slide up from below
        : -(1 - cardOpacity) * 6  // slide down from above
    const cardTransform = outerNode && outerNode.y >= 0.5
        ? `translateY(-100%) translateY(${slideOffset}px)`
        : `translateY(${slideOffset}px)`

    const accent = SOURCE_ACCENT[currentMsg.source] || "#888"

    const fgSize    = Math.min(width, height) * 0.14
    const MAX_ZOOM  = 3.0
    const maxFgSize = fgSize * MAX_ZOOM

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                fontFamily: '"SF Pro Display","Inter",system-ui,sans-serif',
            }}
        >
            
            {/* Central FineGrained node — exact same element as Step 6 */}
            <div style={{
                position: "absolute",
                left: cxC_,
                top: cyC_,
                transform: `translate(-50%, -50%) scale(${1 / MAX_ZOOM})`,
                transformOrigin: "center center",
                opacity: nodeOpacity,
                zIndex: 8,
            }}>
                {rippleProg > 0 && rippleProg < 1 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: -rippleProg * 50 * MAX_ZOOM,
                            borderRadius: "50%",
                            border: `2px solid rgba(65,130,244,${0.4 * (1 - rippleProg)})`,
                            pointerEvents: "none",
                        }}
                    />
                )}
                <div style={{
                    width: maxFgSize,
                    height: maxFgSize,
                    borderRadius: "50%",
                    background: "radial-gradient(circle at 36% 34%, #5a9cf5, #2d6ad6)",
                    boxShadow: `0 0 ${32 * MAX_ZOOM}px rgba(37,99,235,0.4)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <div
                        style={{ width: maxFgSize * 0.45, height: maxFgSize * 0.45 }}
                        dangerouslySetInnerHTML={{
                            __html: FINEGRAINED_SVG.replace(/<svg /, '<svg style="width:100%;height:100%" '),
                        }}
                    />
                </div>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />

        </div>
    )
}