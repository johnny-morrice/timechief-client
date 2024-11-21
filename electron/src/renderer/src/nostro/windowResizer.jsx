import { onCleanup } from "solid-js";
import { addDataCallback, sendResizeBrowserWindow, removeDataCallback,  } from "./ipc";
import { callbackName } from "./callback";

function handleData(data) {
    const deviceProfileWrapper = data["device_profile"];
    if (!deviceProfileWrapper) {
      return;
    }
    const deviceProfile = deviceProfileWrapper["value"];
    if (!deviceProfile) {
      return;
    }
    const theme = deviceProfile["theme"];
    if (!theme) {
        return;
    }

    const width = theme["display_width"];
    const height = theme["display_height"];

    if (!width || !height) {
        return;
    }

    sendResizeBrowserWindow(width, height);
}

export function WindowResizer(props) {
    const cbName = callbackName("WindowResizer");
    addDataCallback(cbName, handleData);
    onCleanup(() => removeDataCallback(cb));
    return props.element;
}