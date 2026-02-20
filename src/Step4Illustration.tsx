import { useMemo } from "react"
import { useCurrentFrame, useVideoConfig } from "remotion"
import { PHASES, buildPhases } from "./config"

/*
  Step4Illustration — "Plan, Align, Approve — Without the Meetings"

  Adapted for Remotion. Progress is frame-driven instead of scroll-driven.
  Dimensions are fixed to composition size instead of ResizeObserver.
  CSS transitions removed (not supported in headless renderer).
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

const ENGINEERS = [
    {
        id: "eng0",
        tickets: [
            { w: 0.75, group: 0 },
            { w: 0.6,  group: 0 },
            { w: 0.85, group: 1 },
        ],
    },
    {
        id: "eng1",
        tickets: [
            { w: 0.7,  group: 0 },
            { w: 0.55, group: 1 },
            { w: 0.8,  group: 1 },
            { w: 0.65, group: 1 },
        ],
    },
    {
        id: "eng2",
        tickets: [
            { w: 0.6, group: 1 },
            { w: 0.9, group: 1 },
        ],
    },
]

const MANAGERS = [
    {
        id: "mgr0",
        groups: [
            { w: 0.8,  topic: 0 },
            { w: 0.65, topic: 1 },
        ],
    },
    {
        id: "mgr1",
        groups: [
            { w: 0.75, topic: 0 },
            { w: 0.55, topic: 1 },
        ],
    },
]

const LEADER = {
    id: "lead0",
    topics: [{ w: 0.85 }, { w: 0.65 }],
}

export default function Step4Illustration() {
    // ─── Remotion: derive progress from current frame ────────────────────────
    const frame = useCurrentFrame()
    const { durationInFrames, width, height } = useVideoConfig()
    const progress = frame / durationInFrames

    // ─── Fixed dimensions from composition config ────────────────────────────
    const dims        = { w: width, h: height }
    const base        = Math.min(width, height)
    const personR     = base * 0.035
    const barH        = base * 0.016
    const barW        = base * 0.1
    const barGap      = barH * 0.65
    const personBarGap = personR * 0.6

    const anim = useMemo(() => {
        const { starts, weights } = buildPhases(PHASES.step4) // change stepN per component
        const p = (key: string) => ({ start: starts[key], weight: weights[key] })

        return {
            engVis:      ease(clamp((progress - p("engineers").start)  / (p("engineers").weight  * 0.6))),
            mgrVis:      ease(clamp((progress - p("managers").start)   / (p("managers").weight   * 0.5))),
            leadVis:     ease(clamp((progress - p("leadership").start) / (p("leadership").weight * 0.5))),
            approveProg: ease(clamp((progress - p("approve").start)    / (p("approve").weight    * 0.4))),
        }
    }, [progress])

    const shift = anim.mgrVis + anim.leadVis

    // Layer Y positions
    const engRowY  = lerp(0.45, 0.78, clamp(shift / 2))
    const mgrRowY  = lerp(0.45, 0.48, clamp(shift - 1))
    const leadRowY = 0.14

    // X positions
    const engXs  = [0.18, 0.48, 0.78]
    const mgrXs  = [0.33, 0.63]
    const leadX  = 0.48

    // Colors
    const engColor     = "#f97316"
    const mgrColor     = "#7c3aed"
    const leadColor    = "#2563eb"
    const approveColor = "#22c55e"

    const approved   = anim.approveProg > 0.3
    const checkScale = ease(clamp((anim.approveProg - 0.3) * 3))

    // Computed positions
    const engPositions = ENGINEERS.map((eng, ei) => {
        const cx = engXs[ei] * dims.w
        const personCy = engRowY * dims.h
        const items = eng.tickets.map((t, ti) => ({
            x: cx,
            y: personCy + personR + personBarGap + ti * (barH + barGap),
            w: barW,
            h: barH,
            group: t.group,
        }))
        return { cx, cy: personCy, items }
    })

    const mgrPositions = MANAGERS.map((mgr, mi) => {
        const cx = mgrXs[mi] * dims.w
        const personCy = mgrRowY * dims.h
        const items = mgr.groups.map((g, gi) => ({
            x: cx,
            y: personCy + personR + personBarGap + gi * (barH * 1.3 + barGap),
            w: barW,
            h: barH * 1.3,
            topic: g.topic,
        }))
        return { cx, cy: personCy, items }
    })

    const leadPosition = (() => {
        const cx = leadX * dims.w
        const personCy = leadRowY * dims.h
        const items = LEADER.topics.map((_, ti) => ({
            x: cx,
            y: personCy + personR + personBarGap + ti * (barH * 1.4 + barGap),
            w: barW,
            h: barH * 1.4,
        }))
        return { cx, cy: personCy, items }
    })()

    // Person icon renderer
    const renderPerson = (
        cx: number,
        cy: number,
        color: string,
        vis: number,
        zIndex: number,
        key: string
    ) => {
        if (vis < 0.01) return null
        return (
            <div
                key={key}
                style={{
                    position: "absolute",
                    left: cx,
                    top: cy,
                    transform: `translate(-50%, -50%) scale(${0.5 + vis * 0.5})`,
                    opacity: vis,
                    zIndex,
                }}
            >
                <div
                    style={{
                        width: personR * 2,
                        height: personR * 2,
                        borderRadius: "50%",
                        background: "#f8fafc",
                        border: `1.5px solid ${color}50`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        position: "relative",
                    }}
                >
                    <svg width={personR * 0.9} height={personR * 0.9} viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
                        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {approved && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: -3,
                                right: -3,
                                width: personR * 0.7,
                                height: personR * 0.7,
                                borderRadius: "50%",
                                background: approveColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: checkScale,
                                transform: `scale(${checkScale})`,
                            }}
                        >
                            <svg width={personR * 0.4} height={personR * 0.4} viewBox="0 0 24 24" fill="none">
                                <path d="M6 13l4 4 8-8" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Bar renderer (no CSS transitions — not supported in headless renderer)
    const renderBar = (
        item: { x: number; y: number; w: number; h: number },
        vis: number,
        baseColor: string,
        zIndex: number,
        key: string
    ) => {
        if (vis < 0.01) return null
        const bg     = approved ? `${approveColor}12` : baseColor
        const border = approved ? `${approveColor}25` : baseColor.replace("0.12", "0.25")
        return (
            <div
                key={key}
                style={{
                    position: "absolute",
                    left: item.x - item.w / 2,
                    top: item.y,
                    width: item.w,
                    height: item.h,
                    borderRadius: 3,
                    background: bg,
                    border: `1px solid ${border}`,
                    opacity: vis,
                    zIndex,
                }}
            />
        )
    }

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
            {/* SVG connections */}
            <svg
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            >
                {/* Engineer items → Manager items */}
                {anim.mgrVis > 0.1 &&
                    engPositions.map((eng, ei) =>
                        eng.items.map((ticket, ti) => {
                            const mgrIdx = ticket.group <= 0 ? 0 : 1
                            const grpIdx = mgrIdx === 0
                                ? Math.min(ticket.group, mgrPositions[0].items.length - 1)
                                : Math.min(ticket.group - 1, mgrPositions[1].items.length - 1)
                            const target = mgrPositions[mgrIdx].items[Math.max(0, grpIdx)]
                            if (!target) return null
                            const goRight = target.x > ticket.x
                            const sx = ticket.x + (goRight ? ticket.w / 2 : -ticket.w / 2)
                            const sy = ticket.y + ticket.h / 2
                            const tx = target.x + (goRight ? -target.w / 2 : target.w / 2)
                            const ty = target.y + target.h / 2
                            const cpx = (sx + tx) / 2
                            return (
                                <path
                                    key={`ct-${ei}-${ti}`}
                                    d={`M ${sx} ${sy} C ${cpx} ${sy}, ${cpx} ${ty}, ${tx} ${ty}`}
                                    stroke="rgba(100,116,139,0.7)"
                                    strokeWidth="1.5"
                                    strokeDasharray="3 3"
                                    fill="none"
                                    opacity={anim.mgrVis}
                                />
                            )
                        })
                    )}

                {/* Manager items → Leader items */}
                {anim.leadVis > 0.1 &&
                    mgrPositions.map((mgr, mi) =>
                        mgr.items.map((group, gi) => {
                            const toIdx = Math.min((group as any).topic ?? 0, leadPosition.items.length - 1)
                            const target = leadPosition.items[toIdx]
                            if (!target) return null
                            const goRight = target.x > group.x
                            const sx = group.x + (goRight ? group.w / 2 : -group.w / 2)
                            const sy = group.y + group.h / 2
                            const tx = target.x + (goRight ? -target.w / 2 : target.w / 2)
                            const ty = target.y + target.h / 2
                            const cpx = (sx + tx) / 2
                            return (
                                <path
                                    key={`cg-${mi}-${gi}`}
                                    d={`M ${sx} ${sy} C ${cpx} ${sy}, ${cpx} ${ty}, ${tx} ${ty}`}
                                    stroke="rgba(100,116,139,0.7)"
                                    strokeWidth="1.5"
                                    strokeDasharray="3 3"
                                    fill="none"
                                    opacity={anim.leadVis}
                                />
                            )
                        })
                    )}
            </svg>

            {/* Labels */}
            {anim.leadVis > 0.01 && (
                <div style={{
                    position: "absolute",
                    left: 8,
                    top: `${(leadRowY - 0.06) * 100}%`,
                    fontSize: Math.max(8, base * 0.017),
                    fontWeight: 600,
                    color: leadColor,
                    fontFamily: '"SF Mono","Fira Code",monospace',
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    opacity: anim.leadVis * 0.7,
                }}>
                    Leadership
                </div>
            )}
            {anim.mgrVis > 0.01 && (
                <div style={{
                    position: "absolute",
                    left: 8,
                    top: `${(mgrRowY - 0.06) * 100}%`,
                    fontSize: Math.max(8, base * 0.017),
                    fontWeight: 600,
                    color: mgrColor,
                    fontFamily: '"SF Mono","Fira Code",monospace',
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    opacity: anim.mgrVis * 0.7,
                }}>
                    Managers
                </div>
            )}
            {anim.engVis > 0.01 && (
                <div style={{
                    position: "absolute",
                    left: 8,
                    top: `${(engRowY - 0.06) * 100}%`,
                    fontSize: Math.max(8, base * 0.017),
                    fontWeight: 600,
                    color: engColor,
                    fontFamily: '"SF Mono","Fira Code",monospace',
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    opacity: anim.engVis * 0.7,
                }}>
                    Engineers
                </div>
            )}

            {/* Leadership */}
            {renderPerson(leadPosition.cx, leadPosition.cy, leadColor, anim.leadVis, 6, "p-lead")}
            {leadPosition.items.map((item, i) =>
                renderBar(item, anim.leadVis, "rgba(65,130,244,0.12)", 5, `lb-${i}`)
            )}

            {/* Managers */}
            {mgrPositions.map((mgr, mi) => (
                <div key={`mg-${mi}`}>
                    {renderPerson(mgr.cx, mgr.cy, mgrColor, anim.mgrVis, 4, `p-mgr-${mi}`)}
                    {mgr.items.map((item, gi) =>
                        renderBar(item, anim.mgrVis, "rgba(129,140,248,0.12)", 3, `gb-${mi}-${gi}`)
                    )}
                </div>
            ))}

            {/* Engineers */}
            {engPositions.map((eng, ei) => (
                <div key={`eg-${ei}`}>
                    {renderPerson(eng.cx, eng.cy, engColor, anim.engVis, 2, `p-eng-${ei}`)}
                    {eng.items.map((item, ti) =>
                        renderBar(item, anim.engVis, "rgba(148,163,184,0.15)", 2, `tb-${ei}-${ti}`)
                    )}
                </div>
            ))}
        </div>
    )
}