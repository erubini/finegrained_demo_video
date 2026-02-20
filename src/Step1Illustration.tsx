import { useMemo } from "react"
import { useCurrentFrame, useVideoConfig } from "remotion"
import { PHASES, buildPhases } from "./config"

/*
  Step1Illustration — "Own Your Context"

  Adapted for Remotion. Progress is now frame-driven instead of scroll-driven.
  Dimensions are fixed to the composition size instead of using ResizeObserver.

  Sequence:
    0.00–0.35  Outer nodes appear (staggered)
    0.42–0.62  Edges draw to center
    0.62–0.74  Center node appears
    0.75–1.00  Glow dots travel from outer nodes → center
    0.85–1.00  Center pulse ring expands
*/

const CENTER = { x: 50, y: 50 }

const NODES = [
    { id: "core", label: "/core", type: "repo", appear: 0.0 },
    { id: "api", label: "/api", type: "repo", appear: 0.05 },
    { id: "ml", label: "/ml", type: "repo", appear: 0.1 },
    { id: "infra", label: "/infra", type: "repo", appear: 0.15 },
    { id: "github", label: "GitHub", type: "system", appear: 0.18 },
    { id: "slack", label: "Slack", type: "system", appear: 0.21 },
    { id: "notion", label: "Notion", type: "system", appear: 0.24 },
    { id: "zoom", label: "Zoom", type: "system", appear: 0.27 },
    { id: "linear", label: "Linear", type: "system", appear: 0.3 },
]

