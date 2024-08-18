import { onCleanup, createSignal } from "solid-js";
import * as fabric from 'fabric'
import { textTransitionSignal } from "./textGlitch";
import { randomPoem } from "./poem";
import { addServiceDataCallback, removeDataCallback } from "./ipc";
import { callbackName } from "./callback";

var globalCanvas = null;

function replaceColorFilter({ chromakeys }) {
    // Helper function to convert CSS color to RGB
    function cssColorToRgb(color) {
        let r, g, b, a;

        if (color.startsWith('#')) {
            // Handle hex color
            if (color.length === 4) {
                r = parseInt(color[1] + color[1], 16);
                g = parseInt(color[2] + color[2], 16);
                b = parseInt(color[3] + color[3], 16);
                a = 255; // Default alpha value
            } else if (color.length === 5) {
                r = parseInt(color[1] + color[1], 16);
                g = parseInt(color[2] + color[2], 16);
                b = parseInt(color[3] + color[3], 16);
                a = parseInt(color[4] + color[4], 16);
            } else if (color.length === 7) {
                r = parseInt(color[1] + color[2], 16);
                g = parseInt(color[3] + color[4], 16);
                b = parseInt(color[5] + color[6], 16);
                a = 255; // Default alpha value
            } else if (color.length === 9) {
                r = parseInt(color[1] + color[2], 16);
                g = parseInt(color[3] + color[4], 16);
                b = parseInt(color[5] + color[6], 16);
                a = parseInt(color[7] + color[8], 16);
            }
        }

        return [r, g, b, a];
    }

    const colorMatrix = [
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
    ];
    chromakeys.forEach(({ newColor, chromakey }) => {
        const [r, g, b, a] = cssColorToRgb(newColor);
        if (chromakey >= 0 && chromakey <= 2) {
            colorMatrix[chromakey] = r / 255;
            colorMatrix[chromakey + 5] = g / 255;
            colorMatrix[chromakey + 10] = b / 255;
            colorMatrix[chromakey + 15] = a / 255;
        } else {
            throw new Error(`invalid chromakey value: ${chromakey}`);
        }
    });

    // Apply the color matrix filter using fabric.js
    return new fabric.filters.ColorMatrix({
        matrix: colorMatrix
    });
}

class Signals {
    constructor() {
        [this.boxBackgroundColor, this.setBoxBackgroundColor] = createSignal("black");
        [this.foregroundColor, this.setForegroundColor] = createSignal("green");
        [this.text, this.setText] = textTransitionSignal("Hey there, I'm hands!");
        [this.emote, this.setEmote] = createSignal("");
        [this.isSpooky, this.setSpooky] = createSignal(false);
    }
}

function manageCanvas(signals) {
    const canvasRef = document.getElementById("fortune-canvas");
    if (!canvasRef) {
        return;
    }
    const foregroundColor = canvasRef.getAttribute("data-sig-fg-color");
    const boxBackgroundColor = canvasRef.getAttribute("data-sig-bg-color");
    const emote = canvasRef.getAttribute("data-sig-emote");
    if (!foregroundColor || !boxBackgroundColor || !emote) {
        return;
    }

    const initialised = canvasRef.getAttribute("data-initialised");
    if (!initialised) {

        globalCanvas = new fabric.Canvas(canvasRef, {
            backgroundColor: boxBackgroundColor,
            selection: false,
            hoverCursor: "default",
            moveCursor: "default",
            // TODO: we may have to revisit this height.
            // The canvas is absolutely positioned, leading to strange behaviour when the height is too big.
            height: 120,
        });
    }
    canvasRef.setAttribute("data-initialised", "true");

    const renderedForeground = canvasRef.getAttribute("data-foreground-color");
    const renderedBackground = canvasRef.getAttribute("data-background-color");
    const renderedEmote = canvasRef.getAttribute("data-emote");
    if (renderedForeground === foregroundColor && renderedBackground === boxBackgroundColor && emote === renderedEmote) {
        console.log("skipping canvas update");
        return;
    }
    // Remove all objects from the canvas
    globalCanvas.clear();
    globalCanvas.set("backgroundColor", boxBackgroundColor);
    console.log("adding canvas image fg: ", foregroundColor, " bg: ", boxBackgroundColor);
    fabric.FabricImage.fromURL(mascotPath(signals.emote())).then((img) => {
        console.log("fromURL start");
        img.filters.push(replaceColorFilter({
            chromakeys: [{
                newColor: foregroundColor,
                chromakey: 0,
            },
            {
                newColor: boxBackgroundColor,
                chromakey: 2,
            },
            ]
        }));
        // img.filters.push(replaceColorFilter({
        //     newColor: boxBackgroundColor,
        //     chromakey: 0,
        // }));
        img.applyFilters();
        // Get canvas dimensions
        const canvasWidth = globalCanvas.getWidth();
        const canvasHeight = globalCanvas.getHeight();

        // Calculate the scale factor to preserve aspect ratio and fit within the canvas
        const scaleFactor = Math.min(canvasWidth / img.width, canvasHeight / img.height);

        img.scale(scaleFactor);
        img.selectable = false;
        img.hoverCursor = "default";

        // Apply the scale factor to the image
        globalCanvas.setWidth(img.width * scaleFactor);
        globalCanvas.setHeight(img.height * scaleFactor);

        globalCanvas.add(img);

        canvasRef.setAttribute("data-foreground-color", foregroundColor);
        canvasRef.setAttribute("data-background-color", boxBackgroundColor);
        canvasRef.setAttribute("data-emote", emote);
    }).catch((err) => {
        console.error("error adding canvas: ", err);
    });
};

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

function mascotPath(emote) {
    validateEmote(emote);
    return `assets/image/mascot/mascot-${emote}.png`;
}

function validateEmote(emote) {
    const validEmotes = [
        "instruct",
        "neutral",
        "sigh",
        "spooky",
        "thumb"
    ];
    const isValid = validEmotes.filter(myEmote => myEmote === emote).length > 0;
    if (!isValid) {
        throw new Error(`invalid mascot nickname: ${emote}`);
    }
}

const leakingCanvasIntervals = [];
export const Fortune = () => {
    const signals = new Signals();
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
    }, 10000);

    const canvasInterval = setInterval(() => {
        manageCanvas(signals);
    }, 1000);
    leakingCanvasIntervals.push(canvasInterval);

    onCleanup(() => {
        leakingCanvasIntervals.forEach(interval => clearInterval(interval));
        leakingCanvasIntervals.length = 0;
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