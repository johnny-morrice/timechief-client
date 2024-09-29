import { onCleanup, onMount } from "solid-js";

export function Video(props) {
    if (props.timeout < 1) {
        throw new Error('timeout must be greater than 0');
    }
    if (props.onEnded === undefined) {
        throw new Error('onEnded must be defined');
    }
    if (props.videoSrc === undefined) {
        throw new Error('videoSrc must be defined');
    }
    var onClick = function () {
        console.log('video clicked');
    };
    if (props.onClick) {
        onClick = props.onClick;
    }
    console.log("Video render");
    function onEnded() {
        console.log(`video ${props.videoSrc} ended`);
        props.onEnded();
    }
    function setEndedCallback() {
        const video = document.getElementById('background-video');
        if (video) {
            video.onended = onEnded;
        }
    }
    onMount(setEndedCallback);
    const timeout = setTimeout(onEnded, props.timeout);
    onCleanup(() => clearTimeout(timeout));
    return <div class='background-video-wrapper'>
        <video onClick={onClick} id="background-video" autoplay muted>
            <source src={props.videoSrc} type="video/mp4" />
            Video playback error.
        </video>
    </div>
}