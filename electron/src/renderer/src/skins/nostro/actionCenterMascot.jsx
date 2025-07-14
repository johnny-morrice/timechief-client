import { manageMascotCanvas } from "../../components/mascot";

var globalSignals = null;
var isManaged = false;
if (!isManaged) {
    isManaged = true;
    manageMascotCanvas("event-mascot-canvas-nostro", () => getActionCenterSignals().mascotType(), () => getActionCenterSignals().emote(), () => getActionCenterSignals().mascotHeight());
}


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

    mascotType() {
        return "dark";
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

export function EventMascotCanvas() {
    return <div class="event-mascot-wrapper">
        <canvas id="event-mascot-canvas-nostro" class="fortune-mascot" data-sig-mascot-height={getActionCenterSignals().mascotHeight()} data-sig-fg-color={getActionCenterSignals().foregroundColor()} data-sig-bg-color={getActionCenterSignals().boxBackgroundColor()} data-sig-emote={getActionCenterSignals().emote()} data-sig-mascot-type={getActionCenterSignals().mascotType()}></canvas>
    </div>
}