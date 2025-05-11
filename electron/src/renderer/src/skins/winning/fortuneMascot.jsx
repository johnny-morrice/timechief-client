import { manageMascotCanvas } from "../../components/mascot";

var globalSignals = null;
manageMascotCanvas("fortune-canvas-winning", () => getFortuneSignals().mascotType(), () => getFortuneSignals().emote(), () => getFortuneSignals().mascotHeight());

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

export function getFortuneSignals() {
    if (!globalSignals) {
        return new FakeSignals();
    }
    return globalSignals;
}

export function setFortuneSignals(signals) {
    globalSignals = signals;
}

export function FortuneMascotCanvas(props) {
    return <div class={"fortune-message-mascot-wrapper" + " " + props.classes }>
        <canvas id="fortune-canvas-winning" class="fortune-mascot" data-sig-mascot-height={getFortuneSignals().mascotHeight()} data-sig-fg-color={getFortuneSignals().foregroundColor()} data-sig-bg-color={getFortuneSignals().boxBackgroundColor()} data-sig-emote={getFortuneSignals().emote()} data-sig-mascot-type={getFortuneSignals().mascotType()}></canvas>
    </div>
}