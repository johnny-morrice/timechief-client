import { createSignal } from 'solid-js';
import { isCalendarExists } from './calendarHelper';
import { addDataCallback } from './ipc';
import { apiErrorTimeout } from './timing'

class StatusBarSignals {
    constructor() {
        [this.lastUpdateTime, this.setLastUpdateTime] = createSignal(new Date());
        [this.isAccountLinked, this.setAccountLinked] = createSignal(false);
        [this.isCalendarExists, this.setCalendarExists] = createSignal(false);
        [this.isCalendarError, this.setCalendarError] = createSignal(false);
        [this.isDeviceDataError, this.setDeviceDataError] = createSignal(false);
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
}

function isTimeout(lastTime, timeout) {
    const now = new Date();
    const diff = now.getTime() - lastTime.getTime();
    return diff >= timeout;
}

function isDeviceDataError(signals) {
    return signals.isDeviceDataError() || isTimeout(signals.lastUpdateTime(), apiErrorTimeout);
}

var initialised = false;
export const StatusBar = () => {
    let signals = new StatusBarSignals();
    if (!initialised) {
        addDataCallback((data) => updateSignals(signals, data));
        initialised = true;
    }
    return <div class="status-bar-root">
        <div class="status-bar">
        <Show when={signals.isCalendarError()}>
            <div class="status-bar-calendar-error-indicator">
                <i class='fa-solid fa-calendar-xmark is-error api-error-indicator'></i>
            </div>
        </Show>
        <Show when={signals.isCalendarExists() && !signals.isCalendarError()}>
            <div class="status-bar-calendar-error-indicator">
                <i class='fa-solid fa-calendar-check'></i>
            </div>
        </Show>
        <Show when={signals.isAccountLinked()}>
            <div class="status-bar-api-error-indicator">
                <i class='fa-solid fa-user'></i>
            </div>
        </Show>
        <Show when={isDeviceDataError(signals)}>
            <div class="status-bar-api-error-indicator">
                <i class='fa-solid fa-heart-crack is-error api-error-indicator'></i>
            </div>
            <div class="status-bar-message">Error</div>
        </Show>
        <Show when={!isDeviceDataError(signals)}>
            <div class="status-bar-api-error-indicator">
                <i class='fa-solid fa-heart api-error-indicator'></i>
            </div>
        </Show>
        </div>
        <hr class="status-line"/>
    </div>
};