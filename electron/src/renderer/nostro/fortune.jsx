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
        const boxBackgroundColor = signals.boxBackgroundColor();
        const foregroundColor = signals.foregroundColor();
        let initCanvas = function () {
            const canvasRef = document.getElementById("fortune-canvas");
            if (!canvasRef) {
                return false;
            }
            if (canvasRef.getAttribute("data-initialized") === "true") {
                return true;
            }
            self.canvas = new fabric.Canvas(canvasRef, {
                backgroundColor: foregroundColor,
            });
            canvasRef.setAttribute("data-initialized", "true");

            console.log("adding canvas image");
            fabric.FabricImage.fromURL(self.mascotPath()).then((img) => {
                console.log("fromURL start");
                img.filters.push(replaceColorFilter({
                    originalColor: 'rgb(0,0,255)',
                    newColor: boxBackgroundColor,
                }));
                // img.filters.push(replaceColorFilter({
                //     originalColor: 'rgba(0,0,0,0)',
                //     newColor: foregroundColor,
                // }));
                img.applyFilters();
                // Get canvas dimensions
                const canvasWidth = self.canvas.getWidth();
                const canvasHeight = self.canvas.getHeight();

                // Calculate the scale factor to preserve aspect ratio and fit within the canvas
                const scaleFactor = Math.min(canvasWidth / img.width, canvasHeight / img.height);

                img.scale(scaleFactor);

                // Apply the scale factor to the image
                self.canvas.setWidth(img.width * scaleFactor);
                self.canvas.setHeight(img.height * scaleFactor);

                self.canvas.add(img);
            }).catch((err) => {
                console.error("error adding canvas: ", err);
            });
            return true;
        };
        const interval = setInterval(() => {
            initCanvas();
        });
        onCleanup(() => {
            clearTimeout(glitchTimeout);
            self.canvas.dispose();
            self.canvas = null;
            clearInterval(interval);
        });

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

function replaceColorFilter({ originalColor, newColor }) {
    // Helper function to convert CSS color to RGB
    function cssColorToRgb(color) {
        let r, g, b, a;

        if (color.startsWith('#')) {
            // Handle hex color
            if (color.length === 4) {
                r = parseInt(color[1] + color[1], 16);
                g = parseInt(color[2] + color[2], 16);
                b = parseInt(color[3] + color[3], 16);
                a = 1; // Default alpha value
            } else if (color.length === 5) {
                r = parseInt(color[1] + color[1], 16);
                g = parseInt(color[2] + color[2], 16);
                b = parseInt(color[3] + color[3], 16);
                a = parseInt(color[4] + color[4], 16) / 255;
            } else if (color.length === 7) {
                r = parseInt(color[1] + color[2], 16);
                g = parseInt(color[3] + color[4], 16);
                b = parseInt(color[5] + color[6], 16);
                a = 1; // Default alpha value
            } else if (color.length === 9) {
                r = parseInt(color[1] + color[2], 16);
                g = parseInt(color[3] + color[4], 16);
                b = parseInt(color[5] + color[6], 16);
                a = parseInt(color[7] + color[8], 16) / 255;
            }
        } else if (color.startsWith('rgb')) {
            // Handle rgb and rgba color
            const rgbValues = color.match(/\d+/g).map(Number);
            [r, g, b] = rgbValues;
        } else {
            throw new Error(`Unsupported color format: ${color}`);
        }

        return [r, g, b, a];
    }

    // Convert original and new colors to RGB
    // const originalRgba = cssColorToRgb(originalColor);
    const newRgba = cssColorToRgb(newColor);

    // Create a color matrix for the transformation
    const colorMatrix = [
        newRgba[0] / 255, 0, 0, 0, 0,
        0, newRgba[1] / 255, 0, 0, 0,
        0, 0, newRgba[2] / 255, 0, 0,
        0, 0, newRgba[3], 1, 0
    ];

    // Apply the color matrix filter using fabric.js
    return new fabric.filters.ColorMatrix({
        matrix: colorMatrix
    });
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