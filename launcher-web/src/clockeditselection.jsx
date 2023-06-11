import { createSignal, createResource } from 'solid-js';
import { getClock } from './api';

var getClockNum = 0;
function getClockUniq() {
    return getClockNum++;
}

export function getClockRequest(serial) {
    return {serial: serial, num: getClockUniq()};
}

export function refreshClock(clock) {
    if ("DeviceSerial" in clock) {
        const editSelection = getEditSelection();
        editSelection.triggerGetClock(getClockRequest(clock["DeviceSerial"]));
    }
}

function getClockWrapper(options) {
    console.log("getting clock...");
    console.log(options);
    const serial = options["serial"];
    if (serial) {
        return getClock(serial);
    }
    return {};
}

function fetchClockHandler() {
    const [getClockArgs, triggerGetClock] = createSignal({serial: "", num: getClockUniq() });
    const [clock, _] = createResource(getClockArgs, getClockWrapper);
    return [clock, triggerGetClock];
}

class EditSelection {
    constructor() {
        [this.clock, this.triggerGetClock] = fetchClockHandler();
    }

    setClock(clock) {
        if ("DeviceSerial" in clock) {
            this.triggerGetClock(getClockRequest(clock["DeviceSerial"]));
        } else {
            console.log("no device serial found for clock");
        }
    }
}

const editSelection = new EditSelection();

export function getEditSelection() {
    return editSelection;
} 