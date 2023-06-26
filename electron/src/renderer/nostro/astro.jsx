import { Show, createSignal, onCleanup } from 'solid-js';
import { addServiceDataCallback, removeDataCallback } from './ipc';

class Signals {
    constructor() {
        [this.sunrise, this.setSunrise] = createSignal("");
        [this.sunset, this.setSunset] = createSignal("");
        [this.moonrise, this.setMoonrise] = createSignal("");
        [this.moonset, this.setMoonset] = createSignal("");
        [this.moonPhase, this.setMoonPhase] = createSignal(0);
    }
}

function hasAstro(signals) {
    return signals.sunrise() !== "" && signals.sunset() !== "" && signals.moonrise() !== "" && signals.moonset() !== "";
}

function updateAstroPageSignals(signals, data) {
    let daily = data["Weather"]["Daily"];
    if (daily.length > 0) {
        let today = daily[0];
        let sunriseUnix = today["Sunrise"];
        let sunsetUnix = today["Sunset"];
        let moonriseUnix = today["Moonrise"];
        let moonsetUnix = today["Moonset"];
        let moonphase = today["MoonPhase"];
        signals.setSunrise(parseUnixTime(sunriseUnix))
        signals.setSunset(parseUnixTime(sunsetUnix));
        signals.setMoonrise(parseUnixTime(moonriseUnix));
        signals.setMoonset(parseUnixTime(moonsetUnix));
        signals.setMoonPhase(moonphase);
    }
}

function parseUnixTime(seconds) {
    let date = new Date(seconds * 1000);
    let options = { hour: '2-digit', minute: '2-digit' };
    var dateText = date.toLocaleTimeString("en-GB", options);
    return dateText;
}

// Moon phase. 0 and 1 are 'new moon', 0.25 is 'first quarter moon', 0.5 is 'full moon' and 0.75 is 'last quarter moon'. 
// The periods in between are called 'waxing crescent', 'waxing gibous', 'waning gibous', and 'waning crescent', respectively.
function moonPhaseDescription(moonPhase) {
    function near(x, y) {
        if (x > y - 0.01 && x < y + 0.01) {
            return true;
        }
        return false;
    }

    if (near(moonPhase, 0) || near(moonPhase, 1)) {
        return "new moon"
    } else if (near(moonPhase, 0.25)) {
        return "first quarter moon";
    } else if (near(moonPhase, 0.5)) {
        return "full moon";
    } else if (near(moonPhase, 0.75)) {
        return "last quarter moon";
    }

    if (moonPhase > 0 && moonPhase < 0.25) {
        return "waxing crescent";
    } else if (moonPhase > 0.25 && moonPhase < 0.5) {
        return "waxing gibous";
    } else if (moonPhase > 0.5 && moonPhase < 0.75) {
        return "waning gibous";
    } else if (moonPhase > 0.75 && moonPhase < 1) {
        return "waning crescent";
    }

    return "";
}

export const Astro = () => {
    const signals = new Signals();
    addServiceDataCallback("Astro", (data) => updateAstroPageSignals(signals, data));

    onCleanup(() => {
        removeDataCallback("Astro");
    });

    return <div class="astro">
        <Show when={!hasAstro(signals)}>
            <div class="astro-loading">
                <div><i class="fa-solid fa-spinner fa-spin"></i></div>
            </div>
        </Show>
        <Show when={hasAstro(signals)}>
            <div class="flex-row flex-grow">
                <div class="astro-labels flex-column flex-grow">
                    <div class="data-label">Sunrise</div>
                    <div class="data-label">Sunset</div>
                    <div class="data-label">Moonrise</div>
                    <div class="data-label">Moonset</div>
                    <div class="data-label">Moon Phase</div>
                </div>
                <div class="astro-values flex-column flex-grow">
                    <div class="data-value">{signals.sunrise}</div>
                    <div class="data-value">{signals.sunset}</div>
                    <div class="data-value">{signals.moonrise}</div>
                    <div class="data-value">{signals.moonset}</div>
                    <div class="data-value">{moonPhaseDescription(signals.moonPhase())}</div>
                </div>
            </div>
        </Show>
    </div>;
};