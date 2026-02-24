import { useMemo } from "react"
import { useCurrentFrame, useVideoConfig } from "remotion"
import { PHASES, buildPhases } from "./config"

function ease(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function clamp(t: number) {
    return Math.max(0, Math.min(1, t))
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

function lerpColor(t: number, from: [number, number, number], to: [number, number, number]): string {
    const r = Math.round(lerp(from[0], to[0], t))
    const g = Math.round(lerp(from[1], to[1], t))
    const b = Math.round(lerp(from[2], to[2], t))
    return `${r},${g},${b}`
}

function hexToRgb(hex: string): [number, number, number] {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ]
}

const CENTER = { x: 50, y: 52 }

const PEOPLE = [
    {
        id: "eng1",
        x: 10,
        y: 15,
        color: "#818cf8",
        circleX: 35,
        circleY: 38,
        annotation: '"auth is stable"',
    },
    {
        id: "eng2",
        x: 90,
        y: 15,
        color: "#34d399",
        circleX: 65,
        circleY: 38,
        annotation: '"auth needs rework"',
    },
    {
        id: "pm",
        x: 10,
        y: 88,
        color: "#fb923c",
        circleX: 35,
        circleY: 65,
        annotation: '"ship Q2, skip tests"',
    },
    {
        id: "lead",
        x: 90,
        y: 88,
        color: "#f472b6",
        circleX: 65,
        circleY: 65,
        annotation: '"tests block Q2"',
    },
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

export default function Step3Illustration() {
    const frame = useCurrentFrame()
    const { durationInFrames, width, height } = useVideoConfig()
    const progress = frame / durationInFrames

    const minDim     = Math.min(width, height)
    const personSize = minDim * 0.09
    const centerSize = minDim * 0.14
    const fontSize   = Math.max(8, minDim * 0.018)

    const svgOffsetX = (width - height) / 2
    const toCSS_X = (svgX: number) => (svgOffsetX + (svgX / 100) * height) / width * 100

    const anim = useMemo(() => {
        const { starts, weights } = buildPhases(PHASES.step3)
        const p = (key: string) => ({
            start:  (starts  as Record<string, number>)[key],
            weight: (weights as Record<string, number>)[key],
        })

        const people: Record<string, number> = {}
        PEOPLE.forEach((person) => {
            people[person.id] = ease(
                clamp(
                    (progress - p("people").start) /
                        (p("people").weight * 0.5)
                )
            )
        })

        const circleProg = ease(clamp((progress - p("circles").start) / p("circles").weight))
        const centerProg = clamp((progress - p("center").start) / p("center").weight)
        const pulseProg  = clamp((progress - p("pulses").start) / p("pulses").weight)
        const mergeProg  = ease(clamp((progress - p("merge").start) / p("merge").weight))
        const colorT     = ease(clamp((mergeProg - 0.85) / 0.15))
        const rippleProg = clamp((progress - (p("merge").start + p("merge").weight)) / 0.08)

        return {
            people,
            circleProg,
            colorT,
            rippleProg,
            centerScale: ease(clamp(centerProg / 0.7)),
            centerGlow:  clamp((centerProg - 0.5) / 0.5),
            pulseProg,
            mergeProg,
        }
    }, [progress])

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* SVG layer */}
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
                {/* Venn circles */}
                {anim.circleProg > 0 &&
                    PEOPLE.map((person) => {
                        const vis = anim.people[person.id]
                        if (vis < 0.1) return null
                        const cx  = lerp(person.circleX, CENTER.x, anim.mergeProg)
                        const cy  = lerp(person.circleY, CENTER.y, anim.mergeProg)
                        const r   = lerp(18, 20, anim.mergeProg)
                        const rgb = lerpColor(anim.colorT, hexToRgb(person.color), [65, 130, 244])
                        return (
                            <circle
                                key={`venn-${person.id}`}
                                cx={cx} cy={cy} r={r}
                                fill={`rgba(${rgb},0.1)`}
                                stroke={`rgba(${rgb},0.5)`}
                                strokeWidth="0.5"
                                opacity={anim.circleProg}
                            />
                        )
                    })}

                {/* Ripple — starts at merged circle edge (r=20), expands outward linearly */}
                {anim.rippleProg > 0 && (
                    <circle
                        cx={CENTER.x}
                        cy={CENTER.y}
                        r={lerp(20, 40, anim.rippleProg)}
                        fill="none"
                        stroke="rgba(65,130,244,0.4)"
                        strokeWidth="0.5"
                        opacity={1 - anim.rippleProg}
                    />
                )}

                {/* Dashed edges from people to center */}
                {PEOPLE.map((person) => {
                    const vis = anim.people[person.id]
                    if (vis < 0.1) return null
                    return (
                        <line
                            key={`edge-${person.id}`}
                            x1={person.x} y1={person.y}
                            x2={CENTER.x} y2={CENTER.y}
                            stroke="rgba(148,163,184,0.25)"
                            strokeWidth="0.35"
                            strokeDasharray="1.2 2"
                            opacity={vis * anim.centerScale}
                        />
                    )
                })}

                {/* Outward pulses */}
                {anim.pulseProg > 0 &&
                    PEOPLE.map((person) => {
                        const t = clamp(anim.pulseProg)
                        if (t <= 0 || t >= 0.99) return null
                        const fade   = t < 0.3 ? t / 0.3 : t > 0.7 ? (1 - t) / 0.3 : 1
                        const px     = lerp(CENTER.x, person.x, t)
                        const py     = lerp(CENTER.y, person.y, t)
                        const tStart = Math.max(0, t - 0.35)
                        const tx     = lerp(CENTER.x, person.x, tStart)
                        const ty     = lerp(CENTER.y, person.y, tStart)
                        const gradId = `pulse-trail-${person.id}`
                        return (
                            <g key={`pulse-${person.id}`} opacity={fade}>
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
                                        id={`pulse-glow-${person.id}`}
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
                                <circle cx={px} cy={py} r="3"   fill={`url(#pulse-glow-${person.id})`} />
                                <circle cx={px} cy={py} r="0.8" fill="#4182F4" />
                                <circle cx={px} cy={py} r="0.4" fill="#ffffff" />
                            </g>
                        )
                    })}
            </svg>

            {/* Speech bubble annotations */}
            {PEOPLE.map((person) => {
                const vis   = anim.people[person.id] * anim.circleProg
                if (vis < 0.01) return null
                const alpha = vis * lerp(1, 0, clamp(anim.mergeProg * 2))
                if (alpha < 0.01) return null
                const bubbleX = person.circleX + (person.circleX < CENTER.x ? -12 : 12)
                const bubbleY = person.circleY + (person.circleY < CENTER.y ? -10 : 10)
                return (
                    <div
                        key={`bubble-${person.id}`}
                        style={{
                            position: "absolute",
                            left: `${toCSS_X(bubbleX)}%`,
                            top: `${bubbleY}%`,
                            transform: `translate(-50%, -50%) scale(${0.6 + vis * 0.4})`,
                            opacity: alpha,
                            zIndex: 7,
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                background: "rgba(255,255,255,0.95)",
                                border: `1px solid ${person.color}40`,
                                borderRadius: 6,
                                padding: "4px 8px",
                                fontSize,
                                fontFamily: '"SF Mono","Fira Code",monospace',
                                color: person.color,
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                            }}
                        >
                            {person.annotation}
                        </div>
                    </div>
                )
            })}

            {/* Center node — FineGrained */}
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

            {/* Person avatars */}
            {PEOPLE.map((person) => {
                const vis = anim.people[person.id]
                if (vis < 0.01) return null
                return (
                    <div
                        key={person.id}
                        style={{
                            position: "absolute",
                            left: `${toCSS_X(person.x)}%`,
                            top: `${person.y}%`,
                            transform: `translate(-50%,-50%) scale(${0.4 + vis * 0.6})`,
                            opacity: vis,
                            zIndex: 4,
                        }}
                    >
                        <div
                            style={{
                                width: personSize,
                                height: personSize,
                                borderRadius: "50%",
                                background: "#f8fafc",
                                border: `1.5px solid ${person.color}60`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            }}
                        >
                            <svg
                                width={personSize * 0.5}
                                height={personSize * 0.5}
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle cx="12" cy="8" r="4" stroke={person.color} strokeWidth="2" />
                                <path
                                    d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
                                    stroke={person.color}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}