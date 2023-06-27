import { createSignal, onCleanup } from "solid-js";
import { second } from "../timing";

export const Fortune = () => {
    const poems = [
        "Blinking cursor waits patiently.",
        "Analog dials whisper nostalgia.",
        "Magnetic tape preserves memories.",
        "Cathode rays paint memories.",
        "Switches click, circuits connect.",
        "Tape rewinds forgotten stories.",
        "Rotary dial spins back time.",
        "Mechanical keys clack rhythmically.",
        "Tangled cords, twisted memories.",
        "Clicking keys compose forgotten symphonies.",
        "Dusty switches, relics reborn.",
        "Punch cards weave binary tales.",
        "Tubes illuminate forgotten futures.",
        "Vacuum tubes warm, signal travels.",
        "Vibrant pixels fade into oblivion.",
        "Flickering screen, digital portal.",
        "Tangled wires weave connections.",
        "Printed circuit boards hum silently.",
        "Toggle switches control ancient power.",
        "Monochrome pixels converse.",
        "Rusty cogs spin memories forward.",
        "Transistors pulse, circuits awaken.",
        "Monochrome glow, magic unfolds.",
        "Screeching modems connect distant worlds.",
        "Vintage charm, nostalgic allure.",
        "Bulky hardware, functional elegance.",
        "Screen flickers, time stands still.",
        "Teletype clatters, words unfold.",
        "Oscillating waves, invisible messages transmit.",
    ];
    const [fortune, setFortune] = createSignal("");
    const [fortuneBuffer, setFortuneBuffer] = createSignal("");
    const updatePoem = () => {
        setFortuneBuffer(poems[Math.floor(Math.random() * poems.length)]);
        transitionOverTime(2);
    };
    const transitionOverTime = (n) => {
        let more = transitionBuffer(n);
        let delayMs = second / 10;
        if (more) {
            setTimeout(() => transitionOverTime(n), delayMs);
        }
    }
    const transitionBuffer = (n) => {
        // Compare the contents of fortune and fortuneBuffer, and transition fortune to fortuneBuffer if they are different.
        // We change n letter at a time, so that the transition is smooth.
        // We pick the letters to change randomly.
        // This function will be called as many times as necessary over a short period, so we do not have to worry about the overall change, only our next step.
        var fortuneText = fortune();
        var fortuneBufferText = fortuneBuffer();
        if (fortuneText === fortuneBufferText) {
            return false;
        }
        // To make things simpler, let's pad both strings so they are the same length.
        let maxLen = Math.max(fortuneText.length, fortuneBufferText.length);
        fortuneText = fortuneText.padEnd(maxLen, " ");
        fortuneBufferText = fortuneBufferText.padEnd(maxLen, " ");
        // Find the letters that are different.
        let diffIndices = [];
        for (let i = 0; i < fortuneText.length; i++) {
            if (fortuneText[i] !== fortuneBufferText[i]) {
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
        for (let i = 0; i < fortuneText.length; i++) {
            if (lettersToChange.includes(i)) {
                transitionArray.push(fortuneBufferText[i]);
            } else {
                transitionArray.push(fortuneText[i]);
            }
        }
        setFortune(transitionArray.join(""));
        return true;
    };
    const highlightSpans = (fortuneText, fortuneBufferText) => {
        // Compare fortune to fortuneBuffer and highlight the differences.
        // We will pad fortune and fortuneBuffer so they are the same length.
        // Then we construct a new string with <span> tags around the letters that are different.
        if (fortuneText === fortuneBufferText) {
            return <div><span>{fortuneText}</span></div>;
        }
        let maxLen = Math.max(fortuneText.length, fortuneBufferText.length);
        fortuneText = fortuneText.padEnd(maxLen, " ");
        fortuneBufferText = fortuneBufferText.padEnd(maxLen, " ");
        let diffIndices = [];
        for (let i = 0; i < fortuneText.length; i++) {
            if (fortuneText[i] !== fortuneBufferText[i]) {
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
        for (let i = 1; i < fortuneText.length; i++) {
            let isLast = i === fortuneText.length - 1;
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
            let fortuneSlice = fortuneText.substring(span[1], span[2] + 1);
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
        return <div>
            <For each={spans}>{(span, i) =>
                <span class={span[0] ? "inverted-color" : ""}>{sliceFortune(span)}</span>
            }</For>
        </div>
    };

    updatePoem();
    const interval = setInterval(updatePoem, 60 * second);
    onCleanup(() => {
        clearInterval(interval);
    });
    return <div class="fortune-wrapper flex-column flex-grow">
        <div class="fortune-text">{highlightSpans(fortune(), fortuneBuffer())}</div>
    </div>;
}