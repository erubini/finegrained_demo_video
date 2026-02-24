import { AbsoluteFill } from "remotion"
import { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions"

function ease(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const ZoomCameraComponent = ({
    children,
    presentationDirection,
    presentationProgress,
    passedProps,
}: TransitionPresentationComponentProps<{ color: string; targetX: number; targetY: number; scale: number }>) => {
    const p = ease(presentationProgress)

    if (presentationDirection === "exiting") {
        const scale = 1 + p * passedProps.scale

        return (
            <AbsoluteFill style={{ overflow: "hidden" }}>
                <AbsoluteFill style={{
                    transform: `scale(${scale})`,
                    transformOrigin: `${passedProps.targetX}% ${passedProps.targetY}%`,
                }}>
                    {children}
                </AbsoluteFill>
            </AbsoluteFill>
        )
    }

    return (
        <AbsoluteFill style={{ opacity: p > 0.85 ? (p - 0.85) / 0.15 : 0 }}>
            {children}
        </AbsoluteFill>
    )
}

export const zoomCamera = (
    color: string = "#F9FAFB",
    targetX: number = 49.972,
    targetY: number = 48.02,
    scale: number = 300,
): TransitionPresentation<{ color: string; targetX: number; targetY: number; scale: number }> => ({
    component: ZoomCameraComponent,
    props: { color, targetX, targetY, scale },
})
