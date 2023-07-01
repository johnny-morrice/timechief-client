import { createSignal, onCleanup } from 'solid-js';
import { isCalendarExists } from '../calendarHelper';
import { addDataCallback, removeDataCallback } from './ipc';
import { apiErrorTimeout, second } from '../timing'
import { callbackName } from "./callback";

class Signals {
    constructor() {
        [this.lastUpdateTime, this.setLastUpdateTime] = createSignal(new Date());
        [this.isAccountLinked, this.setAccountLinked] = createSignal(false);
        [this.isCalendarExists, this.setCalendarExists] = createSignal(false);
        [this.isCalendarError, this.setCalendarError] = createSignal(false);
        [this.isUpdating, this.setUpdating] = createSignal(false);
        [this.isDeviceDataError, this.setDeviceDataError] = createSignal(false);
        [this.pulse, this.setPulse] = createSignal(false);
    }
}

function hasStateFlag(data, flag) {
    let launcherState = data["LauncherState"];
    if (launcherState) {
        let flags = launcherState["Flags"];
        if (flags) {
            return flags.includes(flag);
        }
    }
    return false;
}

function updateSignals(signals, data) {
    signals.setLastUpdateTime(new Date());
    let serviceData = data["ServiceData"];
    if (serviceData) {
        signals.setCalendarExists(isCalendarExists(serviceData));
    }
    signals.setCalendarError(hasStateFlag(data, "calendar-error"))
    signals.setAccountLinked(hasStateFlag(data, "principal-linked"));
    signals.setDeviceDataError(hasStateFlag(data, "device-data-error"));
    signals.setUpdating(hasStateFlag(data, "updating"));
}

function isTimeout(lastTime, timeout) {
    const now = new Date();
    const diff = now.getTime() - lastTime.getTime();
    return diff >= timeout;
}

function isDeviceDataError(signals) {
    return signals.isDeviceDataError() || isTimeout(signals.lastUpdateTime(), apiErrorTimeout);
}

export const StatusNote = () => {
    const signals = new Signals();
    const cbName = callbackName("StatusNote");
    addDataCallback(cbName, (data) => updateSignals(signals, data));
    const pulseInterval = setInterval(() => signals.setPulse(!signals.pulse()), 3 * second);
    onCleanup(() => {
        removeDataCallback(cbName);
        clearInterval(pulseInterval);
    });

    return <div class="status-note-root">
        <div class="status-note flex-column">
            <Show when={signals.isCalendarError()}>
                <div class="status-note-calendar-error-indicator">
                    <i class='fa-solid fa-calendar-xmark is-error api-error-indicator'></i>
                </div>
            </Show>
            <Show when={isDeviceDataError(signals)}>
                <div class="status-note-api-error-indicator">
                    <i class='fa-solid fa-heart-crack is-error api-error-indicator'></i>
                </div>
            </Show>
            <Show when={signals.isUpdating()}>
                <div class="status-note-api-error-indicator">
                    <i class='fa-solid fa-floppy-disk fa-fade api-error-indicator'></i>
                </div>
            </Show>
        </div>
    </div>
};