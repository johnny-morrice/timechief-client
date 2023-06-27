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