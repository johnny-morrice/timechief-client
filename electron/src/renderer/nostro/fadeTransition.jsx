import { onCleanup } from "solid-js";

export const fadeTransition = (onTransition, doChange) => {
    onTransition("fade-out");
    const timerA = setTimeout(() => {
        onTransition("no-transition");
        onTransition("fade-in");
        doChange();
        const timerB = setTimeout(() => {
            onTransition("fade-in");
        }, transitionDurationMs);
        onCleanup(() => {
            clearTimeout(timerB);
        });
    }, transitionDurationMs);
    onCleanup(() => {
        clearTimeout(timerA);
    });
}

const transitionDurationMs = 190;