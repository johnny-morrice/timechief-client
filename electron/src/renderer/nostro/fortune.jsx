import { onCleanup, createSignal } from "solid-js";
import { textTransitionSignal } from "./textGlitch";
import { randomPoem } from "./poem";
import { addServiceDataCallback, isEcoMode, removeDataCallback } from "./ipc";
import { callbackName } from "./callback";
import { manageMascotCanvas } from "./mascot";
import { ecoRefreshInterval } from "../timing";

class Signals {
    constructor() {
        [this.boxBackgroundColor, this.setBoxBackgroundColor] = createSignal("black");
        [this.foregroundColor, this.setForegroundColor] = createSignal("green");
        [this.text, this.setText] = textTransitionSignal("Hey there, I'm hands!");
        [this.emote, this.setEmote] = createSignal("");
        [this.isSpooky, this.setSpooky] = createSignal(false);
    }
}

var globalSignals = new Signals();
var globalCanvas = null;
var lastManaged = new Date();
setInterval(() => {
    function setCanvas(canvas) {
        globalCanvas = canvas;
    }
    function getCanvas() {
        return globalCanvas;
    }
    if (isEcoMode()) {
        const now = new Date();
        const timeout = ecoRefreshInterval;
        const diff = now.getTime() - lastManaged.getTime();
        if (diff < timeout) {
            return;
        }
    }
    manageMascotCanvas(setCanvas, getCanvas,"fortune-canvas", globalSignals.emote, 120);
    lastManaged = new Date();
}, 1000);

function updateSignals(signals, data) {
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
    let boxBackgroundColor = theme["box_background_color"];
    let foregroundColor = theme["foreground_color"];
    if (boxBackgroundColor) {
        signals.setBoxBackgroundColor(boxBackgroundColor);
    }
    if (foregroundColor) {
        signals.setForegroundColor(foregroundColor);
    }
    const features = deviceProfile["features"];
    if (!features) {
        return;
    }
    const spooky = features["spooky"];
    signals.setSpooky(spooky);
}

export const Fortune = () => {
    console.log("Fortune render");
    const signals = new Signals();
    globalSignals = signals;
    const cbName = callbackName("Fortune");
    addServiceDataCallback(cbName, data => updateSignals(signals, data));
    function pickPoem() {
        const isSpooky = signals.isSpooky();
        const now = new Date();
        const poem = randomPoem(now, isSpooky);
        return poem;
    }

    let managePoem = function () {
        const poem = pickPoem();
        signals.setText(poem.text);
        signals.setEmote(poem.emote);
    }

    managePoem();

    const poemInterval = setInterval(() => {
        managePoem();
    }, 60 * 1000);

    onCleanup(() => {
        clearInterval(poemInterval);
        removeDataCallback(cbName);
    });
    return  <div class="fortune-message">
        <div class="fortune-message-text">{signals.text()}</div>
        <div class="fortune-message-mascot-wrapper">
            <canvas id="fortune-canvas" class="fortune-mascot" data-sig-fg-color={signals.foregroundColor()} data-sig-bg-color={signals.boxBackgroundColor()} data-sig-emote={signals.emote()}></canvas>
        </div>
    </div>;
}