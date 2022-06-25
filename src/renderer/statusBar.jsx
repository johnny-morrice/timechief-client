import { createSignal, onCleanup } from 'solid-js';
import { addClockDataCallback } from './ipc';
import { apiErrorTimeout, second } from './timing'

class StatusBarSignals {
    constructor() {
      [this.isAPIError, this.setAPIError] = createSignal(false);
      [this.lastUpdateTime, this.setLastUpdateTime] = createSignal(new Date());
      [this.isAccountLinked, this.setAccountLinked] = createSignal(false);
    }
}


function updateSignals(signals, data) {
    signals.setLastUpdateTime(new Date());
    let principal = data["LinkedPrincipal"];
    if ("PrincipalSerial" in principal) {
        signals.setAccountLinked(new Boolean(principal["PrincipalSerial"]));
    } else {
        signals.setAccountLinked(false);
    }
  }
  

function isErrorTimeout(lastUpdateTime) {
    const now = new Date();
    const diff = now.getTime() - lastUpdateTime.getTime();
    return diff >= apiErrorTimeout;
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
          signals.setAPIError(isErrorTimeout(lastUpdateTime));
        },
        second
      );
    onCleanup(() => {
        clearInterval(updateRefreshTimeInterval);
    });
    return <div class="status-bar-root">
        <div class="status-bar">
        <Show when={signals.isAccountLinked()}>
        <div class="status-bar-api-error-indicator">
                <i class='fa-solid fa-user'></i>
            </div>
        </Show>
        <Show when={signals.isAPIError()}>
            <div class="status-bar-api-error-indicator">
                <i class='fa-solid fa-heart-crack api-error-indicator'></i>
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