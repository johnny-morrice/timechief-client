import { manageMascotCanvas } from "./mascot";

var globalSignals = null;

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

export function getActionCenterSignals() {
    if (!globalSignals) {
        return new FakeSignals();
    }
    return globalSignals;
}

export function setActionCenterSignals(signals) {
    globalSignals = signals;
}

manageMascotCanvas("event-mascot-canvas", () => globalSignals ? globalSignals.emote() : "neutral", () => globalSignals ? globalSignals.mascotHeight() : "120px");