import { createSignal, onCleanup } from "solid-js";

class Signals {
    constructor() {
        [this.characterA, this.setCharacterA] = createSignal("");
        [this.characterB, this.setCharacterB] = createSignal("夢");
        [this.characterC, this.setCharacterC] = createSignal("幻");
        [this.characterD, this.setCharacterD] = createSignal("幽");
        [this.invertA, this.setInvertA] = createSignal(false);
        [this.invertB, this.setInvertB] = createSignal(false);
        [this.invertC, this.setInvertC] = createSignal(false);
        [this.invertD, this.setInvertD] = createSignal(false);
        this.setCharacters = [this.setCharacterA, this.setCharacterB, this.setCharacterC, this.setCharacterD];
        this.setInverts = [this.setInvertA, this.setInvertB, this.setInvertC, this.setInvertD];
    }
}

export const Loading = () => {
    const maxGapIndex = 3;
    const signals = new Signals();
    var gapIndex = 0;
    const incrementGapIndex = () => {
        let newIndex = gapIndex + 1;
        if (newIndex > maxGapIndex) {
            newIndex = 0;
        }
        gapIndex = newIndex;
    }
    const symbols = [
        "@",
        "#",
        "$",
        "%",
        "&",
        "電", // Electric
        "神", // God
        "夢", // Dream
        "幻", // Illusion
        "現", // Reality
        "結", // Connection
        "遠", // Distance
        "界", // World
        "道", // Path
        "意", // Mind
        "覚", // Perception
        "網", // Network
        "暗", // Darkness
        "映", // Reflection
        "影", // Shadow
        "幽", // Ghost

    ];
    const updateSignals = () => {
        const gapCharacter = " ";
        const setCharacterFuncs = signals.setCharacters;
        for (let i = 0; i < setCharacterFuncs.length; i++) {
            if (i === gapIndex) {
                setCharacterFuncs[i](gapCharacter);
            } else {
                setCharacterFuncs[i](symbols[Math.floor(Math.random() * symbols.length)]);
            }
            const isColorInverted = Math.random() < 0.1;
            const setInvert = signals.setInverts[i];
            setInvert(isColorInverted);
        }
    };
    const interval = setInterval(updateSignals, 200);
    onCleanup(() => {
        clearInterval(interval);
    });
    function gridSquareClass(signal) {
        return "loading-grid-item" + (signal() ? " inverted-color" : "");
    }
    return <div class="loading-grid">
        <div class={gridSquareClass(signals.invertA)}>{signals.characterA}</div>
        <div class={gridSquareClass(signals.invertB)}>{signals.characterB}</div>
        <div class={gridSquareClass(signals.invertC)}>{signals.characterC}</div>
        <div class={gridSquareClass(signals.invertD)}>{signals.characterD}</div>
    </div>;
};