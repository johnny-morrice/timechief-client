import { Show, createSignal, onCleanup } from "solid-js";
import { Video } from "./video";
import { callbackName } from "../util/callback";
import { addDataCallback, removeDataCallback } from "../ipc";
import { FeatureForceSpooky } from "../features";

class Signals {
    constructor() {
        [this.videoSrc, this.setVideoSrc] = createSignal('');
        [this.showVideo, this.setShowVideo] = createSignal(false);
        [this.timeout, this.setTimeout] = createSignal(0);
        [this.enabled, this.setEnabled] = createSignal(false);
    }
}

function updateSignals(signals, data) {
    if (data && data.media && data.media.video && data.media.video.videos && data.media.video.videos.length > 0) {
        const firstVideo = data.media.video.videos[0];
        signals.setVideoSrc(firstVideo.url);
        signals.setTimeout(firstVideo.duration * 1000);
        if (data.media.video.settings) {
            let enabled = data.media.video.settings.enabled;
            let hourStart = data.media.video.settings.enabled_hour_start;
            let hourEnd = data.media.video.settings.enabled_hour_end;
            let now = new Date();
            let hour = now.getHours();
            enabled = enabled && isHourInRange(hour, hourStart, hourEnd);
            signals.setEnabled(enabled);
        }
        
    }
}

function isHourInRange(hour, start, end) {
    if (FeatureForceSpooky) {
        return true;
    }
    if (start < end) {
        return hour >= start && hour < end;
    }
    if (start > end) {
        return hour >= start || hour < end;
    }
}

export function MediaVideo(props) {
    if (props.element === undefined) {
        throw new Error('element must be defined');
    }
    console.log("MediaVideo render");
    const delay = 53 * 1000 * 60;
    const chance = 0.07;
    const signals = new Signals();
    if (props.forceVideo || FeatureForceSpooky) {
        signals.setShowVideo(true);
    }
    const interval = setInterval(() => {
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
    function onEnded() {
        signals.setShowVideo(false);
    }
    function videoReady() {
        return signals.enabled() && signals.videoSrc() && signals.videoSrc().length > 0 && signals.timeout() > 0 && signals.showVideo();
    }
    return <>
        <Show when={videoReady()}>
            <Video videoSrc={signals.videoSrc()} timeout={signals.timeout()} onEnded={onEnded} onClick={onEnded} />
        </Show>
        <Show when={!videoReady()}>
            {props.element}
        </Show>
    </>
}