import { Show, onCleanup,createSignal } from "solid-js";
import { sendLoadDefaultCSS } from "./ipc"
import { Loading } from "./loading";

function isCanaryThemed() {
    const canary = document.getElementById("theme-detection-canary");
    if (!canary) {
        return;
    };
    const styles = window.getComputedStyle(canary);
    const noStyles = {
        'border-color': 'rgb(0, 0, 0)',
        'color': 'rgb(0, 0, 0)',
        'background-color': 'rgba(0, 0, 0, 0)',
    };
    const styleProps = ["border-color", "color", "background-color"];
    for (let index = 0; index < styleProps.length; index++) {
        const property = styleProps[index];
        const noLoadValue = noStyles[property];
        if (styles.getPropertyValue(property) !== noLoadValue) {
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
        1000
    )
    onCleanup(() => {
        clearInterval(interval);
    })
    return <>
    <div id="theme-detection-canary" class="border">Should never see</div>
    <Show when={!themeDetected()}>
    <div class="system-error">
        <div>No theme loaded</div>
        <Loading />
    </div>;
    </Show>
    <Show when={themeDetected()}>
        {props.element}
    </Show>
    </>
}