import { onCleanup, createSignal } from 'solid-js';
import { addServiceDataCallback, removeDataCallback } from './ipc';
import { callbackName } from "./callback";
import { Loading } from './loading';
import { textTransitionSignal } from './textGlitch';

class Signals {
    constructor() {
        [this.isLoaded, this.setIsLoaded] = createSignal(false);
        [this.location, this.setLocation] = textTransitionSignal("");
        [this.coords, this.setCoords] = textTransitionSignal("");
        [this.timezone, this.setTimezone] = textTransitionSignal("");
    }
}

function updateSignals(signals, data) {
    let clock = data["Clock"];
    let location = clock["Location"];
    let latitude = clock["Latitude"];
    let longitude = clock["Longitude"];
    let timezone = clock["Timezone"];
    signals.setCoords(`${latitude}, ${longitude}`);
    signals.setTimezone(timezone);
    signals.setLocation(location);
    signals.setIsLoaded(true);
}

function hasLocaleInfo(signals) {
    return signals.isLoaded();
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
                <div class='data-value flex-grow'>{signals.coords}</div>
            </div>
        </div>
    </div>;
};