function ease(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function clamp(t: number) {
    return Math.max(0, Math.min(1, t))
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
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
</svg>
`.trim()

const LINEAR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="200" height="200" viewBox="0 0 100 100">
<path fill="#222326" d="M1.22541 61.5228c-.2225-.9485.90748-1.5459 1.59638-.857L39.3342 97.1782c.6889.6889.0915 1.8189-.857 1.5964C20.0515 94.4522 5.54779 79.9485 1.22541 61.5228ZM.00189135 46.8891c-.01764375.2833.08887215.5599.28957165.7606L52.3503 99.7085c.2007.2007.4773.3075.7606.2896 2.3692-.1476 4.6938-.46 6.9624-.9259.7645-.157 1.0301-1.0963.4782-1.6481L2.57595 39.4485c-.55186-.5519-1.49117-.2863-1.648174.4782-.465915 2.2686-.77832 4.5932-.92588465 6.9624ZM4.21093 29.7054c-.16649.3738-.08169.8106.20765 1.1l64.77602 64.776c.2894.2894.7262.3742 1.1.2077 1.7861-.7956 3.5171-1.6927 5.1855-2.684.5521-.328.6373-1.0867.1832-1.5407L8.43566 24.3367c-.45409-.4541-1.21271-.3689-1.54074.1832-.99132 1.6684-1.88843 3.3994-2.68399 5.1855ZM12.6587 18.074c-.3701-.3701-.393-.9637-.0443-1.3541C21.7795 6.45931 35.1114 0 49.9519 0 77.5927 0 100 22.4073 100 50.0481c0 14.8405-6.4593 28.1724-16.7199 37.3375-.3903.3487-.984.3258-1.3542-.0443L12.6587 18.074Z"/>
</svg>
`.trim()

const ZOOM_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150">
<path fill="#0b5cff" d="M100.051 104.226c0 6.917-5.608 12.525-12.525 12.525H33.253c-13.835 0-25.05-11.215-25.05-25.05V45.778c0-6.917 5.608-12.525 12.525-12.525h54.274c13.835 0 25.05 11.215 25.05 25.05v58.448ZM131.78 40.766l-18.37 13.777c-3.154 2.366-5.01 6.078-5.01 10.02v20.874c0 3.943 1.856 7.655 5.01 10.02l18.37 13.777c4.128 3.096 10.02.151 10.02-5.01V45.776c0-5.16-5.892-8.106-10.02-5.01Z"/>
</svg>
`.trim()

const SLACK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127 127">
  <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A"/>
  <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0"/>
  <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="#2EB67D"/>
  <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E"/>
</svg>
`.trim()

const GITHUB_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96">
<path fill="#24292f" d="M41.44 69.38C28.81 67.85 19.91 58.76 19.91 46.99c0-4.79 1.72-9.95 4.59-13.4-1.24-3.16-1.05-9.86.39-12.63 3.83-.48 9 1.53 12.06 4.3 3.64-1.14 7.47-1.72 12.16-1.72s7.81.58 11.26 1.63c2.97-2.68 8.23-4.69 12.06-4.21 1.34 2.58 1.53 9.28.29 12.54 3.06 3.64 4.69 8.52 4.69 13.5 0 11.77-8.9 20.67-21.72 22.3 3.25 2.1 5.46 6.7 5.46 11.96v9.95c0 2.87 2.39 4.5 5.26 3.35C84.41 87.95 98 70.63 98 49.19 98 22.11 75.99 0 48.9 0 21.82 0 0 22.11 0 49.19c0 21.25 13.49 38.86 31.68 45.46 2.58.96 5.07-.76 5.07-3.35v-7.66c-1.34.57-3.06.96-4.59.96-6.32 0-10.05-3.45-12.73-9.86-1.05-2.58-2.2-4.11-4.4-4.4-1.15-.1-1.53-.57-1.53-1.15 0-1.15 1.91-2.01 3.83-2.01 2.78 0 5.17 1.72 7.66 5.26 1.91 2.78 3.92 4.02 6.31 4.02s4.53-.86 6.73-3.06c1.63-1.63 2.87-3.06 4.02-4.02Z"/>
</svg>
`.trim()

const NOTION_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
<path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#fff"/>
<path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="#000"/>
</svg>
`.trim()

const icons: Record<string, string> = {
    github: GITHUB_SVG,
    slack: SLACK_SVG,
    notion: NOTION_SVG,
    zoom: ZOOM_SVG,
    linear: LINEAR_SVG,
}

export default function Step1Illustration() {
    // ─── Remotion: derive progress from current frame ───────────────────────
    const frame = useCurrentFrame()
    const { durationInFrames, width, height } = useVideoConfig()
    const progress = frame / durationInFrames

    // ─── Fixed dimensions from composition config (replaces ResizeObserver) ──
    const nodeSize = Math.min(width, height) * 0.09
    const centerSize = Math.min(width, height) * 0.15

    // ─── Node positions ──────────────────────────────────────────────────────
    const positionedNodes = useMemo(() => {
        const orbitR = 38  // radius in SVG units within 0-100 square
        const svgOffsetX = (width - height) / 2  // 280px for 1280×720
    
        return NODES.map((node, i) => {
            const angle = (i / NODES.length) * Math.PI * 2 - Math.PI / 2
            const svgX = 50 + Math.cos(angle) * orbitR
            const svgY = 50 + Math.sin(angle) * orbitR
            // Convert SVG square coords to CSS % of the full frame
            const cssX = (svgOffsetX + (svgX / 100) * height) / width * 100
            const cssY = svgY
            return { ...node, x: svgX, y: svgY, cssX, cssY }
        })
    }, [width, height])

    // ─── Animation phases ────────────────────────────────────────────────────
    const anim = useMemo(() => {
        const { starts, weights } = buildPhases(PHASES.step1) // change stepN per component
        const p = (key: string) => ({
            start:  (starts  as Record<string, number>)[key],
            weight: (weights as Record<string, number>)[key],
        })
        
        const nodes: Record<string, number> = {}
        positionedNodes.forEach((n, i) => {
            const stagger = (i / positionedNodes.length) * p("nodes").weight
            nodes[n.id] = ease(
                clamp(
                    (progress - p("nodes").start - stagger) /
                        (p("nodes").weight * 0.35)
                )
            )
        })

        return {
            nodes,
            edgeDraw:    clamp((progress - p("edges").start) / p("edges").weight),
            centerScale: ease(clamp((progress - p("center").start) / p("center").weight)),
            centerGlow:  clamp((progress - p("glow").start) / p("glow").weight),
            pulse:       clamp((progress - p("pulse").start) / p("pulse").weight),
            centerPulse: clamp((progress - p("centerPulse").start) / p("centerPulse").weight),
        }
    }, [progress, positionedNodes])

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Edges + glow pulses */}
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                }}
            >
                {positionedNodes.map((node) => {
                    const nVis = anim.nodes[node.id]
                    if (nVis < 0.1) return null
                    const ep = ease(clamp(anim.edgeDraw))
                    return (
                        <line
                            key={`e-${node.id}`}
                            x1={node.x}
                            y1={node.y}
                            x2={lerp(node.x, CENTER.x, ep)}
                            y2={lerp(node.y, CENTER.y, ep)}
                            stroke="rgba(148,163,184,0.25)"
                            strokeWidth="0.35"
                            strokeDasharray="1.2 2"
                            opacity={nVis}
                        />
                    )
                })}

                {anim.pulse > 0 &&
                    positionedNodes.map((node) => {
                        const t = ease(clamp(anim.pulse))
                        if (t <= 0 || t >= 0.99) return null
                        const fade = t < 0.3 ? t / 0.3 : t > 0.7 ? (1 - t) / 0.3 : 1
                        const px = lerp(node.x, CENTER.x, t)
                        const py = lerp(node.y, CENTER.y, t)
                        const trailLen = 0.35
                        const tStart = Math.max(0, t - trailLen)
                        const tx = lerp(node.x, CENTER.x, tStart)
                        const ty = lerp(node.y, CENTER.y, tStart)
                        const gradId = `trail-${node.id}`
                        return (
                            <g key={`p-${node.id}`} opacity={fade}>
                                <defs>
                                    <linearGradient
                                        id={gradId}
                                        x1={tx} y1={ty} x2={px} y2={py}
                                        gradientUnits="userSpaceOnUse"
                                    >
                                        <stop offset="0%"   stopColor="#4182F4" stopOpacity="0" />
                                        <stop offset="30%"  stopColor="#4182F4" stopOpacity="0.12" />
                                        <stop offset="100%" stopColor="#4182F4" stopOpacity="0.75" />
                                    </linearGradient>
                                    <radialGradient
                                        id={`glow-${node.id}`}
                                        cx={px} cy={py} r="3"
                                        gradientUnits="userSpaceOnUse"
                                    >
                                        <stop offset="0%"   stopColor="#4182F4" stopOpacity="0.5" />
                                        <stop offset="40%"  stopColor="#4182F4" stopOpacity="0.18" />
                                        <stop offset="100%" stopColor="#4182F4" stopOpacity="0" />
                                    </radialGradient>
                                </defs>
                                <line
                                    x1={tx} y1={ty} x2={px} y2={py}
                                    stroke={`url(#${gradId})`}
                                    strokeWidth="0.6"
                                    strokeLinecap="round"
                                />
                                <circle cx={px} cy={py} r="3" fill={`url(#glow-${node.id})`} />
                                <circle cx={px} cy={py} r="0.8" fill="#4182F4" />
                                <circle cx={px} cy={py} r="0.4" fill="#ffffff" />
                            </g>
                        )
                    })}
            </svg>

            {/* Center node */}
            <div
                style={{
                    position: "absolute",
                    left: `${CENTER.x}%`,
                    top: `${CENTER.y}%`,
                    transform: `translate(-50%,-50%) scale(${anim.centerScale})`,
                    opacity: anim.centerScale,
                    zIndex: 5,
                }}
            >
                {anim.centerPulse > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: -10 - anim.centerPulse * 20,
                            borderRadius: "50%",
                            border: `2px solid rgba(65,130,244,${0.4 * (1 - anim.centerPulse)})`,
                            pointerEvents: "none",
                        }}
                    />
                )}
                <div
                    style={{
                        width: centerSize,
                        height: centerSize,
                        borderRadius: "50%",
                        background: "radial-gradient(circle at 36% 34%, #5a9cf5, #2d6ad6)",
                        boxShadow:
                            anim.centerGlow > 0
                                ? `0 0 ${10 + anim.centerGlow * 35}px rgba(65,130,244,${0.15 + anim.centerGlow * 0.45})`
                                : "0 2px 8px rgba(65,130,244,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{ width: centerSize * 0.45, height: centerSize * 0.45 }}
                        dangerouslySetInnerHTML={{
                            __html: FINEGRAINED_SVG.replace(
                                /<svg /,
                                '<svg style="width:100%;height:100%" '
                            ),
                        }}
                    />
                </div>
            </div>

            {/* Outer nodes */}
            {positionedNodes.map((node) => {
                const vis = anim.nodes[node.id]
                if (vis < 0.01) return null
                const isRepo = node.type === "repo"
                return (
                    <div
                        key={node.id}
                        style={{
                            position: "absolute",
                            left: `${node.cssX}%`,
                            top:  `${node.cssY}%`,
                            transform: `translate(-50%,-50%) scale(${0.4 + vis * 0.6})`,
                            opacity: vis,
                            zIndex: 4,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        <div
                            style={{
                                width: nodeSize,
                                height: nodeSize,
                                borderRadius: "50%",
                                background: isRepo ? "#fef2f2" : "#f8fafc",
                                border: `1.5px solid ${isRepo ? "rgba(239,68,68,0.25)" : "rgba(100,116,139,0.15)"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                boxShadow:
                                    anim.pulse > 0
                                        ? `0 0 ${anim.pulse * 10}px ${isRepo ? "rgba(239,68,68,0.12)" : "rgba(65,130,244,0.12)"}`
                                        : "0 1px 3px rgba(0,0,0,0.04)",
                            }}
                        >
                            {isRepo ? (
                                <div
                                    style={{
                                        transform: `scale(${nodeSize / 44})`,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                    }}
                                >
                                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                                        <path
                                            d="M4 .5L.5 5 4 9.5M10 .5L13.5 5 10 9.5"
                                            stroke="#ef4444"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <span
                                        style={{
                                            fontSize: 7,
                                            fontWeight: 700,
                                            color: "#ef4444",
                                            fontFamily: '"SF Mono","Fira Code",monospace',
                                            marginTop: 1,
                                        }}
                                    >
                                        {node.label}
                                    </span>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        width: nodeSize * 0.55,
                                        height: nodeSize * 0.55,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: icons[node.id].replace(
                                            /<svg /,
                                            '<svg style="width:100%;height:100%" '
                                        ),
                                    }}
                                />
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}