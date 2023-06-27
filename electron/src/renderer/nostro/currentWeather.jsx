import { onCleanup, createSignal } from "solid-js";
import { callbackName } from "./callback"
import { addServiceDataCallback, removeDataCallback } from "./ipc";
import { weatherIconStyleClass } from '../weatherIcon';
import { kelvinToCelsiusText } from '../temperature';
import { Loading } from "./loading";
import { textTransitionSignal } from "./textTransition";

class Signals {
    constructor() {
        [this.temp, this.setTemp] = textTransitionSignal("");
        [this.feelsLikeTemp, this.setFeelsLikeTemp] = textTransitionSignal("");
        [this.tempK, this.setTempK] = createSignal(0);
        [this.feelsLikeTempK, this.setFeelsLikeTempK] = createSignal(0);
        [this.currentWeatherConditions, this.setCurrentWeatherConditions] = textTransitionSignal("");
        [this.todayWeatherConditions, this.setTodayWeatherConditions] = textTransitionSignal("");
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
    const cbName = callbackName("CurrentWeather");
    addServiceDataCallback(cbName, (data) => {
        updateSignals(signals, data);
    });

    onCleanup(() => {
        removeDataCallback(cbName);
    });

    return <div class="current-weather flex-column flex-grow">
        <Show when={!hasWeather(signals)}>
            <Loading />
        </Show>
        <Show when={hasWeather(signals)}>
            <div class="current-weather-grid flex-grow">
                <div class="weather-temp-label weather-label data-label">temp</div>
                <div class='weather-temp weather-data'>{signals.temp}</div>
                <div class="weather-temp-feels-label weather-label data-label">feels</div>
                <div class='weather-temp-feels weather-data'>{signals.feelsLikeTemp}</div>
                <div class='weather-condition-current-icon current-weather-icon'><i class={"fa-solid " + weatherIconStyleClass(signals.currentWeatherConditions())}></i></div>
                <div class='weather-condition-today-icon current-weather-icon'><i class={"fa-solid " + weatherIconStyleClass(signals.todayWeatherConditions())}></i></div>
                <div class="weather-condition-current-label weather-label weather-icon-label">current</div>
                <div class="weather-condition-today-label weather-label weather-icon-label">today</div>
            </div>
        </Show >
    </div >
}