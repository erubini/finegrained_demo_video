import React from "react"
import "./index.css"
import { Composition } from "remotion"
import Step1Illustration from "./Step1Illustration"
import Step2Illustration from "./Step2Illustration"
import Step3Illustration from "./Step3Illustration"
import Step4Illustration from "./Step4Illustration"
import Step5Illustration from "./Step5Illustration"
import Step7Illustration from "./Step6Illustration"
import hero_context_layer from "./hero_context_layer"
import StepOutroIllustration from "./StepOutroIllustration"
import { Video } from "./Video"
import { VIDEO, PHASES, TRANSITIONS, s, phaseDuration } from "./config"

const { fps, width, height } = VIDEO

const heroDuration   = s(PHASES.hero.duration)
const step1Duration  = phaseDuration(PHASES.step1)
const step2Duration  = phaseDuration(PHASES.step2)
const step3Duration  = phaseDuration(PHASES.step3)
const step4Duration  = phaseDuration(PHASES.step4)
const step5Duration  = phaseDuration(PHASES.step5)
const step6Duration  = phaseDuration(PHASES.step6)
const outroDuration  = phaseDuration(PHASES.outro)

const transFrames = (key: keyof typeof TRANSITIONS) =>
    s(TRANSITIONS[key].seconds)

const fullVideoDuration =
    heroDuration +
    step1Duration + step2Duration + step3Duration +
    step4Duration + step5Duration + step6Duration +
    outroDuration -
    // subtract overlap from transitions
    (transFrames("step6ToHero") + transFrames("step1ToStep2") +
     transFrames("step2ToStep3") + transFrames("step3ToStep4") +
     transFrames("step4ToStep5") + transFrames("step5ToStep6"))

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition id="HeroContextLayer" component={hero_context_layer}      durationInFrames={heroDuration}      fps={fps} width={width} height={height} />
            <Composition id="Step1"            component={Step1Illustration}       durationInFrames={step1Duration}     fps={fps} width={width} height={height} />
            <Composition id="Step2"            component={Step2Illustration}       durationInFrames={step2Duration}     fps={fps} width={width} height={height} />
            <Composition id="Step3"            component={Step3Illustration}       durationInFrames={step3Duration}     fps={fps} width={width} height={height} />
            <Composition id="Step4"            component={Step4Illustration}       durationInFrames={step4Duration}     fps={fps} width={width} height={height} />
            <Composition id="Step5"            component={Step5Illustration}       durationInFrames={step5Duration}     fps={fps} width={width} height={height} />
            <Composition id="Step6"            component={Step7Illustration}       durationInFrames={step6Duration}     fps={fps} width={width} height={height} />
            <Composition id="Outro"            component={StepOutroIllustration}   durationInFrames={outroDuration}     fps={fps} width={width} height={height} />
            <Composition id="FullVideo"        component={Video}                   durationInFrames={fullVideoDuration} fps={fps} width={width} height={height} />
        </>
    )
}