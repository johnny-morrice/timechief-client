import { onCleanup, createSignal } from "solid-js";
import { callbackName } from "./callback"
import { addServiceDataCallback, removeDataCallback } from "./ipc";
import { weatherIconStyleClass } from '../weatherIcon';
import { kelvinToCelsiusText } from '../temperature';
import { Loading } from "./loading";
import { textTransitionSignal } from "./textGlitch";
import { labelMaker } from "./label";

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
    let deviceProfileWrapper =   data["device_profile"];
    let deviceProfile = deviceProfileWrapper["value"];
    if (!deviceProfileWrapper) {
        return;
    }
    let location = deviceProfile["location"];
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


export const CurrentWeather = () => {
    const signals = new Signals();
    const cbName = callbackName("CurrentWeather");
    addServiceDataCallback(cbName, (data) => {
        updateSignals(signals, data);
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