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

manageMascotCanvas("event-mascot-canvas", () => getActionCenterSignals().emote(), () => getActionCenterSignals().mascotHeight());

export function EventMascotCanvas() {
    return <div class="event-mascot-wrapper">
        <canvas id="event-mascot-canvas" class="fortune-mascot" data-sig-mascot-height={getActionCenterSignals().mascotHeight()} data-sig-fg-color={getActionCenterSignals().foregroundColor()} data-sig-bg-color={getActionCenterSignals().boxBackgroundColor()} data-sig-emote={getActionCenterSignals().emote()}></canvas>
    </div>
}