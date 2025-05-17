import { createSignal, onCleanup } from "solid-js";
import {  } from '../../util/fakeRandom';


export function Loading() {
    const [progress, setProgress] = createSignal(0);
    const interval = setInterval(() => {
        // if progress is 100, reset to 0
        if (progress() >= 100) {
            setProgress(0);
        }
        const incrementAmount = Math.floor(Math.random() * 5) + 1;
        // 4/5th chance of incrementing progress
        if (Math.random() < 0.8) {
            setProgress((prev) => Math.min(prev + incrementAmount, 100));
        }
    }, 50);

    function getProgressStyle(progress) {
        return "width: " + progress() + "%;";
    }

    // Set a timeout to garbage collect stuff if this gets lost.
    setTimeout(() => {
        clearInterval(interval);
    }, 30000);

    onCleanup(() => {
        clearInterval(interval);
    });

    return <div class="progress-indicator" style="width: 100%;">
        <span class="progress-indicator-bar" style={getProgressStyle(progress)} />
    </div>;
}