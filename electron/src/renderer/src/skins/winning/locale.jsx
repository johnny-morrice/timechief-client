import { onCleanup, createSignal } from 'solid-js';
import { addServiceDataCallback, removeDataCallback } from '../../ipc';
import { callbackName } from "../../util/callback";
import { Loading } from './loading';
import { winTextTransitionSignal } from '../../util/textGlitch';
import { winLabelMaker } from '../../components/label';
import { WinTable } from './wintable';

class Signals {
    constructor() {
        [this.isLoaded, this.setIsLoaded] = createSignal(false);
        [this.locale, this.setLocale] = winTextTransitionSignal("");
        [this.location, this.setLocation] = winTextTransitionSignal("");
        [this.coords, this.setCoords] = winTextTransitionSignal("");
        [this.timezone, this.setTimezone] = winTextTransitionSignal("");
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
    const label = winLabelMaker("locale");

    return <div class="locale-root flex-grow">
        <Show when={!hasLocaleInfo(signals)}>
            <Loading />
        </Show>
        <Show when={hasLocaleInfo(signals)}>
            <WinTable table={{
                body: [
                    [label("location"), signals.location],
                    [label("locale"), signals.locale],
                    [label("timezone"), signals.timezone],
                    [label("coordinates"), signals.coords]
                ]
            }}/>
        </Show>
    </div>;
};