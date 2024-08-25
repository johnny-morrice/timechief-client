import * as fabric from 'fabric'

export function manageMascotCanvas(setCanvas, getCanvas, canvasId, emoteSignal, height) {
    const canvasRef = document.getElementById(canvasId);
    if (!canvasRef) {
        return;
    }
    const foregroundColor = canvasRef.getAttribute("data-sig-fg-color");
    const boxBackgroundColor = canvasRef.getAttribute("data-sig-bg-color");
    const emote = canvasRef.getAttribute("data-sig-emote");
    if (!foregroundColor || !boxBackgroundColor || !emote) {
        return;
    }

    var canvas = getCanvas();
    const initialised = canvasRef.getAttribute("data-initialised");
    if (!initialised) {
        if (canvas) {
            canvas.dispose();
        }
        canvas = new fabric.Canvas(canvasRef, {
            backgroundColor: boxBackgroundColor,
            selection: false,
            hoverCursor: "default",
            moveCursor: "default",
            // TODO: we may have to revisit this height.
            // The canvas is absolutely positioned, leading to strange behaviour when the height is too big.
            height: height,
        });
        setCanvas(canvas);
    }
    canvasRef.setAttribute("data-initialised", "true");

    const renderedForeground = canvasRef.getAttribute("data-foreground-color");
    const renderedBackground = canvasRef.getAttribute("data-background-color");
    const renderedEmote = canvasRef.getAttribute("data-emote");
    if (renderedForeground === foregroundColor && renderedBackground === boxBackgroundColor && emote === renderedEmote) {
        // console.log("skipping canvas update");
        return;
    }
    // Remove all objects from the canvas
    canvas.clear();
    canvas.set("backgroundColor", boxBackgroundColor);
    console.log("adding canvas image fg: ", foregroundColor, " bg: ", boxBackgroundColor);
    fabric.FabricImage.fromURL(mascotPath(emoteSignal())).then((img) => {
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
        const canvasWidth = canvas.getWidth();
        const canvasHeight = height;

        // Calculate the scale factor to preserve aspect ratio and fit within the canvas
        const scaleFactor = Math.min(canvasWidth / img.width, canvasHeight / img.height);

        img.scale(scaleFactor);
        img.selectable = false;
        img.hoverCursor = "default";

        // Apply the scale factor to the image
        canvas.setWidth(img.width * scaleFactor);
        canvas.setHeight(img.height * scaleFactor);

        canvas.add(img);

        canvasRef.setAttribute("data-foreground-color", foregroundColor);
        canvasRef.setAttribute("data-background-color", boxBackgroundColor);
        canvasRef.setAttribute("data-emote", emote);
    }).catch((err) => {
        console.error("error adding canvas: ", err);
    });
};

function mascotPath(emote) {
    validateEmote(emote);
    return `assets/image/mascot/mascot-${emote}.png`;
}

const validEmotes = [
    "instruct",
    "neutral",
    "sigh",
    "spooky",
    "thumb"
];

function validateEmote(emote) {
    const isValid = validEmotes.filter(myEmote => myEmote === emote).length > 0;
    if (!isValid) {
        throw new Error(`invalid mascot nickname: ${emote}`);
    }
}

export function scoreEmote(text, isSpooky) {
    // Split the text into words, and remove anything other than ascii letters.
    const words = text.split(/\s+/).map(word => word.replace(/[^A-Za-z]/g, ""));
    const scores = {};
    for (const emote in emoteKeywordMap) {
        scores[emote] = 0;
    }
    for (const word of words) {
        for (const emote in emoteKeywordMap) {
            if (emoteKeywordMap[emote].includes(word)) {
                scores[emote]++;
            }
        }
    }
    const limit = 1;
    // Return emote with the highest score.  If the limit is not reached, return "neutral".
    let maxEmote = "neutral";
    let maxScore = 0;
    for (const emote in scores) {
        if (scores[emote] > maxScore && scores[emote] >= limit) {
            maxScore = scores[emote];
            maxEmote = emote;
        }
    }
    if (maxEmote === "spooky" && !isSpooky) {
        maxEmote = "neutral";
    }
    return maxEmote;
}

const emoteKeywordMap = {
    "instruct": [],
    "neutral": [],
    "sigh": [],
    "spooky": [],
    "thumb": [],
};

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

