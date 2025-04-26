import { Show, createSignal, onCleanup } from 'solid-js';
import { addServiceDataCallback, removeDataCallback } from '../../ipc';
import { callbackName } from "../../util/callback";
import { Loading } from './loading';
import { textTransitionSignal, textTransitionResource } from "../../util/textGlitch";
import { labelMaker } from '../../components/label';

class Signals {
    constructor() {
        [this.sunrise, this.setSunrise] = textTransitionSignal("");
        [this.sunset, this.setSunset] = textTransitionSignal("");
        [this.moonrise, this.setMoonrise] = textTransitionSignal("");
        [this.moonset, this.setMoonset] = textTransitionSignal("");
        [this.moonPhase, this.setMoonPhase] = createSignal(0);
        [this.moonPhaseText, this.setMoonPhaseText] = textTransitionResource("", this.moonPhase, this.setMoonPhase, moonPhaseDescription);
    }
}

function hasAstro(signals) {
    return signals.sunrise() !== "" && signals.sunset() !== "" && signals.moonrise() !== "" && signals.moonset() !== "";
}

function updateAstroPageSignals(signals, data) {
    let weatherDatum = data["owm"];
    if (!weatherDatum) {
        return;
    }
    let weather = weatherDatum["value"];
    if (!weather) {
        return;
    }
    let daily = weather["daily"];
    if (!daily) {
        return;
    }
    if (daily.length > 0) {
        let today = daily[0];
        let sunriseUnix = today["sunrise"];
        let sunsetUnix = today["sunset"];
        let moonriseUnix = today["moonrise"];
        let moonsetUnix = today["moonset"];
        let moonphase = today["moon_phase"];
        signals.setSunrise(parseUnixTime(sunriseUnix))
        signals.setSunset(parseUnixTime(sunsetUnix));
        signals.setMoonrise(parseUnixTime(moonriseUnix));
        signals.setMoonset(parseUnixTime(moonsetUnix));
        signals.setMoonPhaseText(moonphase);
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
    console.log("Astro render");
    const signals = new Signals();
    const cbName = callbackName("Astro");
    addServiceDataCallback(cbName, (data) => updateAstroPageSignals(signals, data));

    onCleanup(() => {
        removeDataCallback(cbName);
    });

    const label = labelMaker("astro");

    return <div class="astro">
        <Show when={!hasAstro(signals)}>
            <Loading />
        </Show>
        <Show when={hasAstro(signals)}>
            <div class="flex-row flex-grow">
                <div class="astro-labels flex-column flex-grow">
                    <div class="data-label">{label("sunrise")} </div>
                    <div class="data-label">{label("sunset")} </div>
                    <div class="data-label">{label("moonrise")} </div>
                    <div class="data-label">{label("moonset")} </div>
                    <div class="data-label">{label("moon-phase")} </div>
                </div>
                <div class="astro-values flex-column flex-grow">
                    <div class="data-value">{signals.sunrise}</div>
                    <div class="data-value">{signals.sunset}</div>
                    <div class="data-value">{signals.moonrise}</div>
                    <div class="data-value">{signals.moonset}</div>
                    <div class="data-value">{signals.moonPhaseText}</div>
                </div>
            </div>
        </Show>
    </div>;
};