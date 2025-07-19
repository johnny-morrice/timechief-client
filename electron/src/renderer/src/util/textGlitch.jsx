import { createSignal, createResource } from "solid-js";
import { random, randomButtonGlitchSymbol, randomGlitchTransitionSymbol } from './fakeRandom';

export const buttonGlitchStyle = (text) => {
    const size = text.length + 4;
    return `width: ${size}em;`;
};

export const runWinButtonGlitch = (when, out, text, delayMs) => {
    runButtonGlitch(when, out, text, delayMs, "winning");
}

export const runButtonGlitch = (when, out, text, delayMs, styleName) => {
    let isGlitching = when();
    if (isGlitching) {
        const glitched = buttonGlitchText(text, 2);
        out(glitched);
        const interval = setInterval(() => {
            const stillGlitching = when();
            if (stillGlitching) {
                const glitched = buttonGlitchText(text, 2, styleName);
                out(glitched);
            } else {
                clearInterval(interval);
            }
        }, delayMs);

        // Always clean up after 5 minutes;
        setTimeout(() => {
            clearInterval(interval);
        }, 1000 * 60 * 5);
    }
};

export const buttonGlitchText = (text, n, styleName) => {
    // const symbols = [
    //     "!",
	// 	"#",
	// 	"$",
	// 	"%",
	// 	"^",
	// 	"&",
	// 	"*",
	// 	"+",
	// 	"=",
	// 	"|",
	// 	":",
	// 	";",
	// 	".",
	// 	"?",
	// 	"/",
    // ];
    let arr = [];
    // Random choice from 1 to n will change.
    let indicesChangeCount = Math.floor(random() * n) + 1;
    // Choose indices to change.
    let indices = [];
    for (let i = 0; i < indicesChangeCount; i++) {
        let index = Math.floor(random() * text.length);
        if (!indices.includes(index)) {
            indices.push(index);
        }
    }
    // Change indices.
    for (let i = 0; i < text.length; i++) {
        if (indices.includes(i)) {
            const symbol = randomButtonGlitchSymbol(styleName);
            arr.push(symbol);
        } else {
            arr.push(text[i]);
        }
    }
    return "".concat(...arr);
}

export const textTransitionResource = (value, getter, setter, transform, styleName) => {
    const cleanups = [];
    const doCleanup = () => {
        cleanups.forEach(cleanup => cleanup());
    };
    const addCleanup = (cleanup) => {
        cleanups.push(cleanup);
    };
    const [textBuffer] = createResource(getter, transform);
    const [intermediate, setIntermediate] = createSignal("");
    const applyHighlight = (text) => {
        console.log("textTransitionResource applying highlight");
        return highlightSpansGlitch(text, textBuffer(), styleName);
    };
    const [out] = createResource(intermediate, applyHighlight);
    var count = 0
    function doSet(data) {
        console.log("textTransitionResource doSet " + count);
        count++;
        setter(data);
        textTransitionGlitch(textBuffer, intermediate, setIntermediate, 3, addCleanup);
    }
    doSet(value);
    // Always clean up after 5 minutes.
    setTimeout(() => {
        doCleanup();
    }, 1000 * 60 * 5);
    return [out, doSet];
};

export const winTextTransitionSignal = (value) => {
    return textTransitionSignal(value, "winning");
}

export const textTransitionSignal = (value, styleName) => {
    const cleanups = [];
    const doCleanup = () => {
        cleanups.forEach(cleanup => cleanup());
    };
    const addCleanup = (cleanup) => {
        cleanups.push(cleanup);
    };
    const [buffer, setBuffer] = createSignal("");
    const [intermediate, setIntermediate] = createSignal("");
    const applyHighlight = (text) => {
        return highlightSpansGlitch(text, buffer(), styleName);
    };
    const [out] = createResource(intermediate, applyHighlight);
    var count = 0
    function doSet(data) {
        count++;
        setBuffer(data);
        textTransitionGlitch(buffer, intermediate, setIntermediate, 3, addCleanup);
    }
    doSet(value);
    // Always clean up after 5 minutes.
    setTimeout(() => {
        doCleanup();
    }, 1000 * 60 * 5);
    return [out, doSet];
}

export const textTransitionGlitch = (buffer, display, setter, n, addCleanup) => {
    const delayMs = 150;

    const more = transitionBuffer(buffer, display, setter, n);
    const startTime = new Date();
    const timeoutDuration = 1000 * 10;
    
    if (more) {
        const interval = setInterval(() => {
            const moreAgain = transitionBuffer(buffer, display, setter, n);
            const isTimeout = ((new Date()) - startTime) > timeoutDuration;
            if (!moreAgain || isTimeout) {
                clearInterval(interval);
            }
        }, delayMs);
        addCleanup(() => clearInterval(interval));
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
        let index = Math.floor(random() * diffIndices.length);
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

// Construct a jsx element with spans around the letters that are different.
// The spans should use class "inverted-color".
export const highlightSpansGlitch = (displayText, bufferText, styleName) => {
    // Compare fortune to fortuneBuffer and highlight the differences.
    // We will pad fortune and fortuneBuffer so they are the same length.
    // Then we construct a new string with <span> tags around the letters that are different.
    if (displayText === bufferText) {
        return <div><span>{displayText}</span></div>;
    }
    const maxLen = Math.max(displayText.length, bufferText.length);
    displayText = displayText.padEnd(maxLen, " ");
    bufferText = bufferText.padEnd(maxLen, " ");
    const diffIndices = [];
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
    const spans = [];
    let span = [diffIndices.includes(0), 0, 0];
    for (let i = 1; i < displayText.length; i++) {
        const isLast = i === displayText.length - 1;
        const isDiff = diffIndices.includes(i);
        const isSpanDiff = span[0];
        const isChangeSpan = isDiff !== isSpanDiff;
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

    // const symbols = [
    //     "!",
    //     "@",
    //     "#",
    //     "$",
    //     "%",
    //     "^",
    //     "&",
    //     "*",
    //     "+",
    //     "=",
    //     "|",
    //     ":",
    //     ";",
    //     ".",
    //     "?",
    //     "/",
    //     "~",
    // ];

    function sliceFortune(span) {
        const fortuneSlice = displayText.substring(span[1], span[2] + 1);
        if (!span[0]) {
            return fortuneSlice;
        }
        const arr = [];
        for (let i = 0; i < fortuneSlice.length; i++) {
            const isSymbol = random() < 0.5;
            if (isSymbol) {
                arr.push(randomGlitchTransitionSymbol(styleName));
            } else {
                arr.push(fortuneSlice[i]);
            }
        }
        return "".concat(...arr);
    }
    return <div style="inline-block">
        <For each={spans}>{(span, i) =>
            <span class={span[0] ? "inverted-color" : ""}>{sliceFortune(span)}</span>
        }</For>
    </div>
};