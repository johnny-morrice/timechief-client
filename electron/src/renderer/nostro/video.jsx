import { onCleanup } from "solid-js";

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
    function onLoad() {
        const video = document.getElementById('video');
        video.onended = onEnded;
    }
    const timeout = setTimeout(onEnded, props.timeout);
    onCleanup(() => clearTimeout(timeout));
    return <>
        <video id="video" src={props.videoSrc} autoPlay muted onLoad={onLoad} />
    </>
}