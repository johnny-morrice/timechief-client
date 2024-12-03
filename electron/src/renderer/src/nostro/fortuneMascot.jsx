import { manageMascotCanvas } from "./mascot";

var globalSignals = null;
manageMascotCanvas("fortune-canvas", () => getFortuneSignals().emote(), () => getFortuneSignals().mascotHeight());

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

export function FortuneMascotCanvas() {
    <div class="fortune-message-mascot-wrapper">
        <canvas id="fortune-canvas" class="fortune-mascot" data-sig-mascot-height={getFortuneSignals().mascotHeight()} data-sig-fg-color={getFortuneSignals().foregroundColor()} data-sig-bg-color={getFortuneSignals().boxBackgroundColor()} data-sig-emote={getFortuneSignals().emote()}></canvas>
    </div>
}