import { onCleanup } from "solid-js";
import { addServiceDataCallback, removeDataCallback } from "./ipc";
import { callbackName } from "./callback";

const elementIDToThemePrefix = new Map([
    ["switcher-widget", "widget_switcher"],
    ["action-center", "action_center"],
    ["date-time", "date_time"]
]);

function settingsKeys(prefix) {
    return {
        x: prefix + "_x",
        y: prefix + "_y",
        width: prefix + "_width",
        height: prefix + "_height"
    }
}

function buildThemeSettings(theme) {
    const themeSettings = new Map();
    elementIDToThemePrefix.forEach((themePrefix, elementId) => {
        const keys = settingsKeys(themePrefix);
        const themeValues = {
            x: theme[keys.x],
            y: theme[keys.y],
            width: theme[keys.width],
            height: theme[keys.height]
        };
        
        themeSettings.set(elementId, themeValues);
    });
    return themeSettings;
}

function settingsToStyle(settings) {
    return `position: absolute; left: ${settings.x}; top: ${settings.y}; width: ${settings.width}; height: ${settings.height}; overflow: hidden;`;
}

function applyThemeSettings(settings) {
    settings.forEach((settings, elementId) => {
        const element = document.getElementById(elementId);
        if (!element) {
            return;
        }
        const css = settingsToStyle(settings);
        console.log(`applying ${elementId} style: ${css}`);
        const currentCss = element.getAttribute("style");
        if (css != currentCss) {
            element.setAttribute("style", css);
        }
    })
}

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
   
    const themeSettings = buildThemeSettings(theme);
    applyThemeSettings(themeSettings);
}

export function ElementResizer(props) {
    console.log("ElementResizer render");
    const cbName = callbackName("ElementResizer");
    addServiceDataCallback(cbName, handleData);
    onCleanup(() => {
        console.log("resizer removing callback");
        removeDataCallback(cbName);
    });
    return <>{props.element}</>
}