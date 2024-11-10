import { createSignal, onCleanup } from 'solid-js';
import { Loading } from './loading';
import { textTransitionSignal } from "./textGlitch";
import { textMaker } from './label';

class Signals {
    constructor() {
        [this.isPlayIntroVideo, this.setPlayIntroVideo] = createSignal(false);
    }
}

function isPlayIntroVideo(signals) {
    return signals.isPlayIntroVideo()
}

export const Debug = () => {
    const timeout = 5000;
    console.log("Debug render");
    const signals = new Signals();

    const timeouts = [];
    function onClickPlayVideo(e) {
        signals.setPlayIntroVideo(true);
        const timeout = setTimeout(() => {
            signals.setPlayIntroVideo(false);
        })
        timeouts.push(timeout);
    }

    onCleanup(() => {
        timeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
    });

    const plainText = textMaker("debug");
    return <div class="device-control flex-column flex-grow">
        <Show when={!isPlayIntroVideo(signals)}>
            <button class="action-button" onClick={onClickPlayVideo}>{plainText("play-intro-video-button")}</button>
        </Show>
        <Show when={isPlayIntroVideo(signals)}>
            <Video videoSrc="assets/video/timechief-intro.mp4" timeout={timeout} onEnded={onEnded} />
        </Show>
    </div>;
};