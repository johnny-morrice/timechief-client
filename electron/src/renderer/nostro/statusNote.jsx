import { createEffect, createSignal, onCleanup } from 'solid-js';
import { addDataCallback, removeDataCallback } from './ipc';
import { apiErrorTimeout, second } from '../timing'
import { callbackName } from "./callback";
import { fadeTransition } from './fadeTransition';

class Signals {
    constructor() {
        [this.lastUpdateTime, this.setLastUpdateTime] = createSignal(new Date());
        [this.isCalendarErrorBuffer, this.setCalendarErrorBuffer] = createSignal(false);
        [this.isCalendarError, this.setCalendarError] = createSignal(false);
        [this.isUpdatingBuffer, this.setUpdatingBuffer] = createSignal(false);
        [this.isUpdating, this.setUpdating] = createSignal(false);
        [this.isDeviceDataErrorBuffer, this.setDeviceDataErrorBuffer] = createSignal(false);
        [this.isDeviceDataError, this.setDeviceDataError] = createSignal(false);
        [this.isIPCTimeoutBuffer, this.setIPCTimeoutBuffer] = createSignal(false);
        [this.isIPCTimeout, this.setIPCTimeout] = createSignal(false);
    }
}

function hasStateFlag(data, flag) {
    let launcherState = data["launcher_state"];
    if (launcherState) {
        let flags = launcherState["flags"];
        if (flags) {
            return flags.includes(flag);
        }
    }
    return false;
}

function updateSignals(signals, data) {
    signals.setLastUpdateTime(new Date());
    signals.setCalendarErrorBuffer(hasStateFlag(data, "calendar-error"))
    signals.setDeviceDataErrorBuffer(hasStateFlag(data, "device-data-error"));
    signals.setUpdatingBuffer(hasStateFlag(data, "updating"));
}

function isTimeout(lastTime, timeout) {
    const now = new Date();
    const diff = now.getTime() - lastTime.getTime();
    return diff >= timeout;
}

function isDeviceDataError(signals) {
    return signals.isDeviceDataError() || signals.isIPCTimeout();
}

function fadeChange(action) {
    fadeTransition("status-note-content", action);
}

export const StatusNote = () => {
    const signals = new Signals();
    const cbName = callbackName("StatusNote");
    addDataCallback(cbName, (data) => updateSignals(signals, data));
    const ipcCheckInterval = setInterval(() => {
        signals.setIPCTimeoutBuffer(isTimeout(signals.lastUpdateTime(), 6 * second));
    }, 3 * second);
    onCleanup(() => {
        removeDataCallback(cbName);
        clearInterval(ipcCheckInterval);
    });
    // TODO this createEffect will be breaking the clock.
    createEffect(() => {
        if (signals.isCalendarErrorBuffer() !== signals.isCalendarError() || 
            signals.isDeviceDataErrorBuffer() !== signals.isDeviceDataError() ||
            signals.isUpdatingBuffer() !== signals.isUpdating() ||
            signals.isIPCTimeoutBuffer() !== signals.isIPCTimeout()) {
            fadeChange(() => {
                signals.setCalendarError(signals.isCalendarErrorBuffer());
                signals.setDeviceDataError(signals.isDeviceDataErrorBuffer());
                signals.setUpdating(signals.isUpdatingBuffer());
                signals.setIPCTimeout(signals.isIPCTimeoutBuffer());
            });
        }
    });

    return <div id="status-note-content" class="status-note flex-column">
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
};