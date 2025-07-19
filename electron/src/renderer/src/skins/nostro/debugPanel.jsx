import { createSignal, onCleanup } from 'solid-js';
import { Video } from '../../components/video';
import { textMaker } from '../../components/label';
import { MediaVideo } from '../../components/mediavideo';

class Signals {
    constructor() {
        [this.isPlayIntroVideo, this.setPlayIntroVideo] = createSignal(false);
        [this.isPlayMediaVideo, this.setPlayMediaVideo] = createSignal(false);
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
    function onClickPlayIntroVideo(e) {
        console.log("playing intro video");
        signals.setPlayIntroVideo(true);
        const timeout = setTimeout(() => {
            console.log("debug video timeout")
            signals.setPlayIntroVideo(false);
        }, timeoutMS)
        timeouts.push(timeout);
    }

    function onClickPlayMediaVideo(e) {
        console.log("playing media video");
        signals.setPlayMediaVideo(true);
        const timeout = setTimeout(() => {
            console.log("debug video timeout")
            signals.setPlayMediaVideo(false);
        }, timeoutMS)
        timeouts.push(timeout);
    }

    onCleanup(() => {
        console.log("cleaning up debug");
        timeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
    });

    function onEndedIntro() {
        console.log("video ended")
        signals.setPlayIntroVideo(false);
    }

    function isPlayMediaVideo(signals) {
        return signals.isPlayMediaVideo();
    }

    function isMenuScreen(signals) {
        return !signals.isPlayIntroVideo() && !isPlayMediaVideo(signals);
    }

    const plainText = textMaker("debug");
    return <div class="device-control flex-column flex-grow">
        <Show when={isMenuScreen(signals)}>
            <button class="action-button" onClick={onClickPlayIntroVideo}>{plainText("play-intro-video-button")}</button>
            <button class="action-button" onClick={onClickPlayMediaVideo}>{plainText("play-media-video-button")}</button>
        </Show>
        <Show when={isPlayIntroVideo(signals)}>
            <Video videoSrc="assets/video/timechief-intro.mp4" timeout={timeoutMS} onEnded={onEndedIntro} />
        </Show>
        <Show when={isPlayMediaVideo(signals)}>
            <MediaVideo forceVideo={true} element={<p>No media video ready</p>} />
        </Show>
    </div>;
};