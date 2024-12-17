import { onCleanup, createSignal } from "solid-js";
import { callbackName } from "./callback"
import { addServiceDataCallback, removeDataCallback } from "./ipc";
import { weatherIconStyleClass } from '../weatherIcon';
import { kelvinToCelsiusText } from '../temperature';
import { Loading } from "./loading";
import { textTransitionSignal } from "./textGlitch";

class Signals {
    constructor() {
        [this.location, this.setLocation] = textTransitionSignal("");
        [this.temp, this.setTemp] = textTransitionSignal("");
        [this.feelsLikeTemp, this.setFeelsLikeTemp] = textTransitionSignal("");
        [this.tempK, this.setTempK] = createSignal(0);
        [this.feelsLikeTempK, this.setFeelsLikeTempK] = createSignal(0);
        [this.currentWeatherConditions, this.setCurrentWeatherConditions] = createSignal("");
        [this.todayWeatherConditions, this.setTodayWeatherConditions] = createSignal("");
    }
}

function updateSignals(signals, data) {
    let deviceProfileWrapper = data["device_profile"];
    let deviceProfile = deviceProfileWrapper["value"];
    if (!deviceProfileWrapper) {
        return;
    }
    let device = deviceProfile["device"];
    if (!device) {
        return;
    }
    let location = device["location"];
    signals.setLocation(location);
    let owm = data["owm"];
    if (!owm) {
        return;
    }
    let weather = owm["value"];
    if (weather) {
        let currentWeather = weather["current"];
        let temp = currentWeather["temp"];
        let feelsLike = currentWeather["feels_like"];
        let weatherConditions = currentWeather["weather_conditions"];
        signals.setTempK(temp);
        signals.setFeelsLikeTempK(feelsLike);
        let feelsLikeText = kelvinToCelsiusText(feelsLike);
        let tempText = kelvinToCelsiusText(temp);
        signals.setCurrentWeatherConditions(weatherConditions["condition_code"]);
        signals.setFeelsLikeTemp(feelsLikeText);
        signals.setTemp(tempText);
        let daily = weather["daily"];
        if (daily && daily.length > 0) {
            let today = daily[0];
            let todayConditions = today["weather_conditions"];
            signals.setTodayWeatherConditions(todayConditions["condition_code"]);
        }
    }
}

function hasWeather(signals) {
    return signals.tempK() > 0 && signals.feelsLikeTempK() > 0 && signals.currentWeatherConditions().length > 0 && signals.todayWeatherConditions().length > 0;
}


export const SmallCurrentWeather = () => {
    console.log("SmallCurrentWeather render");
    const signals = new Signals();
    const cbName = callbackName("SmallCurrentWeather");
    addServiceDataCallback(cbName, (data) => {
        updateSignals(signals, data);
    });

    onCleanup(() => {
        removeDataCallback(cbName);
    });

    return <div class="current-weather">
        <Show when={!hasWeather(signals)}>
            <Loading />
        </Show>
        <Show when={hasWeather(signals)}>
            <div class="flex-column">
                <div class='weather-temp weather-data'>{signals.temp}</div>
                <div class='weather-condition-current-icon current-weather-icon'><i class={"fa-solid " + weatherIconStyleClass(signals.currentWeatherConditions())}></i></div>
            </div>
        </Show >
    </div >
}