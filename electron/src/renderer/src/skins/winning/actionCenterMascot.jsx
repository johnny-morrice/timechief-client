import { manageMascotCanvas } from "../../components/mascot";

var globalSignals = null;

class FakeSignals {
    mascotHeight() {
        return "100px";
    }

    emote() {
        return "neutral";
    }

    foregroundColor() {
        return "#000000ff";
    }

    boxBackgroundColor() {
        return "#c0c0c0ff";
    }

    mascotType() {
        return "light";
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

manageMascotCanvas("event-mascot-canvas-winning", () => getActionCenterSignals().mascotType(), () => getActionCenterSignals().emote(), () => getActionCenterSignals().mascotHeight());

export function EventMascotCanvas() {
    return <div class="event-mascot-wrapper">
        <canvas id="event-mascot-canvas-winning" class="fortune-mascot" data-sig-mascot-height={getActionCenterSignals().mascotHeight()} data-sig-fg-color={getActionCenterSignals().foregroundColor()} data-sig-bg-color={getActionCenterSignals().boxBackgroundColor()} data-sig-emote={getActionCenterSignals().emote()} data-sig-mascot-type={getActionCenterSignals().mascotType()}></canvas>
    </div>
}