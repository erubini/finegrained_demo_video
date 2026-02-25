// ─── Global ───────────────────────────────────────────────────────────────────
export const VIDEO = {
    fps:        30,
    width:      1280,
    height:     720,
}

// ─── Phase timing (all values in seconds) ────────────────────────────────────
export const PHASES = {
    hero: {
        duration:        60,   // total seconds
        cycleSeconds:     3,   // seconds per message cycle
        pulseSeconds:   2.27,  // seconds for pulse travel (cycleSeconds * 68/90)
        impactSeconds:  0.73,  // seconds for impact effect (cycleSeconds * 22/90)
        cardFadeSeconds: 0.5,  // seconds for card fade in
    },
    step1: {
        nodes:       1.8,
        pauseafterNodes: 4,
        breathe:      5,
        pauseafterBreathe: 3.5,
        edges:       3,
        center:      1,
        glow:        0.3,
        pauseBeforePulse: 2,
        pulse:       7,
        pauseafterPulse: 0.5,
        finalPulse:  2,
        centerPulse: 2,
        pauseaftercenterPulse: 7,
    },
    step2: {
        pauseBeforeDoc: 3,
        doc:      1,
        pauseAfterDoc: 3,
        nodes:    0.8,
        pauseAfterNodes: 2,
        magDoc:   1,
        magCode:  6,
        pauseAfterMagCode: 8,
        highlight: 1.5,
    },
    step3: {
        pauseBeforePeople: 5,
        people:  2,
        pauseAfterPeople: 1,
        circles: 2,
        pauseAfterCircles: 1,
        center:  3,
        pauseAfterCenter: 1,
        pulses:  1.3,
        merge:   4,
        pauseAfterMerge: 11,
    },
    step4: {
        pausebeforeEngineers: 5,
        engineers:  1.5,
        pausebeforeManagers: 0.5,
        managers:   1.5,
        pausebeforeLeadership: 0.5,
        leadership: 1.5,
        pausebeforeApprove: 8,
        approve:    1.7,
        pauseafterApprove: 5,
    },
    step5: {
        pausebeforeCard: 1.5,
        card:     0.9,
        expand:   1.2,
        pausebeforeContext: 0.5,
        context:  1.3,
        pausebeforePrompt: 0.7,
        prompt:   1.1,
        pausebeforeComplete: 1,
        complete: 1.5,
        slideOut: 0.8,
    },
    step6: {
        diff:  1,
        cards: 1.1,
        shift: 1.1,
        flow:  1.5,
        pulse: 1.2,
    },
}

// ─── Transitions ──────────────────────────────────────────────────────────────
export const TRANSITIONS = {
    heroToStep1:  { type: "fade",  seconds: 0.7 },
    step1ToStep2: { type: "zoom", seconds: 5 },
    step2ToStep3: { type: "zoom", seconds: 7 },
    step3ToStep4: { type: "zoom", seconds: 5 },
    step4ToStep5: { type: "zoom", seconds: 5 },
    step5ToStep6: { type: "fade",  seconds: 0.5 },
}

// ─── Audio ────────────────────────────────────────────────────────────────────
export const AUDIO = {
    voiceover: { file: "finegrained_video_voiceover.wav", volume: 1.0,  startAt: 0 },
    music:     { file: "finegrained_video_music.wav",     volume: 0.6, startAt: 0 },
}

// ─── Utilities ────────────────────────────────────────────────────────────────

// Converts seconds to frames
export const s = (seconds: number) => Math.round(seconds * VIDEO.fps)

// Computes total duration in frames from a phase config
export const phaseDuration = (phases: Record<string, number>) =>
    s(Object.values(phases).reduce((a, b) => a + b, 0))

// Converts second-based phase config into normalized 0-1 starts and weights
// that the existing animation logic already understands
export function buildPhases<T extends Record<string, number>>(phaseSecs: T): {
    starts:  Record<keyof T, number>
    weights: Record<keyof T, number>
    total:   number
} {
    const total = Object.values(phaseSecs).reduce((a: number, b) => a + (b as number), 0)
    const starts:  Record<string, number> = {}
    const weights: Record<string, number> = {}
    let cursor = 0
    for (const [key, secs] of Object.entries(phaseSecs)) {
        starts[key]  = cursor / total
        weights[key] = (secs as number) / total
        cursor += secs as number
    }
    return { starts: starts as Record<keyof T, number>, weights: weights as Record<keyof T, number>, total }
}