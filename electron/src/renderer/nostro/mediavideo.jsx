import { Show, createSignal, onCleanup } from "solid-js";
import { Video } from "./video";
import { callbackName } from "./callback";
import { addDataCallback, removeDataCallback } from "./ipc";

class Signals {
    constructor() {
        [this.videoSrc, this.setVideoSrc] = createSignal('');
        [this.showVideo, this.setShowVideo] = createSignal(false);
        [this.timeout, this.setTimeout] = createSignal(0);
    }
}

function updateSignals(signals, data) {
    if (data && data.media && data.media.video && data.media.video.videos && data.media.video.videos.length > 0) {
        const firstVideo = data.media.video.videos[0];
        console.log(JSON.stringify(firstVideo));
        signals.setVideoSrc(firstVideo.url);
        signals.setTimeout(firstVideo.duration * 1000);
    }
}

export function MediaVideo(props) {
    if (props.element === undefined) {
        throw new Error('element must be defined');
    }
    const delay = 53 * 1000 * 60;
    const chance = 1.0 / 53.0;
    const signals = new Signals();
    const forceVideo = true;
    if (forceVideo) {
        signals.setShowVideo(true);
    }
    const interval = setInterval(() => {
        if (forceVideo) {
            signals.setShowVideo(true);
            return;
        }
        if (Math.random() < chance) {
            signals.setShowVideo(true);
        }
    }, delay);
    const cbName = callbackName("MediaVideo");
    addDataCallback(cbName, (data) => updateSignals(signals, data));
    onCleanup(() => {
        clearInterval(interval);
        removeDataCallback(cbName);
    });
    function setEnded(state) {
        signals.setShowVideo(false);
    }
    function videoReady() {
        return signals.videoSrc() && signals.videoSrc().length > 0 && signals.timeout() > 0 && signals.showVideo();
    }
    return <>
        <Show when={videoReady()}>
            <Video videoSrc={signals.videoSrc()} timeout={signals.timeout()} setEnded={setEnded} />
        </Show>
        <Show when={!videoReady()}>
            {props.element}
        </Show>
    </>
}