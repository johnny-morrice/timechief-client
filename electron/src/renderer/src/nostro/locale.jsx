import { onCleanup, createSignal } from 'solid-js';
import { addServiceDataCallback, removeDataCallback } from './ipc';
import { callbackName } from "./callback";
import { Loading } from './loading';
import { textTransitionSignal } from './textGlitch';
import { labelMaker } from './label';

class Signals {
    constructor() {
        [this.isLoaded, this.setIsLoaded] = createSignal(false);
        [this.locale, this.setLocale] = textTransitionSignal("");
        [this.location, this.setLocation] = textTransitionSignal("");
        [this.coords, this.setCoords] = textTransitionSignal("");
        [this.timezone, this.setTimezone] = textTransitionSignal("");
    }
}

function updateSignals(signals, data) {
    let deviceProfileDatum = data["device_profile"];
    if (!deviceProfileDatum) {
        return;
    }
    let deviceProfile = deviceProfileDatum["value"];
    if (!deviceProfile) {
        return;
    }
    let device = deviceProfile["device"];
    let location = device["location"];
    let latitude = device["latitude"];
    let longitude = device["longitude"];
    let timezone = device["timezone"];
    let locale = device["locale"];
    signals.setCoords(`${latitude}, ${longitude}`);
    signals.setTimezone(timezone);
    signals.setLocation(location);
    signals.setLocale(locale);
    signals.setIsLoaded(true);
}

function hasLocaleInfo(signals) {
    return signals.isLoaded();
}

export const Locale = () => {
    console.log("Locale render");
    let signals = new Signals();
    const cbName = callbackName("Locale");
    addServiceDataCallback(cbName, (data) => updateSignals(signals, data));
    onCleanup(() => {
        removeDataCallback(cbName);
    });
    const label = labelMaker("locale");

    return <div class="locale-root flex-grow">
        <Show when={!hasLocaleInfo(signals)}>
            <Loading />
        </Show>
        <div class="flex-row flex-grow">
            <div class="locale-labels flex-column flex-grow">
                <div class='data-label flex-grow'>{label("location")}</div>
                <div class='data-label flex-grow'>{label("locale")}</div>
                <div class='data-label flex-grow'>{label("timezone")}</div>
                <div class='data-label flex-grow'>{label("coordinates")}</div>
            </div>
            <div class="locale-values flex-column flex-grow">
                <div class='data-value flex-grow'>{signals.location}</div>
                <div class='data-value flex-grow'>{signals.locale}</div>
                <div class='data-value flex-grow'>{signals.timezone}</div>
                <div class='data-value flex-grow'>{signals.coords}</div>
            </div>
        </div>
    </div>;
};