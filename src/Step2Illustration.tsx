import { useMemo } from "react"
import { useCurrentFrame, useVideoConfig } from "remotion"
import { PHASES, buildPhases } from "./config"

/*
  Step2Illustration — "Start With What You're Building"

  Adapted for Remotion. Progress is frame-driven instead of scroll-driven.
  Dimensions are fixed to composition size instead of ResizeObserver.
  scannedRef replaced with pure per-frame calculation.

  Sequence:
    Phase 1 (doc):       Document descends from top
    Phase 2 (nodes):     Code nodes appear with inter-node edges
    Phase 3 (magDoc):    Magnifying glass scans over the document
    Phase 4 (magCode):   Magnifying glass moves down, scans over codebase
    Phase 5 (highlight): Blocked nodes turn red
*/

function ease(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function clamp(t: number) {
    return Math.max(0, Math.min(1, t))
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

const CODE_NODES = [
    { id: "auth",       x: 22, y: 37, blocked: true  },
    { id: "payments",   x: 68, y: 38, blocked: false },
    { id: "api-v1",     x: 35, y: 60, blocked: true  },
    { id: "dashboard",  x: 75, y: 58, blocked: false },
    { id: "queue",      x: 52, y: 76, blocked: true  },
    { id: "logging",    x: 20, y: 71, blocked: false },
    { id: "cache",      x: 78, y: 78, blocked: false },
    { id: "ingestion",  x: 50, y: 46, blocked: true  },
    { id: "scheduler",  x: 32, y: 84, blocked: false },
    { id: "middleware", x: 65, y: 68, blocked: true  },
]

const CODE_EDGES = [
    ["auth", "api-v1"],
    ["auth", "middleware"],
    ["api-v1", "ingestion"],
    ["api-v1", "queue"],
    ["ingestion", "queue"],
    ["payments", "dashboard"],
    ["payments", "middleware"],
    ["queue", "scheduler"],
    ["queue", "logging"],
    ["dashboard", "cache"],
    ["middleware", "cache"],
    ["logging", "scheduler"],
]

const DOC = { x: 50, y: 18 }
const MAG_OVER_DOC = { x: 55, y: 20 }

// Pure function: compute mag position at any arbitrary progress value
function getMagPosition(magDocProg: number, magCodeProg: number): { x: number; y: number } {
    const startX = 18, startY = 40
    const endX = 110,  endY = 120
    const waves = 2.5
    const amplitude = 30

    if (magDocProg < 1) {
        return {
            x: lerp(MAG_OVER_DOC.x - 8, MAG_OVER_DOC.x + 8, ease(magDocProg)),
            y: MAG_OVER_DOC.y,
        }
    } else {
        const docEndX = MAG_OVER_DOC.x + 8
        const docEndY = MAG_OVER_DOC.y

        if (magCodeProg < 0.15) {
            const bt = magCodeProg / 0.15
            return {
                x: lerp(docEndX, startX, bt),
                y: lerp(docEndY, startY, bt),
            }
        } else {
            const st = (magCodeProg - 0.15) / 0.85
            const dx = endX - startX
            const dy = endY - startY
            const len = Math.sqrt(dx * dx + dy * dy)
            const perpX = -dy / len
            const perpY =  dx / len
            const wave = Math.sin(st * Math.PI * 2 * waves) * amplitude

            return {
                x: lerp(startX, endX, st) + perpX * wave,
                y: lerp(startY, endY, st) + perpY * wave,
            }
        }
    }
}

export default function Step2Illustration() {
    // ─── Remotion: derive progress from current frame ────────────────────────
    const frame = useCurrentFrame()
    const { durationInFrames, width, height } = useVideoConfig()
    const progress = frame / durationInFrames

    // ─── Fixed dimensions from composition config ────────────────────────────
    const nodeSize  = Math.min(width, height) * 0.065
    const docWidth  = Math.min(width, height) * 0.16
    const docHeight = docWidth * 1.3
    const svgOffsetX = (width - height) / 2
    const toCSS_X = (svgX: number) => (svgOffsetX + (svgX / 100) * height) / width * 100

    const nodeMap = useMemo(() => {
        const map: Record<string, (typeof CODE_NODES)[0]> = {}
        CODE_NODES.forEach((n) => { map[n.id] = n })
        return map
    }, [])

    const anim = useMemo(() => {
        const { starts, weights } = buildPhases(PHASES.step2) // change stepN per component
        const p = (key: string) => ({
            start:  (starts  as Record<string, number>)[key],
            weight: (weights as Record<string, number>)[key],
        })

        // Stagger node appearance
        const nodes: Record<string, number> = {}
        CODE_NODES.forEach((n, i) => {
            const stagger = (i / CODE_NODES.length) * p("nodes").weight
            nodes[n.id] = ease(
                clamp(
                    (progress - p("nodes").start - stagger) /
                        (p("nodes").weight * 0.4)
                )
            )
        })

        const docProg     = clamp((progress - p("doc").start)     / p("doc").weight)
        const magDocProg  = clamp((progress - p("magDoc").start)  / p("magDoc").weight)
        const magCodeProg = (progress - p("magCode").start) / p("magCode").weight
        const magAppear = ease(clamp(magDocProg * 5))
        const extendedMagCodeProg = (progress - p("magCode").start) / p("magCode").weight
        const { x: magX, y: magY } = getMagPosition(magDocProg, extendedMagCodeProg)

        // ─── Scanned: pure calculation ────────────────────────────────────────
        // Sample the mag path at many points up to the current progress
        // and record which blocked nodes it has passed close to.
        const scanned: Record<string, boolean> = {}
        if (magCodeProg > 0) {
            const SAMPLES = 120
            for (let s = 0; s <= SAMPLES; s++) {
                const sampleMagCodeProg = (s / SAMPLES) * magCodeProg
                const { x: sx, y: sy } = getMagPosition(1, sampleMagCodeProg)
                CODE_NODES.forEach((node) => {
                    if (!node.blocked) return
                    const dx = node.x - sx
                    const dy = node.y - sy
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < 14) scanned[node.id] = true
                })
            }
        }

        const highlightProg = clamp((progress - p("highlight").start) / p("highlight").weight)
        const magFadeOut = 1 - ease(clamp((progress - (p("magCode").start + p("magCode").weight * 0.8)) / (p("magCode").weight * 0.2)))
        const magOpacity = magAppear * magFadeOut

        return {
            nodes,
            scanned,
            docScale: ease(clamp(docProg / 0.6)),
            docY: ease(docProg),
            magX,
            magY,
            magOpacity,
            magDocProg,
            magCodeProg,
            highlightProg: ease(highlightProg),
            nodeEdgeVis: clamp(
                (progress - (p("nodes").start + p("nodes").weight)) / 0.1
                ),
        }
    }, [progress])

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* SVG layer — inter-node edges */}
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
                {anim.nodeEdgeVis > 0 &&
                    CODE_EDGES.map(([fromId, toId], i) => {
                        const from = nodeMap[fromId]
                        const to   = nodeMap[toId]
                        if (!from || !to) return null
                        const visA = anim.nodes[fromId] || 0
                        const visB = anim.nodes[toId]   || 0
                        const vis  = Math.min(visA, visB) * anim.nodeEdgeVis
                        if (vis < 0.05) return null
                        return (
                            <line
                                key={`ce-${i}`}
                                x1={from.x} y1={from.y}
                                x2={to.x}   y2={to.y}
                                stroke="rgba(148,163,184,0.4)"
                                strokeWidth="0.3"
                                strokeDasharray="1 2"
                                opacity={vis}
                            />
                        )
                    })}
            </svg>

            {/* Document */}
            <div
                style={{
                    position: "absolute",
                    left: `${DOC.x}%`,
                    top: `${lerp(-15, DOC.y, anim.docY)}%`,
                    transform: `translate(-50%, -50%) scale(${anim.docScale})`,
                    opacity: anim.docScale,
                    zIndex: 6,
                }}
            >
                <div
                    style={{
                        width: docWidth,
                        height: docHeight,
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.95)",
                        border: "1.5px solid rgba(65,130,244,0.25)",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                        padding: docWidth * 0.12,
                        display: "flex",
                        flexDirection: "column",
                        gap: docWidth * 0.06,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: 3,
                            borderRadius: 2,
                            background: "linear-gradient(90deg, #4182F4, #60a5fa)",
                            marginBottom: 2,
                        }}
                    />
                    <div
                        style={{
                            width: "70%",
                            height: docWidth * 0.06,
                            borderRadius: 2,
                            background: "rgba(30,41,59,0.7)",
                        }}
                    />
                    {[0.9, 0.75, 0.85, 0.6, 0.8, 0.5, 0.7].map((w, i) => (
                        <div
                            key={i}
                            style={{
                                width: `${w * 100}%`,
                                height: docWidth * 0.035,
                                borderRadius: 1.5,
                                background: `rgba(148,163,184,${0.25 - i * 0.02})`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Code nodes */}
            {CODE_NODES.map((node) => {
                const vis = anim.nodes[node.id]
                if (vis < 0.01) return null

                const isBlocked = node.blocked
                const dx = node.x - anim.magX
                const dy = node.y - anim.magY
                const dist = Math.sqrt(dx * dx + dy * dy)
                const magNear = anim.magOpacity > 0 && dist < 14
                const magGlow = magNear ? clamp(1 - dist / 14) : 0

                const isRed =
                    isBlocked &&
                    (magGlow > 0.3 ||
                        anim.scanned[node.id] ||
                        anim.highlightProg > 0.3)

                const bg     = isRed ? "#fef2f2" : "#f8fafc"
                const border = isRed ? "rgba(239,68,68,0.4)" : "rgba(100,116,139,0.15)"
                const shadow = isRed
                    ? `0 0 ${Math.max(magGlow, anim.highlightProg) * 14}px rgba(239,68,68,0.25)`
                    : magGlow > 0
                        ? `0 0 ${magGlow * 10}px rgba(65,130,244,0.2)`
                        : "0 1px 3px rgba(0,0,0,0.04)"
                const iconColor = isRed ? "#ef4444" : "#94a3b8"

                return (
                    <div
                        key={node.id}
                        style={{
                            position: "absolute",
                            left: `${toCSS_X(node.x)}%`,
                            top: `${node.y}%`,
                            transform: `translate(-50%,-50%) scale(${0.4 + vis * 0.6})`,
                            opacity: vis,
                            zIndex: 4,
                        }}
                    >
                        <div
                            style={{
                                width: nodeSize,
                                height: nodeSize,
                                borderRadius: "50%",
                                background: bg,
                                border: `1.5px solid ${border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: shadow,
                            }}
                        >
                            <div
                                style={{
                                    transform: `scale(${nodeSize / 44})`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                                    <path
                                        d="M4 .5L.5 5 4 9.5M10 .5L13.5 5 10 9.5"
                                        stroke={iconColor}
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                )
            })}

            {/* Magnifying glass */}
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    zIndex: 10,
                    pointerEvents: "none",
                }}
            >
                {anim.magOpacity > 0 && (
                    <g
                        transform={`translate(${anim.magX}, ${anim.magY})`}
                        opacity={anim.magOpacity}
                    >
                        <circle cx="0" cy="0" r="8" fill="none" stroke="rgba(65,130,244,0.15)" strokeWidth="6" />
                        <circle cx="0" cy="0" r="5" fill="rgba(65,130,244,0.06)" stroke="#4182F4" strokeWidth="0.8" />
                        <path
                            d="M -3 -3.5 A 5 5 0 0 1 3.5 -3"
                            fill="none"
                            stroke="rgba(255,255,255,0.4)"
                            strokeWidth="0.6"
                            strokeLinecap="round"
                        />
                        <line x1="3.5" y1="3.5" x2="7" y2="7" stroke="#4182F4" strokeWidth="1.2" strokeLinecap="round" />
                    </g>
                )}
            </svg>
        </div>
    )
}