import { useMemo } from "react"
import { useCurrentFrame, useVideoConfig } from "remotion"
import { PHASES, buildPhases } from "./config"
import WindowFrame from "./WindowFrame"

/*
  Step6Illustration — "Close the Loop"

  Adapted for Remotion. Progress is frame-driven instead of scroll-driven.
  Dimensions are fixed to composition size instead of ResizeObserver.
  CSS transitions removed (not supported in headless renderer).

  Sequence:
    Phase 1 (diff):   Code diff fills the entire window
    Phase 2 (cards):  3 cards appear on the right: Code Review, Agent Reasoning, Code Comments
    Phase 3 (shift):  Diff + cards shift left, FineGrained node appears on the right
    Phase 4 (flow):   Light pulses from each card to the FineGrained node
    Phase 5 (pulse):  FineGrained node pulses/glows
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

const DIFF_LINES = [
    { type: "context", w: 0.7  },
    { type: "context", w: 0.55 },
    { type: "context", w: 0.85 },
    { type: "removed", w: 0.65 },
    { type: "removed", w: 0.45 },
    { type: "added",   w: 0.75 },
    { type: "added",   w: 0.6  },
    { type: "added",   w: 0.5  },
    { type: "context", w: 0.8  },
    { type: "removed", w: 0.55 },
    { type: "added",   w: 0.7  },
    { type: "added",   w: 0.4  },
    { type: "context", w: 0.65 },
    { type: "context", w: 0.9  },
    { type: "context", w: 0.5  },
    { type: "context", w: 0.75 },
    { type: "removed", w: 0.6  },
    { type: "removed", w: 0.8  },
    { type: "removed", w: 0.45 },
    { type: "added",   w: 0.7  },
    { type: "added",   w: 0.85 },
    { type: "added",   w: 0.55 },
    { type: "added",   w: 0.65 },
    { type: "context", w: 0.9  },
    { type: "context", w: 0.4  },
    { type: "context", w: 0.7  },
    { type: "context", w: 0.6  },
    { type: "removed", w: 0.75 },
    { type: "added",   w: 0.8  },
    { type: "added",   w: 0.5  },
    { type: "context", w: 0.65 },
    { type: "context", w: 0.85 },
    { type: "context", w: 0.55 },
    { type: "context", w: 0.7  },
]

const CARDS = [
    { id: "review",    label: "Code Review",            color: "#f97316", y: 0.18 },
    { id: "reasoning", label: "Agent Reasoning Traces", color: "#7c3aed", y: 0.48 },
    { id: "comments",  label: "Code Comments",          color: "#2563eb", y: 0.78 },
]

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

export default function Step6Illustration() {
    // ─── Remotion: derive progress from current frame ────────────────────────
    const frame = useCurrentFrame()
    const { durationInFrames, width, height } = useVideoConfig()
    const progress = frame / durationInFrames

    // ─── Fixed dimensions from composition config ────────────────────────────
    const dims = { w: width, h: height }
    const base = Math.min(width, height)
    const pad  = base * 0.02

    const anim = useMemo(() => {
        const { starts, weights } = buildPhases(PHASES.step6) // change stepN per component
        const p = (key: string) => ({
            start:  (starts  as Record<string, number>)[key],
            weight: (weights as Record<string, number>)[key],
        })

        return {
            diffVis:   ease(clamp((progress - p("diff").start)  /  p("diff").weight)),
            cardsProg: ease(clamp((progress - p("cards").start) /  p("cards").weight)),
            shiftProg: ease(clamp((progress - p("shift").start) /  p("shift").weight)),
            flowProg:       clamp((progress - p("flow").start)  /  p("flow").weight),
            pulseProg: ease(clamp((progress - p("pulse").start) /  p("pulse").weight)),
        }
    }, [progress])

    // Diff panel geometry — matches Step 5 card sizing and position
    const diffW      = base * 0.52
    const diffH      = base * 0.85
    const diffXFinal = dims.w * 0.52 - diffW / 2
    const diffXRest  = lerp(diffXFinal, base * 0.03, anim.shiftProg)
    const diffY      = dims.h * 0.5 - diffH / 2

    // Card dimensions
    const cardW = base * 0.2
    const cardH = base * 0.12

    // Cards X position follows the right edge of the diff panel as it shifts
    const cardBaseX = lerp(diffXFinal + diffW + base * 0.02, base * 0.03 + diffW + base * 0.02, anim.shiftProg)

    // FineGrained node
    const fgX    = dims.w * 0.82
    const fgY    = dims.h * 0.5
    const fgSize = base * 0.14

    const cardPositions = CARDS.map((c) => ({
        x: cardBaseX,
        y: dims.h * c.y,
    }))

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
            {/* SVG — flow lines from cards to FineGrained node */}
            <svg
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 7,
                }}
            >
                {anim.shiftProg > 0.8 &&
                    CARDS.map((card, i) => {
                        const cp  = cardPositions[i]
                        const sx  = cp.x + cardW
                        const sy  = cp.y
                        const tx  = fgX
                        const ty  = fgY
                        const cpx = (sx + tx) / 2

                        const t = ease(clamp(anim.flowProg))
                        if (t <= 0) return null
                        const fade = t < 0.3 ? t / 0.3 : t > 0.7 ? (1 - t) / 0.3 : 1

                        const tStart = Math.max(0, t - 0.3)

                        // Bezier point at t
                        const bx  = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cpx + t * t * tx
                        const by  = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * ((sy + ty) / 2) + t * t * ty
                        const btx = (1 - tStart) * (1 - tStart) * sx + 2 * (1 - tStart) * tStart * cpx + tStart * tStart * tx
                        const bty = (1 - tStart) * (1 - tStart) * sy + 2 * (1 - tStart) * tStart * ((sy + ty) / 2) + tStart * tStart * ty

                        return (
                            <g key={`flow-${card.id}`} opacity={fade * anim.shiftProg}>
                                <path
                                    d={`M ${sx} ${sy} Q ${cpx} ${(sy + ty) / 2}, ${tx} ${ty}`}
                                    stroke="rgba(100,116,139,0.2)"
                                    strokeWidth="1.5"
                                    strokeDasharray="4 4"
                                    fill="none"
                                />
                                <line
                                    x1={btx} y1={bty} x2={bx} y2={by}
                                    stroke="#4182F4"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    opacity="0.6"
                                />
                                <circle cx={bx} cy={by} r={base * 0.02}  fill="#4182F4" opacity="0.15" />
                                <circle cx={bx} cy={by} r={base * 0.008} fill="#4182F4" />
                                <circle cx={bx} cy={by} r={base * 0.004} fill="#ffffff" />
                            </g>
                        )
                    })}
            </svg>

            {/* Code diff panel */}
            <WindowFrame
                x={diffXRest} y={diffY} w={diffW} h={diffH}
                base={base} pad={pad}
                contentTranslateX={(1 - anim.diffVis) * (diffW + pad * 2)}
            >

                    {/* File path bar */}
                    <div
                        style={{
                            background: "rgba(15,23,42,0.03)",
                            padding: `${pad * 0.5}px ${pad * 1.2}px`,
                            borderBottom: "1px solid rgba(100,116,139,0.05)",
                            flexShrink: 0,
                        }}
                    >
                        <div style={{ width: "40%", height: base * 0.007, borderRadius: 1, background: "rgba(148,163,184,0.25)" }} />
                    </div>

                    {/* Diff lines */}
                    <div
                        style={{
                            flex: 1,
                            padding: `${pad}px ${pad * 1.2}px`,
                            display: "flex",
                            flexDirection: "column",
                            gap: pad * 0.35,
                            overflow: "hidden",
                        }}
                    >
                        {DIFF_LINES.map((line, i) => {
                            const barColor = line.type === "added"   ? "rgba(34,197,94,0.35)"  : line.type === "removed" ? "rgba(239,68,68,0.3)"  : "rgba(148,163,184,0.2)"
                            const prefix   = line.type === "added"   ? "+" : line.type === "removed" ? "−" : " "
                            const prefixColor = line.type === "added" ? "#22c55e" : line.type === "removed" ? "#ef4444" : "transparent"

                            return (
                                <div
                                    key={`dl-${i}`}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: pad * 0.4,
                                        padding: `${pad * 0.2}px ${pad * 0.4}px`,
                                    }}
                                >
                                    <span style={{ fontSize: Math.max(7, base * 0.012), fontFamily: '"SF Mono","Fira Code",monospace', color: "rgba(148,163,184,0.4)", width: base * 0.02, textAlign: "right", flexShrink: 0 }}>
                                        {i + 1}
                                    </span>
                                    <span style={{ fontSize: Math.max(8, base * 0.014), fontFamily: '"SF Mono","Fira Code",monospace', color: prefixColor, fontWeight: 700, width: base * 0.012, textAlign: "center", flexShrink: 0 }}>
                                        {prefix}
                                    </span>
                                    <div style={{ width: `${line.w * 80}%`, height: base * 0.008, borderRadius: 1, background: barColor }} />
                                </div>
                            )
                        })}
                    </div>
            </WindowFrame>

            {/* Annotation cards */}
            {CARDS.map((card, i) => {
                const vis = clamp((anim.cardsProg - i * 0.25) * 2.5)
                if (vis < 0.01) return null
                const cp = cardPositions[i]
                return (
                    <div
                        key={card.id}
                        style={{
                            position: "absolute",
                            left: cp.x,
                            top: cp.y - cardH / 2,
                            width: cardW,
                            height: cardH,
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.97)",
                            border: `1.5px solid ${card.color}30`,
                            boxShadow: `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${card.color}08`,
                            opacity: vis,
                            transform: `translateX(${lerp(30, 0, vis)}px) scale(${0.9 + vis * 0.1})`,
                            zIndex: 7,
                            padding: `${pad * 0.8}px ${pad}px`,
                            display: "flex",
                            flexDirection: "column",
                            gap: pad * 0.4,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: pad * 0.4 }}>
                            <div style={{ width: base * 0.01, height: base * 0.01, borderRadius: "50%", background: card.color, opacity: 0.7, flexShrink: 0 }} />
                            <div style={{ fontSize: Math.max(7, base * 0.013), fontFamily: '"SF Mono","Fira Code",monospace', color: card.color, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                {card.label}
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: pad * 0.25 }}>
                            <div style={{ width: "85%", height: base * 0.006, borderRadius: 1, background: `${card.color}20` }} />
                            <div style={{ width: "60%", height: base * 0.006, borderRadius: 1, background: `${card.color}15` }} />
                            <div style={{ width: "72%", height: base * 0.006, borderRadius: 1, background: `${card.color}12` }} />
                        </div>
                    </div>
                )
            })}

            {/* FineGrained node */}
            {anim.shiftProg > 0.3 && (
                <div
                    style={{
                        position: "absolute",
                        left: fgX,
                        top: fgY,
                        transform: `translate(-50%, -50%) scale(${ease(clamp((anim.shiftProg - 0.3) * 2))})`,
                        opacity: ease(clamp((anim.shiftProg - 0.3) * 2)),
                        zIndex: 8,
                    }}
                >
                    <div
                        style={{
                            width: fgSize,
                            height: fgSize,
                            borderRadius: "50%",
                            background: "radial-gradient(circle at 36% 34%, #5a9cf5, #2d6ad6)",
                            boxShadow: anim.pulseProg > 0
                                ? `0 0 ${12 + anim.pulseProg * 50}px rgba(37,99,235,${0.15 + anim.pulseProg * 0.55})`
                                : "0 2px 8px rgba(37,99,235,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{ width: fgSize * 0.45, height: fgSize * 0.45 }}
                            dangerouslySetInnerHTML={{
                                __html: FINEGRAINED_SVG.replace(/<svg /, '<svg style="width:100%;height:100%" '),
                            }}
                        />
                    </div>

                    {/* Pulse ring 1 */}
                    {anim.pulseProg > 0.2 && (
                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: "translate(-50%, -50%)",
                                width:  fgSize * lerp(1, 2.2, ease(clamp((anim.pulseProg - 0.2) * 1.5))),
                                height: fgSize * lerp(1, 2.2, ease(clamp((anim.pulseProg - 0.2) * 1.5))),
                                borderRadius: "50%",
                                border: "1.5px solid rgba(37,99,235,0.2)",
                                opacity: 1 - ease(clamp((anim.pulseProg - 0.5) * 2)),
                                pointerEvents: "none",
                            }}
                        />
                    )}

                    {/* Pulse ring 2 */}
                    {anim.pulseProg > 0.5 && (
                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: "translate(-50%, -50%)",
                                width:  fgSize * lerp(1, 1.8, ease(clamp((anim.pulseProg - 0.5) * 2))),
                                height: fgSize * lerp(1, 1.8, ease(clamp((anim.pulseProg - 0.5) * 2))),
                                borderRadius: "50%",
                                border: "1.5px solid rgba(37,99,235,0.15)",
                                opacity: 1 - ease(clamp((anim.pulseProg - 0.75) * 4)),
                                pointerEvents: "none",
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    )
}