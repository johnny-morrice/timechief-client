export const fadeTransition = (onTransition, doChange) => {
    onTransition("fade-out");
    const timerA = setTimeout(() => {
        onTransition("no-transition");
        onTransition("fade-in");
        doChange();
        const timerB = setTimeout(() => {
            onTransition("no-transition");
        }, transitionDurationMs);
        // Is this explicit cleaning strictly necessary here?
        // Always clean up after 5 minutes
        setTimeout(() => {
            clearTimeout(timerB);
        }, 1000 * 60 * 5);
    }, transitionDurationMs);
    // Always clean up after 5 minutes
    setTimeout(() => {
        clearTimeout(timerA);
    }, 1000 * 60 * 5);
}

const transitionDurationMs = 190;