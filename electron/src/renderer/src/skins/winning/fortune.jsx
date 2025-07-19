import { onCleanup, createSignal } from "solid-js";
import { winTextTransitionSignal } from "../../util/textGlitch";
import { randomPoem } from "../../util/poem";
import { addServiceDataCallback, removeDataCallback } from "../../ipc";
import { callbackName } from "../../util/callback";
import { FortuneMascotCanvas, setFortuneSignals } from "./fortuneMascot";

class Signals {
    constructor() {
        [this.boxBackgroundColor, this.setBoxBackgroundColor] = createSignal("black");
        [this.foregroundColor, this.setForegroundColor] = createSignal("green");
        [this.text, this.setText] = winTextTransitionSignal("Hey there, I'm hands!");
        [this.emote, this.setEmote] = createSignal("neutral");
        [this.isSpooky, this.setSpooky] = createSignal(false);
        [this.mascotHeight, this.setMascotHeight] = createSignal("120px");
        [this.mascotType, this.setMascotType] = createSignal("dark");
    }
}

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

    signals.setMascotHeight(theme["fortune_mascot_height"]);
    signals.setMascotType(theme["mascot_type"]);

    const features = deviceProfile["features"];
    if (!features) {
        return;
    }

    const spooky = features["spooky_campaign"];
    signals.setSpooky(spooky);
}

export const Fortune = () => {
    console.log("Fortune render");
    const signals = new Signals();
    setFortuneSignals(signals);
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
    }, 10 * 60 * 1000);

    onCleanup(() => {
        clearInterval(poemInterval);
        removeDataCallback(cbName);
    });
    return <div class="fortune-message">
        <div class="fortune-message-text">{signals.text()}</div>
        <FortuneMascotCanvas />
    </div>;
}