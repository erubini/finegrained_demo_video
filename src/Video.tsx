import React from "react"
import { Sequence, Audio } from "remotion"
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
    return (
        <>
            <TransitionSeries>
                <TransitionSeries.Sequence durationInFrames={s(PHASES.hero.duration)}>
                    <HeroContextLayer />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={transType("heroToStep1")}
                    timing={linearTiming({ durationInFrames: transFrames("heroToStep1") })}
                />

                <TransitionSeries.Sequence durationInFrames={phaseDuration(PHASES.step1)}>
                    <Step1Illustration />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={transType("step1ToStep2")}
                    timing={linearTiming({ durationInFrames: transFrames("step1ToStep2") })}
                />

                <TransitionSeries.Sequence durationInFrames={phaseDuration(PHASES.step2)}>
                    <Step2Illustration />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={transType("step2ToStep3")}
                    timing={linearTiming({ durationInFrames: transFrames("step2ToStep3") })}
                />

                <TransitionSeries.Sequence durationInFrames={phaseDuration(PHASES.step3)}>
                    <Step3Illustration />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={transType("step3ToStep4")}
                    timing={linearTiming({ durationInFrames: transFrames("step3ToStep4") })}
                />

                <TransitionSeries.Sequence durationInFrames={phaseDuration(PHASES.step4)}>
                    <Step4Illustration />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={transType("step4ToStep5")}
                    timing={linearTiming({ durationInFrames: transFrames("step4ToStep5") })}
                />

                <TransitionSeries.Sequence durationInFrames={phaseDuration(PHASES.step5)}>
                    <Step5Illustration />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={transType("step5ToStep6")}
                    timing={linearTiming({ durationInFrames: transFrames("step5ToStep6") })}
                />

                <TransitionSeries.Sequence durationInFrames={phaseDuration(PHASES.step6)}>
                    <Step7Illustration />
                </TransitionSeries.Sequence>
            </TransitionSeries>

            {/* Audio */}
            <Audio src={`/public/${AUDIO.voiceover.file}`} volume={AUDIO.voiceover.volume} startFrom={s(AUDIO.voiceover.startAt)} />
            <Audio src={`/public/${AUDIO.music.file}`}     volume={AUDIO.music.volume}     startFrom={s(AUDIO.music.startAt)} />
        </>
    )
}