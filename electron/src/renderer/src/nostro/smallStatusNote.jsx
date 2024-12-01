import { createSignal, onCleanup } from 'solid-js';
import { addDataCallback, isEcoMode, removeDataCallback } from './ipc';
import { second } from '../timing'
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
        [this.isEcoMode, this.setEcoMode] = createSignal(false);
        [this.statusNoteTransition, this.setStatusNoteTransition] = createSignal("no-transition");
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
    signals.setEcoMode(isEcoMode());

    if (signals.isCalendarErrorBuffer() !== signals.isCalendarError() || 
            signals.isDeviceDataErrorBuffer() !== signals.isDeviceDataError() ||
            signals.isUpdatingBuffer() !== signals.isUpdating() ||
            signals.isIPCTimeoutBuffer() !== signals.isIPCTimeout()) {
            fadeTransition(signals.setStatusNoteTransition, () => {
                signals.setCalendarError(signals.isCalendarErrorBuffer());
                signals.setDeviceDataError(signals.isDeviceDataErrorBuffer());
                signals.setUpdating(signals.isUpdatingBuffer());
                signals.setIPCTimeout(signals.isIPCTimeoutBuffer());
            });
        }
}

function isTimeout(lastTime, timeout) {
    const now = new Date();
    const diff = now.getTime() - lastTime.getTime();
    return diff >= timeout;
}

function isDeviceDataError(signals) {
    return signals.isDeviceDataError() || signals.isIPCTimeout();
}

function statusCount(signals) {
    var count = 0;
    if (signals.isDeviceDataError()) {
        count++;
    }
    if (signals.isCalendarError()) {
        count++;
    }
    if (signals.isUpdating()) {
        count++;
    }
    return count;
}

export const SmallStatusNote = () => {
    console.log("SmallStatusNote render");
    const signals = new Signals();
    const cbName = callbackName("SmallStatusNote");
    addDataCallback(cbName, (data) => updateSignals(signals, data));
    const ipcCheckInterval = setInterval(() => {
        signals.setIPCTimeoutBuffer(isTimeout(signals.lastUpdateTime(), 20 * second));
    }, 5 * second);
    onCleanup(() => {
        removeDataCallback(cbName);
        clearInterval(ipcCheckInterval);
    });
    const useEcoMode = true;

    return <div id="status-note-content" class={`status-note-small flex-row ${signals.statusNoteTransition()}`}>
            <Show when={signals.isCalendarError()}>
                <div class="status-note-indicator status-note-calendar-error-indicator">
                    <i class='fa-solid fa-calendar-xmark is-error api-error-indicator'></i>
                </div>
            </Show>
            <Show when={isDeviceDataError(signals)}>
                <div class="status-note-indicator status-note-api-error-indicator">
                    <i class='fa-solid fa-heart-crack is-error api-error-indicator'></i>
                </div>
            </Show>
            <Show when={signals.isUpdating()}>
                <div class="status-note-indicator status-note-api-error-indicator">
                    <i class='fa-solid fa-floppy-disk fa-fade api-error-indicator'></i>
                </div>
            </Show>
            <Show when={useEcoMode && signals.isEcoMode() && statusCount(signals) < 2}>
                <div class="status-note-indicator">
                    <i class='fa-solid fa-leaf'></i>
                </div>
            </Show>
    </div>
};