import { createResource, createSignal } from "solid-js";

export function delay(callback, ms) {
    var timer = 0;
    return function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            callback();
        }, ms);
    };
}

function getClockValue(clock, key) {
    if (key in clock) {
        return clock[key];
    }
}

export function getClockDeviceSerial(clock) {
    return getClockValue(clock, "DeviceSerial");
}

export function getClockLocation(clock) {
    return getClockValue(clock, "Location");
}

export function getClockLatitude(clock) {
    return getClockValue(clock, "Latitude");
}

export function getClockLongitude(clock) {
    return getClockValue(clock, "Longitude");
}

export function getClockLocale(clock) {
    return getClockValue(clock, "Locale");
}

function isClockHourCycle(clock, hourCycle) {
    return hourCycle == getClockValue(clock, "HourCycleOption");
}

export function isClockHourCycleLocaleDefault(clock) {
    return isClockHourCycle(clock, "");
}

export function isClockHourCycle24H(clock) {
    return isClockHourCycle(clock, "24h");
}

export function isClockHourCycle12H(clock) {
    return isClockHourCycle(clock, "12h");
}

export function isClockDisplayTimezone(clock) {
    return getClockValue(clock, "DisplayTimezone");
}

export function getClockTimezone(clock) {
    return getClockValue(clock, "Timezone");
}

export function buildAutocompleteHandler(elementId, defaultFunc, searchFunc) {
    return async function (opts) {
        if (!opts.show) {
            console.log("autocomplete was hidden");
            return [];
        }
        const elem = document.getElementById(elementId);
        if (elem) {
            const term = elem.value;
            if (!term) {
                console.log("no autocomplete term, showing defaults");
                return (await defaultFunc()).slice(0, 5);
            }
            console.log("auto completing for term: " + term);
            const json = await searchFunc(term);
            console.log("autocomplete json...");
            console.log(json);
            return json.slice(0, 5);
        }
        console.log("autocomplete input not found");
        return [];
    }
}

var autocompleteUniqNumber = 0;
export function autocompleteUniq() {
    return autocompleteUniqNumber++;
}

export function createAutocompleteResource(handler) {
    const [autocompleteArgs, triggerAutocomplete] = createSignal({ show: false, num: autocompleteUniq() });
    const [autocompleteList, _] = createResource(autocompleteArgs, handler);
    return [autocompleteList, triggerAutocomplete];
}

var savedTimeout = 0;
export function showSavedFader() {
    const savedWrapper = document.getElementById('saved-wrapper');
    var savedElem = document.getElementById('saved-fader');
    if (savedElem) {
        clearTimeout(savedTimeout);
        savedElem.style.opacity = "1";
    } else {
        savedElem = <div id="saved-fader" style="opacity: 1;">Saved!</div>
        savedWrapper.appendChild(savedElem);
    }
    setTimeout(() => savedElem.style.opacity = "0", 1000);
    savedTimeout = setTimeout(() => savedWrapper.removeChild(savedElem), 2000);
}