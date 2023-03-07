import { createSignal } from 'solid-js';
import { addClockDataCallback, addDeviceStatusCallback, triggerRedeploy } from './ipc';

class Signals {
    constructor() {
        [this.location, this.setLocation] = createSignal("");
        [this.latitude, this.setLatitude] = createSignal("");
        [this.longitude, this.setLongitude] = createSignal("");
        [this.timezone, this.setTimezone] = createSignal("GB");
    }
}

function updateSignals(signals, data) {
    let clock = data["Clock"];
    let location = clock["Location"];
    let latitude = clock["Latitude"];
    let longitude = clock["Longitude"];
    let timezone = clock["Timezone"];
    signals.setLocation(location);
    signals.setLatitude(latitude);
    signals.setLongitude(longitude);
    signals.setTimezone(timezone);
}

var initialised = false;
let signals = new Signals();
export const LocalePage = () => {
    
    if (!initialised) {
        addClockDataCallback((data) => updateSignals(signals, data));
        initialised = true;
    }

    return <div id="locale-root">
        <div class="column-flex">
            <div class='flex-element section-name underline'>Language and Location</div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Location</div>
                <div class='flex-element'>{signals.location}</div>
            </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Timezone</div>
                <div class='flex-element'>{signals.timezone}</div>
            </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Coordinates</div>
                <div class='flex-element'>{signals.latitude}, {signals.longitude}</div>
            </div>
        </div>
    </div>;
};