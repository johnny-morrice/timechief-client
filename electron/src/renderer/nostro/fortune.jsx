import { onCleanup, createSignal, createEffect } from "solid-js";
import * as fabric from 'fabric'
import { second } from "../timing";
import { textTransitionSignal } from "./textGlitch";
import { random } from './fakeRandom';
import { addServiceDataCallback, removeDataCallback } from "./ipc";
import { callbackName } from "./callback";

class Message {
    constructor(text, mascotNickname) {
        this.text = text;
        this.mascotNickname = mascotNickname;
    }

    element(signals) {
        const self = this;
        this.validateNickname();
        const [text, setText] = textTransitionSignal("");
        var glitchTimeout = setTimeout(() => {
            setText(this.text);
        }, 100);
        let done = false
        let initCanvas = function () {
            if (self.canvas) {
                return true;
            }
            if (done) {
                return true;
            }
            done = true;
            const canvasRef = document.getElementById("fortune-canvas");
            if (!canvasRef) {
                return false;
            }
            if (canvasRef.getAttribute("data-initialized") === "true") {
                return true;
            }
            self.canvas = new fabric.Canvas(canvasRef, {
                backgroundColor: boxBackgroundColor,
            });
            canvasRef.setAttribute("data-initialized", "true");

            fabric.FabricImage.fromURL(self.mascotPath(), (img) => {
                img.filters.push(new fabric.FabricImage.filters.ReplaceColor({
                    originalColor: 'rgb(0,0,255)',
                    newColor: boxBackgroundColor,
                }));
                img.filters.push(new fabric.FabricImage.filters.ReplaceColor({
                    originalColor: 'rgba(0,0,0,0)',
                    newColor: foregroundColor,
                }));
                img.applyFilters();
                canvas.add(img);
            });
            return true;
        };
        const interval = setInterval(() => {
            const ok = initCanvas();
            if (ok) {
                clearInterval(interval);
            }
        }, 1000);
        onCleanup(() => {
            clearTimeout(glitchTimeout);
            self.canvas.dispose();
            self.canvas = null;
            done = false;
            clearInterval(interval);
        });
        const boxBackgroundColor = signals.boxBackgroundColor();
        const foregroundColor = signals.foregroundColor();
        return <div class="fortune-message">
            <div class="fortune-message-text">{text}</div>
            <div class="fortune-message-mascot-wrapper">
                <canvas id="fortune-canvas" class="fortune-mascot"></canvas>
            </div>
        </div>;
    }

    mascotPath() {
        this.validateNickname();
        return `assets/image/mascot/mascot-${this.mascotNickname}.png`;
    }

    validateNickname() {
        const validNicks = [
            "instruct",
            "neutral",
            "sigh",
            "spooky",
            "thumb"
        ];
        const isValid = validNicks.filter(nick => nick === this.mascotNickname).length > 0;
        if (!isValid) {
            throw new Error(`invalid mascot nickname: ${this.mascotNickname}`);
        }
    }
}

class Signals {
    constructor() {
        [this.boxBackgroundColor, this.setBoxBackgroundColor] = createSignal("black");
        [this.foregroundColor, this.setForegroundColor] = createSignal("green");
    }
}

function msg(text, mascotNickname) {
    return new Message(text, mascotNickname);
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
}

export const Fortune = () => {
    const signals = new Signals();
    const cbName = callbackName("HomePage");
    addServiceDataCallback(cbName, data => updateSignals(signals, data));
    onCleanup(() => {
        removeDataCallback(cbName);
    });
    const poems = [
        msg("Blinking cursor waits patiently.", "neutral"),
    ];
    const [fortune, setFortune] = createSignal(poems[0]);
    const updatePoem = () => {
        setFortune(poems[Math.floor(random() * poems.length)]);
    };

    updatePoem();
    const interval = setInterval(updatePoem, 60 * second);
    onCleanup(() => {
        clearInterval(interval);
    });
    return fortune().element(signals);
}