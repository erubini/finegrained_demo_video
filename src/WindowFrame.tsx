import React from "react"

interface WindowFrameProps {
    x: number
    y: number
    w: number
    h: number
    base: number
    pad: number
    zIndex?: number
    entryVis?: number          // 0→1 entry animation (opacity + scale); default 1 = no animation
    contentTranslateX?: number // px offset for sliding content wrapper; default 0
    children?: React.ReactNode // placed inside the sliding content wrapper
}

export default function WindowFrame({
    x, y, w, h, base, pad,
    zIndex = 5,
    entryVis = 1,
    contentTranslateX = 0,
    children,
}: WindowFrameProps) {
    const accentBlue = "#2563eb"

    return (
        <div
            style={{
                position: "absolute",
                left: x,
                top: y,
                width: w,
                height: h,
                zIndex,
                opacity: entryVis < 1 ? entryVis : undefined,
                transform: entryVis < 1 ? `scale(${0.85 + entryVis * 0.15})` : undefined,
            }}
        >
            {/* Window shell — visual styles only, never animated */}
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.97)",
                    border: "1.5px solid rgba(100,116,139,0.15)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header bar */}
                <div
                    style={{
                        height: base * 0.05,
                        borderBottom: "1px solid rgba(100,116,139,0.08)",
                        display: "flex",
                        alignItems: "center",
                        padding: `0 ${pad}px`,
                        gap: pad * 0.5,
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: base * 0.008, flexShrink: 0 }}>
                        <div style={{ width: base * 0.018, height: base * 0.018, borderRadius: "50%", background: "#FF5F57" }} />
                        <div style={{ width: base * 0.018, height: base * 0.018, borderRadius: "50%", background: "#FEBC2E" }} />
                        <div style={{ width: base * 0.018, height: base * 0.018, borderRadius: "50%", background: "#28C840" }} />
                    </div>
                    <div style={{ width: "55%", height: base * 0.012, borderRadius: 2, background: "rgba(30,41,59,0.6)" }} />
                    <div
                        style={{
                            marginLeft: "auto",
                            padding: `${base * 0.004}px ${base * 0.012}px`,
                            borderRadius: 20,
                            background: "rgba(37,99,235,0.08)",
                            border: "1px solid rgba(37,99,235,0.15)",
                        }}
                    >
                        <div
                            style={{
                                width: base * 0.04,
                                height: base * 0.006,
                                borderRadius: 1,
                                background: accentBlue,
                                opacity: 0.5,
                            }}
                        />
                    </div>
                </div>

                {/* Sliding content wrapper */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        transform: `translateX(${contentTranslateX}px)`,
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    )
}
