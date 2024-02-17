import { onCleanup, onMount } from "solid-js";

export function Video(props) {
    if (props.timeout < 1) {
        throw new Error('timeout must be greater than 0');
    }
    if (props.setEnded === undefined) {
        throw new Error('setEnded must be defined');
    }
    if (props.videoSrc === undefined) {
        throw new Error('videoSrc must be defined');
    }
    function onEnded() {
        console.log(`video ${props.videoSrc} ended`);
        props.setEnded(true);
    }
    function setEndedCallback() {
        const video = document.getElementById('background-video');
        if (video) {
            console.log(`setting video ${props.videoSrc} ended callback`);
            video.onended = onEnded;
        }
    }
    onMount(setEndedCallback);
    const timeout = setTimeout(onEnded, props.timeout);
    onCleanup(() => clearTimeout(timeout));
    return <div class='background-video-wrapper'>
        <video id="background-video" autoplay muted>
            <source src={props.videoSrc} type="video/mp4" />
            Video playback error.
        </video>
    </div>
}