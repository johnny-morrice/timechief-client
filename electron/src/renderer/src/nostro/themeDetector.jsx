import { Show, onCleanup,createSignal } from "solid-js";
import { sendLoadDefaultCSS } from "./ipc"
import { Loading } from "./loading";

function isCanaryThemed() {
    const canary = document.getElementById("theme-detection-canary");
    if (!canary) {
        return;
    };
    const styles = window.getComputedStyle(canary);
    const styleLoaded = {
        'color': 'rgb(255, 0, 0)',
    };
    const styleProps = ["color"];
    for (let index = 0; index < styleProps.length; index++) {
        const property = styleProps[index];
        const loadValue = styleLoaded[property];
        if (styles.getPropertyValue(property) === loadValue) {
            return true;
        }
    }
    return false;
}

export function ThemeDetector(props) {
    const [themeDetected, setThemeDetected] = createSignal(false);
    const interval = setInterval(
        () => {
            const isThemed = isCanaryThemed();
            setThemeDetected(isThemed);
            if (!isThemed) {
                sendLoadDefaultCSS();
            }
        },
        500
    )
    onCleanup(() => {
        clearInterval(interval);
    })
    return <>
    <div id="theme-detection-canary" class="border">Should never see</div>
    <Show when={!themeDetected()}>
    <div class="system-error">
        <div>Theme loading...</div>
        <Loading />
    </div>;
    </Show>
    <Show when={themeDetected()}>
        {props.element}
    </Show>
    </>
}