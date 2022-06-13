import { createSignal } from 'solid-js';
import { addClockDataCallback } from './ipc';

class AstroPageSignals {
  constructor() {
      [this.sunrise, this.setSunrise] = createSignal("");
      [this.sunset, this.setSunset] = createSignal("");
      [this.moonrise, this.setMoonrise] = createSignal("");
      [this.moonset, this.setMoonset] = createSignal("");
      [this.moonPhase, this.setMoonPhase] = createSignal(0);

  }
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

var initialised = false;
let astroSignals = new AstroPageSignals();
export const AstroPage = () => {
  
  if (!initialised) {
    addClockDataCallback((data) => updateAstroPageSignals(astroSignals, data));
    initialised = true;
  }

  return <div id="astro-screen">
        <div class="column-flex">
            <div class="flex-element section-name underline">Astronomical Data</div>
            <div class='row-flex flex-element'>
                <div class="flex-element data-name">Sunrise</div>
                <div class="flex-element data-value">{astroSignals.sunrise}</div>
            </div>
            <div class='row-flex flex-element'>
                <div class="flex-element data-name">Sunset</div>
                <div class="flex-element data-value">{astroSignals.sunset}</div>
            </div>
            <div class='row-flex flex-element'>
                <div class="flex-element data-name">Moonrise</div>
                <div class="flex-element data-value">{astroSignals.moonrise}</div>
            </div>
            <div class='row-flex flex-element'>
                <div class="flex-element data-name">Moonset</div>
                <div class="flex-element data-value">{astroSignals.moonset}</div>
            </div>
            <div class='row-flex flex-element'>
                <div class="flex-element data-name">Moon Phase</div>
                <div class="flex-element data-value">{moonPhaseDescription(astroSignals.moonPhase())}</div>
            </div>

        </div>
  </div>;
};