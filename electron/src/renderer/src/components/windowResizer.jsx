import { onCleanup } from "solid-js";
import { addServiceDataCallback, sendResizeBrowserWindow, removeDataCallback,  } from "../ipc";
import { callbackName } from "../util/callback";

var lastWidth;
var lastHeight;
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

    if (lastWidth == width && lastHeight == height) {
        return;
    }

    console.log("changing browser window size: ", width, height);

    lastWidth = width;
    lastHeight = height;

    sendResizeBrowserWindow(width, height);
}

export function WindowResizer(props) {
    console.log("WindowResizer render");
    const cbName = callbackName("WindowResizer");
    addServiceDataCallback(cbName, handleData);
    onCleanup(() => {
        console.log("resizer removing callback");
        removeDataCallback(cbName);
    });
    return <>{props.element}</>
}