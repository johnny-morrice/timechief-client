import { createSignal, createResource } from "solid-js";
import { second } from "../timing";

export const glitchStyle = (text) => {
    const size = text.length + 2;
    return `width: ${size}em;`;
};

export const runTextGlitch = (when, out, text, delayMs) => {
    let isGlitching = when();
    if (isGlitching) {
        const glitched = textGlitch(text, 2);
        out(glitched);
        setTimeout(() => {
            runTextGlitch(when, out, text, delayMs);
        }, delayMs);
    }
};

export const textGlitch = (text, n) => {
    const symbols = [
        "!",
        "#",
        "$",
        "%",
        "^",
        "&",
        "*",
        "+",
        "=",
        "|",
        ":",
        ";",
        ".",
        "?",
        "/",
        "~",
    ];
    let arr = [];
    // Random choice from 1 to n will change.
    let indicesChangeCount = Math.floor(Math.random() * n) + 1;
    // Choose indices to change.
    let indices = [];
    for (let i = 0; i < indicesChangeCount; i++) {
        let index = Math.floor(Math.random() * text.length);
        if (!indices.includes(index)) {
            indices.push(index);
        }
    }
    // Change indices.
    for (let i = 0; i < text.length; i++) {
        if (indices.includes(i)) {
            let symbolIndex = Math.floor(Math.random() * symbols.length);
            arr.push(symbols[symbolIndex]);
        } else {
            arr.push(text[i]);
        }
    }
    return arr.join("");
}

export const textTransitionSignal = (value) => {
    const [buffer, setBuffer] = createSignal("");
    const [intermediate, setIntermediate] = createSignal("");
    const applyHighlight = (text) => {
        return highlightSpansGlitch(text, buffer());
    };
    const [out] = createResource(intermediate, applyHighlight);
    function doSet(data) {
        setBuffer(data);
        textTransitionGlitch(buffer, intermediate, setIntermediate, 2);
    }
    doSet(value);
    return [out, doSet];
}

export const textTransitionGlitch = (buffer, display, setter, n) => {
    let more = transitionBuffer(buffer, display, setter, n);
    let delayMs = second / 10;
    if (more) {
        setTimeout(() => textTransitionGlitch(buffer, display, setter, n), delayMs);
    }
}
const transitionBuffer = (buffer, display, setter, n) => {
    // Compare the contents of fortune and fortuneBuffer, and transition fortune to fortuneBuffer if they are different.
    // We change n letter at a time, so that the transition is smooth.
    // We pick the letters to change randomly.
    // This function will be called as many times as necessary over a short period, so we do not have to worry about the overall change, only our next step.
    var displayText = display();
    var bufferText = buffer();
    if (displayText === bufferText) {
        return false;
    }
    // To make things simpler, let's pad both strings so they are the same length.
    let maxLen = Math.max(displayText.length, bufferText.length);
    displayText = displayText.padEnd(maxLen, " ");
    bufferText = bufferText.padEnd(maxLen, " ");
    // Find the letters that are different.
    let diffIndices = [];
    for (let i = 0; i < displayText.length; i++) {
        if (displayText[i] !== bufferText[i]) {
            diffIndices.push(i);
        }
    }
    // Pick n letters to transition.
    // We need to make sure the indices are unique.
    // The maximum letters to change is n, or the number of different letters, whichever is smaller.
    // If there are fewer than n different letters, we will change all of them.
    let maxLettersToChange = Math.min(n, diffIndices.length);
    let lettersToChange = [];
    while (lettersToChange.length < maxLettersToChange) {
        let index = Math.floor(Math.random() * diffIndices.length);
        let diffIndex = diffIndices[index];
        if (!lettersToChange.includes(diffIndex)) {
            lettersToChange.push(diffIndex);
        }
    }
    // Change the letters.
    let transitionArray = [];
    for (let i = 0; i < displayText.length; i++) {
        if (lettersToChange.includes(i)) {
            transitionArray.push(bufferText[i]);
        } else {
            transitionArray.push(displayText[i]);
        }
    }
    setter(transitionArray.join(""));
    return true;
};
export const highlightSpansGlitch = (displayText, bufferText) => {
    // Compare fortune to fortuneBuffer and highlight the differences.
    // We will pad fortune and fortuneBuffer so they are the same length.
    // Then we construct a new string with <span> tags around the letters that are different.
    if (displayText === bufferText) {
        return <div><span>{displayText}</span></div>;
    }
    let maxLen = Math.max(displayText.length, bufferText.length);
    displayText = displayText.padEnd(maxLen, " ");
    bufferText = bufferText.padEnd(maxLen, " ");
    let diffIndices = [];
    for (let i = 0; i < displayText.length; i++) {
        if (displayText[i] !== bufferText[i]) {
            diffIndices.push(i);
        }
    }
    // Let's create a list of spans.
    // We need to merge adjacent indices.
    // We need to marke when it's different.
    // For example, if diffIndices is [1,2,3,5,6,7], and the length of the string is 10, the output will be it to [[false,0,0][true,1,3],[false,4,4],[true,5,7],[false,8,9]].
    // The first element is whether it's different, the second is the start index, and the third is the end index.
    let spans = [];
    let span = [diffIndices.includes(0), 0, 0];
    for (let i = 1; i < displayText.length; i++) {
        let isLast = i === displayText.length - 1;
        let isDiff = diffIndices.includes(i);
        let isSpanDiff = span[0];
        let isChangeSpan = isDiff !== isSpanDiff;
        if (isChangeSpan) {
            spans.push(span);
            span = [isDiff, i, i];
        } else {
            span[2] = i;
        }
        if (isLast) {
            spans.push(span);
        }
    }

    // Construct a jsx element with spans around the letters that are different.
    // The spans should use class "inverted-color".
    function sliceFortune(span) {
        let fortuneSlice = displayText.substring(span[1], span[2] + 1);
        if (!span[0]) {
            return fortuneSlice;
        }
        const symbols = [
            "!",
            "@",
            "#",
            "$",
            "%",
            "^",
            "&",
            "*",
            "+",
            "=",
            "|",
            ":",
            ";",
            ".",
            "?",
            "/",
            "~",
            // "電", // Electric
            // "神", // God
            // "夢", // Dream
            // "幻", // Illusion
            // "現", // Reality
            // "結", // Connection
            // "遠", // Distance
            // "界", // World
            // "道", // Path
            // "意", // Mind
            // "覚", // Perception
            // "網", // Network
            // "暗", // Darkness
            // "映", // Reflection
            // "影", // Shadow
            // "幽", // Ghost
            // "光", // Light
            // "無", // Nothingness
            // "碑", // Monument
            // "迷", // Lost
            // "儀" // Ritual
        ];
        let arr = [];
        for (let i = 0; i < fortuneSlice.length; i++) {
            const isSymbol = Math.random() < 0.5;
            if (isSymbol) {
                arr.push(symbols[Math.floor(Math.random() * symbols.length)]);
            } else {
                arr.push(fortuneSlice[i]);
            }
        }
        return arr.join("");
    }
    return <div style="inline-block">
        <For each={spans}>{(span, i) =>
            <span class={span[0] ? "inverted-color" : ""}>{sliceFortune(span)}</span>
        }</For>
    </div>
};