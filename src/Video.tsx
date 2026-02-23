import React from "react"
import { Audio, staticFile, AbsoluteFill, useCurrentFrame } from "remotion"
import { TransitionSeries, linearTiming } from "@remotion/transitions"
import { fade } from "@remotion/transitions/fade"
import { slide } from "@remotion/transitions/slide"
import HeroContextLayer from "./hero_context_layer"
import Step1Illustration from "./Step1Illustration"
import Step2Illustration from "./Step2Illustration"
import Step3Illustration from "./Step3Illustration"
import Step4Illustration from "./Step4Illustration"
import Step5Illustration from "./Step5Illustration"
import Step7Illustration from "./Step6Illustration"
import { PHASES, TRANSITIONS, AUDIO, VIDEO, s, phaseDuration } from "./config"

const { fps } = VIDEO

const transFrames = (key: keyof typeof TRANSITIONS) => s(TRANSITIONS[key].seconds)
const transType   = (key: keyof typeof TRANSITIONS) =>
    TRANSITIONS[key].type === "fade" ? fade() : slide()

export const Video: React.FC = () => {
    const frame = useCurrentFrame()
    const heroDuration = s(PHASES.hero.duration)
    const isHero = frame < heroDuration
    return (
        <>
            {/* Hero background */}
            <AbsoluteFill style={{ 
                background: "linear-gradient(180deg, #3b82f6 0%, #a5d0fc 100%)",
                opacity: isHero ? 1 : 0,
            }} />

            {/* Steps background */}
            <AbsoluteFill style={{ 
                background: "#ffffff",
                opacity: isHero ? 0 : 1,
            }} />

            <TransitionSeries>
                <TransitionSeries.Sequence durationInFrames={phaseDuration(PHASES.step1)}>
                    <Step1Illustration />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={transType("step1ToStep2")}
                    timing={linearTiming({ durationInFrames: transFrames("step1ToStep2") })}
                />
                
            </TransitionSeries>

            <Audio src={staticFile(AUDIO.voiceover.file)} volume={AUDIO.voiceover.volume} startFrom={s(AUDIO.voiceover.startAt)} />
            <Audio src={staticFile(AUDIO.music.file)}     volume={AUDIO.music.volume}     startFrom={s(AUDIO.music.startAt)} />
        </>
    )
}