import { onCleanup, createSignal } from "solid-js";
import { addServiceDataCallback, removeDataCallback } from "./ipc";
import { weatherIconStyleClass } from '../weatherIcon';
import { kelvinToCelsiusText } from '../temperature';

class Signals {
    constructor() {
        [this.temp, this.setTemp] = createSignal("");
        [this.feelsLikeTemp, this.setFeelsLikeTemp] = createSignal("");
        [this.tempK, this.setTempK] = createSignal(0);
        [this.feelsLikeTempK, this.setFeelsLikeTempK] = createSignal(0);
        [this.currentWeatherConditions, this.setCurrentWeatherConditions] = createSignal("");
        [this.todayWeatherConditions, this.setTodayWeatherConditions] = createSignal("");
    }
}

function updateSignals(signals, data) {
    let weather = data["Weather"];
    if (weather) {
        let currentWeather = weather["Current"];
        let temp = currentWeather["Temp"];
        let feelsLike = currentWeather["FeelsLike"];
        let weatherConditions = currentWeather["WeatherConditions"];
        signals.setTempK(temp);
        signals.setFeelsLikeTempK(feelsLike);
        let feelsLikeText = kelvinToCelsiusText(feelsLike);
        let tempText = kelvinToCelsiusText(temp);
        signals.setCurrentWeatherConditions(weatherConditions["ConditionCode"]);
        signals.setFeelsLikeTemp(feelsLikeText);
        signals.setTemp(tempText);
        let daily = weather["Daily"];
        if (daily && daily.length > 0) {
            let today = daily[0];
            let todayConditions = today["WeatherConditions"];
            signals.setTodayWeatherConditions(todayConditions["ConditionCode"]);
        }
    }
}

function hasWeather(signals) {
    return signals.tempK() > 0 && signals.feelsLikeTempK() > 0 && signals.temp().length > 0 && signals.feelsLikeTemp().length > 0 && signals.currentWeatherConditions().length > 0 && signals.todayWeatherConditions().length > 0;
}


export const CurrentWeather = () => {
    const signals = new Signals();
    addServiceDataCallback("CurrentWeather", (data) => {
        updateSignals(signals, data);
    });

    onCleanup(() => {
        removeDataCallback("CurrentWeather");
    });

    return <div class="current-weather flex-column flex-grow">
        <Show when={hasWeather(signals)}>
            <div class="weather-temp-wrapper flex-row flex-grow">
                <div class="weather-temp-label-wrapper flex-column flex-grow">
                    <div class="weather-temp-label weather-label data-label">temp</div>
                    <div class="weather-temp-feels-label weather-label data-label">feels</div>
                </div>
                <div class="weather-temp-data-wrapper flex-column flex-grow">
                    <div class='weather-temp weather-data'>{signals.temp}</div>
                    <div class='weather-temp-feels weather-data'>{signals.feelsLikeTemp}</div>
                </div>
            </div>
            <div class="weather-condition-bar flex-row flex-grow">
                <div class="weather-condition-current-wrapper flex-column flex-grow">
                    <div class='weather-condition-current-icon weather-icon'><i class={"fa-solid " + weatherIconStyleClass(signals.currentWeatherConditions())}></i></div>
                    <div class="weather-condition-current-label weather-label data-label">current</div>
                </div>
                <div class="weather-condition-today-wrapper flex-column flex-grow">
                    <div class='weather-condition-today-icon weather-icon'><i class={"fa-solid " + weatherIconStyleClass(signals.todayWeatherConditions())}></i></div>
                    <div class="weather-condition-today-label weather-label data-label">today</div>
                </div>
            </div>
        </Show>
        <Show when={!hasWeather(signals)}>
            <div class="weather-temp-loading-indicator"><i class="fa-solid fa-spinner fa-spin"></i></div>
        </Show>
    </div>
}