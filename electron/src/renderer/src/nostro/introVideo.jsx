import { Show, createSignal } from "solid-js";
import { Video } from "./video";

export function IntroVideo(props) {
    if (props.element === undefined) {
        throw new Error('element must be defined');
    }
    console.log("IntroVideo render");
    const [ended, setEnded] = createSignal(false);
    function onEnded() {
        setEnded(true);
    }
    return <>
        <Show when={!ended()}>
            <Video videoSrc="assets/video/timechief-intro.mp4" timeout={5000} onEnded={onEnded} />
        </Show>
        <Show when={ended()}>
            {props.element}
        </Show>
    </>
}