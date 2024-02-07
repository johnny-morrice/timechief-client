import { onCleanup, createSignal } from "solid-js";
import { callbackName } from "./callback"
import { addServiceDataCallback, removeDataCallback } from "./ipc";
import { textTransitionSignal } from "./textGlitch";
import { labelMaker } from "./label";

class Signals {
    constructor() {
        [this.sshUser, this.setSSHUser] = textTransitionSignal("********");
        [this.sshPassword, this.setSSHPassword] = textTransitionSignal("********");
        [this.sshEnabled, this.setSSHEnabled] = createSignal(false);
    }
}

function updateSignalsOnData(signals, data) {

}

function updateSignalsOnSSHPasswordRegen(signals, data) {
}

export const SSHSecurity = () => {
    const signals = new Signals();
    const cbName = callbackName("SSHSecurity");
    addServiceDataCallback(cbName, (data) => {
        updateSignalsOnData(signals, data);
    });

    onCleanup(() => {
        removeDataCallback(cbName);
    });

    const label = labelMaker("current-weather");

    return <div class="current-weather flex-grow">
        <Show when={!hasWeather(signals)}>
            <Loading />
        </Show>
        <Show when={hasWeather(signals)}>
            <div class="current-weather-location">{signals.location}</div>
            <div class="current-weather-grid flex-grow">
                <div class="weather-temp-label weather-label data-label">{label("temp")}</div>
                <div class='weather-temp weather-data'>{signals.temp}</div>
                <div class="weather-temp-feels-label weather-label data-label">{label("feels")}</div>
                <div class='weather-temp-feels weather-data'>{signals.feelsLikeTemp}</div>
                <div class='weather-condition-current-icon current-weather-icon'><i class={"fa-solid " + weatherIconStyleClass(signals.currentWeatherConditions())}></i></div>
                <div class='weather-condition-today-icon current-weather-icon'><i class={"fa-solid " + weatherIconStyleClass(signals.todayWeatherConditions())}></i></div>
                <div class="weather-condition-current-label weather-label weather-icon-label">{label("current-condition")}</div>
                <div class="weather-condition-today-label weather-label weather-icon-label">{label("today-condition")}</div>
            </div>
        </Show >
    </div >
}