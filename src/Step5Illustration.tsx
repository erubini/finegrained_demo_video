import { useMemo } from "react"
import { useCurrentFrame, useVideoConfig } from "remotion"
import { PHASES, buildPhases } from "./config"
import WindowFrame from "./WindowFrame"

function ease(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function clamp(t: number) {
    return Math.max(0, Math.min(1, t))
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

const CONTEXT_LEFT = [
    { id: "cl0", y: 0.32 },
    { id: "cl1", y: 0.48 },
]

const CONTEXT_RIGHT = [
    { id: "cr0", y: 0.38 },
    { id: "cr1", y: 0.55 },
]

export default function Step5Illustration() {
    const frame = useCurrentFrame()
    const { durationInFrames, width, height } = useVideoConfig()
    const progress = frame / durationInFrames

    const dims = { w: width, h: height }
    const base = Math.min(width, height)

    const anim = useMemo(() => {
        const { starts, weights } = buildPhases(PHASES.step5)
        const p = (key: string) => ({
            start:  (starts  as Record<string, number>)[key],
            weight: (weights as Record<string, number>)[key],
        })
        return {
            cardVis:      ease(clamp((progress - p("card").start)     / (p("card").weight     * 0.7))),
            expandProg:   ease(clamp((progress - p("expand").start)   /  p("expand").weight)),
            contextProg:  ease(clamp((progress - p("context").start)  /  p("context").weight)),
            promptProg:   ease(clamp((progress - p("prompt").start)   /  p("prompt").weight)),
            slideOutProg: ease(clamp((progress - p("slideOut").start) /  p("slideOut").weight)),
        }
    }, [progress])

    const cardW    = base * 0.52
    const cardMinH = base * 0.08
    const cardMaxH = base * 0.85
    const cardH    = lerp(cardMinH, cardMaxH, anim.expandProg)
    const cardX    = dims.w * 0.52 - cardW / 2
    const cardY    = dims.h * 0.5  - cardH / 2
    const pad      = base * 0.02

    const snippetW = base * 0.12
    const snippetH = base * 0.065

    const accentBlue = "#2563eb"

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
            {/* SVG — dashed lines from snippets to card */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}>
                {anim.contextProg > 0.1 && (
                    <>
                        {CONTEXT_LEFT.map((s, i) => {
                            const snippetX = lerp(-snippetW, cardX - snippetW * 0.6, anim.contextProg)
                            const sy = cardY + cardH * s.y
                            const tx = cardX + 2
                            const cpx = (snippetX + snippetW + tx) / 2
                            return (
                                <path
                                    key={`lcl-${i}`}
                                    d={`M ${snippetX + snippetW} ${sy} C ${cpx} ${sy}, ${cpx} ${sy}, ${tx} ${sy}`}
                                    stroke="rgba(100,116,139,0.3)" strokeWidth="1.5" strokeDasharray="3 3" fill="none"
                                    opacity={anim.contextProg * (1 - anim.slideOutProg)}
                                />
                            )
                        })}
                        {CONTEXT_RIGHT.map((s, i) => {
                            const snippetX = lerp(dims.w + snippetW, cardX + cardW + snippetW * 0.6, anim.contextProg)
                            const sy = cardY + cardH * s.y
                            const tx = cardX + cardW - 2
                            const cpx = (snippetX - snippetW + tx) / 2
                            return (
                                <path
                                    key={`lcr-${i}`}
                                    d={`M ${snippetX - snippetW} ${sy} C ${cpx} ${sy}, ${cpx} ${sy}, ${tx} ${sy}`}
                                    stroke="rgba(100,116,139,0.3)" strokeWidth="1.5" strokeDasharray="3 3" fill="none"
                                    opacity={anim.contextProg * (1 - anim.slideOutProg)}
                                />
                            )
                        })}
                    </>
                )}
            </svg>

            {/* Left context snippets */}
            {anim.contextProg > 0.01 && CONTEXT_LEFT.map((s, i) => {
                const sx = lerp(-snippetW - 20, cardX - snippetW * 0.6 - snippetW, anim.contextProg)
                const sy = cardY + cardH * s.y - snippetH / 2
                return (
                    <div key={`sl-${i}`} style={{
                        position: "absolute", left: sx, top: sy,
                        width: snippetW, height: snippetH, borderRadius: 6,
                        background: "rgba(255,255,255,0.95)", border: "1px solid rgba(100,116,139,0.15)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        opacity: anim.contextProg * (1 - anim.slideOutProg),
                        zIndex: 3, padding: snippetH * 0.15,
                        display: "flex", flexDirection: "column", gap: snippetH * 0.1, justifyContent: "center",
                    }}>
                        <div style={{ width: "70%", height: 2.5, borderRadius: 1, background: "rgba(148,163,184,0.3)" }} />
                        <div style={{ width: "55%", height: 2.5, borderRadius: 1, background: "rgba(148,163,184,0.2)" }} />
                        <div style={{ width: "85%", height: 2.5, borderRadius: 1, background: "rgba(148,163,184,0.25)" }} />
                        <div style={{ position: "absolute", top: 4, right: 4 }}>
                            <svg width="10" height="8" viewBox="0 0 14 10" fill="none">
                                <path d="M4 .5L.5 5 4 9.5M10 .5L13.5 5 10 9.5" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                )
            })}

            {/* Right context snippets */}
            {anim.contextProg > 0.01 && CONTEXT_RIGHT.map((s, i) => {
                const sx = lerp(dims.w + 20, cardX + cardW + snippetW * 0.6, anim.contextProg)
                const sy = cardY + cardH * s.y - snippetH / 2
                return (
                    <div key={`sr-${i}`} style={{
                        position: "absolute", left: sx, top: sy,
                        width: snippetW, height: snippetH, borderRadius: 6,
                        background: "rgba(255,255,255,0.95)", border: "1px solid rgba(100,116,139,0.15)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        opacity: anim.contextProg * (1 - anim.slideOutProg),
                        zIndex: 3, padding: snippetH * 0.15,
                        display: "flex", flexDirection: "column", gap: snippetH * 0.1, justifyContent: "center",
                    }}>
                        <div style={{ width: "60%", height: 2.5, borderRadius: 1, background: "rgba(148,163,184,0.25)" }} />
                        <div style={{ width: "80%", height: 2.5, borderRadius: 1, background: "rgba(148,163,184,0.3)" }} />
                        <div style={{ width: "50%", height: 2.5, borderRadius: 1, background: "rgba(148,163,184,0.2)" }} />
                        <div style={{ position: "absolute", top: 4, right: 4 }}>
                            <svg width="10" height="8" viewBox="0 0 14 10" fill="none">
                                <path d="M4 .5L.5 5 4 9.5M10 .5L13.5 5 10 9.5" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                )
            })}

            {/* Main ticket card */}
            {anim.cardVis > 0.01 && (
                <WindowFrame
                    x={cardX} y={cardY} w={cardW} h={cardH}
                    base={base} pad={pad}
                    entryVis={anim.cardVis}
                    contentTranslateX={-anim.slideOutProg * (cardW + pad * 2)}
                >
                    {/* Task description section */}
                    {anim.expandProg > 0.05 && (
                        <div style={{ padding: `${pad}px`, opacity: clamp(anim.expandProg * 3), display: "flex", flexDirection: "column", gap: pad * 0.4 }}>
                            <div style={{ fontSize: Math.max(7, base * 0.014), fontFamily: '"SF Mono","Fira Code",monospace', color: "#94a3b8", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
                                Task
                            </div>
                            <div style={{ width: "85%", height: base * 0.01, borderRadius: 1.5, background: "rgba(148,163,184,0.25)" }} />
                            <div style={{ width: "70%", height: base * 0.01, borderRadius: 1.5, background: "rgba(148,163,184,0.2)" }} />
                            <div style={{ width: "60%", height: base * 0.01, borderRadius: 1.5, background: "rgba(148,163,184,0.15)" }} />
                        </div>
                    )}

                    {/* Divider */}
                    {anim.expandProg > 0.3 && (
                        <div style={{ height: 1, background: "rgba(100,116,139,0.08)", margin: `0 ${pad}px`, opacity: clamp((anim.expandProg - 0.3) * 3) }} />
                    )}

                    {/* Context section */}
                    {anim.contextProg > 0.05 && (
                        <div style={{ padding: `${pad}px`, opacity: clamp(anim.contextProg * 2), display: "flex", flexDirection: "column", gap: pad * 0.4, flex: 1, overflow: "hidden" }}>
                            <div style={{ fontSize: Math.max(7, base * 0.014), fontFamily: '"SF Mono","Fira Code",monospace', color: "#94a3b8", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
                                Context
                            </div>
                            {[0.75, 0.6, 0.85, 0.5, 0.72, 0.64, 0.88, 0.55, 0.78, 0.48, 0.82, 0.67, 0.59, 0.91, 0.53, 0.76, 0.44, 0.83, 0.62, 0.70, 0.57, 0.79].map((w, i) => (
                                <div key={`ci-${i}`} style={{ display: "flex", alignItems: "center", gap: pad * 0.3, opacity: clamp((anim.contextProg - i * 0.03) * 3) }}>
                                    <div style={{ width: base * 0.008, height: base * 0.008, borderRadius: "50%", background: accentBlue, opacity: 0.3, flexShrink: 0 }} />
                                    <div style={{ width: `${w * 80}%`, height: base * 0.009, borderRadius: 1.5, background: "rgba(148,163,184,0.2)" }} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Divider */}
                    {anim.promptProg > 0.05 && (
                        <div style={{ height: 1, background: "rgba(100,116,139,0.08)", margin: `0 ${pad}px`, opacity: clamp(anim.promptProg * 3) }} />
                    )}

                    {/* Code prompt section */}
                    {anim.promptProg > 0.05 && (
                        <div style={{ padding: `${pad}px`, opacity: clamp(anim.promptProg * 2), display: "flex", flexDirection: "column", gap: pad * 0.35 }}>
                            <div style={{ fontSize: Math.max(7, base * 0.014), fontFamily: '"SF Mono","Fira Code",monospace', color: "#94a3b8", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
                                Prompt
                            </div>
                            <div style={{ background: "rgba(15,23,42,0.04)", borderRadius: 6, padding: `${pad * 0.6}px`, display: "flex", flexDirection: "column", gap: pad * 0.25 }}>
                                {[0.9, 0.5, 0.75, 0.4, 0.65].map((w, i) => (
                                    <div key={`pl-${i}`} style={{ display: "flex", alignItems: "center", gap: pad * 0.3, opacity: clamp((anim.promptProg - i * 0.1) * 3) }}>
                                        <div style={{ width: base * 0.015, fontSize: Math.max(6, base * 0.01), fontFamily: '"SF Mono","Fira Code",monospace', color: "rgba(148,163,184,0.4)", textAlign: "right", flexShrink: 0 }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ width: `${w * 75}%`, height: base * 0.008, borderRadius: 1, background: i === 0 || i === 4 ? "rgba(37,99,235,0.15)" : "rgba(148,163,184,0.15)" }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </WindowFrame>
            )}
        </div>
    )
}
