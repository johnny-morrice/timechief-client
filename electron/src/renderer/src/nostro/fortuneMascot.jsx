import { manageMascotCanvas } from "./mascot";

var globalSignals = null;
manageMascotCanvas("fortune-canvas", () => globalSignals ? globalSignals.emote() : "neutral", () => globalSignals ? globalSignals.mascotHeight() : "120px" );

class FakeSignals {
    mascotHeight() {
        return "120px";
    }

    emote() {
        return "neutral";
    }

    foregroundColor() {
        return "green";
    }

    boxBackgroundColor() {
        return "black";
    }
}

export function getFortuneSignals() {
    if (!globalSignals) {
        return new FakeSignals();
    }
    return globalSignals;
}

export function setFortuneSignals(signals) {
    globalSignals = signals;
}