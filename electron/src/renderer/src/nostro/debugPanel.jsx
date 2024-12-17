import { createSignal, onCleanup } from 'solid-js';
import { Video } from './video';
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
    const timeoutMS = 10000;
    console.log("Debug render");
    const signals = new Signals();

    const timeouts = [];
    function onClickPlayVideo(e) {
        console.log("playing video");
        signals.setPlayIntroVideo(true);
        const timeout = setTimeout(() => {
            console.log("debug video timeout")
            signals.setPlayIntroVideo(false);
        }, timeoutMS)
        timeouts.push(timeout);
    }

    onCleanup(() => {
        console.log("cleaning up debug");
        timeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
    });

    function onEnded() {
        console.log("video ended")
        signals.setPlayIntroVideo(false);
    }

    const plainText = textMaker("debug");
    return <div class="device-control flex-column flex-grow">
        <Show when={!isPlayIntroVideo(signals)}>
            <button class="action-button" onClick={onClickPlayVideo}>{plainText("play-intro-video-button")}</button>
        </Show>
        <Show when={isPlayIntroVideo(signals)}>
            <Video videoSrc="assets/video/timechief-intro.mp4" timeout={timeoutMS} onEnded={onEnded} />
        </Show>
    </div>;
};