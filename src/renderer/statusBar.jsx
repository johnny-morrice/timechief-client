import { createSignal, onCleanup } from 'solid-js';
import { isCalendarExists } from './calendarHelper';
import { addClockDataCallback } from './ipc';
import { apiErrorTimeout, calendarErrorTimeout, second } from './timing'

class StatusBarSignals {
    constructor() {
      [this.isAPIError, this.setAPIError] = createSignal(false);
      [this.lastUpdateTime, this.setLastUpdateTime] = createSignal(new Date());
      [this.isAccountLinked, this.setAccountLinked] = createSignal(false);
      [this.lastCalendarUpdateTime, this.setLastCalendarUpdateTime] = createSignal(null);
      [this.isCalendarExists, this.setCalendarExists] = createSignal(false);
    }
}


function updateSignals(signals, data) {
    signals.setLastUpdateTime(new Date());
    let calendar = data["Calendar"];
    let calendarLastUpdated = calendar["LastUpdated"];
    var calendarLastDate = null;
    if (calendarLastUpdated != 0) {
        calendarLastDate = new Date(calendarLastUpdated * 1000);
    }
    signals.setCalendarExists(isCalendarExists(data));
    signals.setLastCalendarUpdateTime(calendarLastDate);
    let principal = data["LinkedPrincipal"];
    if ("PrincipalSerial" in principal) {
        signals.setAccountLinked(new Boolean(principal["PrincipalSerial"]));
    } else {
        signals.setAccountLinked(false);
    }
}

function isCalendarErrorTimeout(signals) {
    let lastUpdateTime = signals.lastCalendarUpdateTime();
    if (lastUpdateTime) {
        return isTimeout(lastUpdateTime, calendarErrorTimeout);
    }
    return false;
}

function isCalendarError(signals) {
    return signals.isCalendarExists() && isCalendarErrorTimeout(signals);
}

function isTimeout(lastTime, timeout) {
    const now = new Date();
    const diff = now.getTime() - lastTime.getTime();
    return diff >= timeout;
}

function isAPIErrorTimeout(lastUpdateTime) {
    return isTimeout(lastUpdateTime, apiErrorTimeout);
}

var initialised = false;
export const StatusBar = () => {
    let signals = new StatusBarSignals();
    if (!initialised) {
        addClockDataCallback((data) => updateSignals(signals, data));
        initialised = true;
    }
    let updateRefreshTimeInterval = setInterval(
        () => {
          const lastUpdateTime = signals.lastUpdateTime();
          signals.setAPIError(isAPIErrorTimeout(lastUpdateTime));
        },
        second
      );
    onCleanup(() => {
        clearInterval(updateRefreshTimeInterval);
    });
    return <div class="status-bar-root">
        <div class="status-bar">
        <Show when={isCalendarError(signals)}>
            <div class="status-bar-calendar-error-indicator">
                <i class='fa-solid fa-calendar-xmark is-error api-error-indicator'></i>
            </div>
        </Show>
        <Show when={!isCalendarError(signals)}>
            <div class="status-bar-calendar-error-indicator">
                <i class='fa-solid fa-calendar-check'></i>
            </div>
        </Show>
        <Show when={signals.isAccountLinked()}>
        <div class="status-bar-api-error-indicator">
                <i class='fa-solid fa-user'></i>
            </div>
        </Show>
        <Show when={signals.isAPIError()}>
            <div class="status-bar-api-error-indicator">
                <i class='fa-solid fa-heart-crack is-error api-error-indicator'></i>
            </div>
            <div class="status-bar-message">Error</div>
        </Show>
        <Show when={!signals.isAPIError()}>
            <div class="status-bar-api-error-indicator">
                <i class='fa-solid fa-heart api-error-indicator'></i>
            </div>
        </Show>
        </div>
        <hr class="status-line"/>
    </div>
};