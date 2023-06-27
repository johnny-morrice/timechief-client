import { createSignal, onCleanup } from 'solid-js';
import { addServiceDataCallback, removeDataCallback } from './ipc';
import { callbackName } from "./callback";
import { Loading } from './loading';

class Signals {
    constructor() {
        [this.location, this.setLocation] = createSignal("");
        [this.latitude, this.setLatitude] = createSignal("");
        [this.longitude, this.setLongitude] = createSignal("");
        [this.timezone, this.setTimezone] = createSignal("");
    }
}

function updateSignals(signals, data) {
    let clock = data["Clock"];
    let location = clock["Location"];
    let latitude = clock["Latitude"];
    let longitude = clock["Longitude"];
    let timezone = clock["Timezone"];
    signals.setLatitude(latitude);
    signals.setLongitude(longitude);
    signals.setTimezone(timezone);
    signals.setLocation(location);
}

function hasLocaleInfo(signals) {
    return signals.latitude() !== "" && signals.longitude() !== "" && signals.timezone() !== "";
}

export const Locale = () => {
    let signals = new Signals();
    const cbName = callbackName("Locale");
    addServiceDataCallback(cbName, (data) => updateSignals(signals, data));
    onCleanup(() => {
        removeDataCallback(cbName);
    });

    return <div class="locale-root flex-grow">
        <Show when={!hasLocaleInfo(signals)}>
            <Loading />
        </Show>
        <div class="flex-row flex-grow">
            <div class="locale-labels flex-column flex-grow">
                <div class='data-label flex-grow'>Location</div>
                <div class='data-label flex-grow'>Timezone</div>
                <div class='data-label flex-grow'>Coords</div>
            </div>
            <div class="locale-values flex-column flex-grow">
                <div class='data-value flex-grow'>{signals.location}</div>
                <div class='data-value flex-grow'>{signals.timezone}</div>
                <div class='data-value flex-grow'>{signals.latitude}, {signals.longitude}</div>
            </div>
        </div>
    </div>;
};