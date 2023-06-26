import { onCleanup } from "solid-js";
import { addServiceDataCallback } from "../classic/ipc";
import { weatherIconStyleClass } from '../weatherIcon';
import { kelvinToCelsiusText } from '../temperature';

class Signals {
    constructor() {
        [this.temp, this.setTemp] = createSignal("");
        [this.feelsLikeTemp, this.setFeelsLikeTemp] = createSignal("");
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


export const CurrentWeather = () => {
    const signals = new Signals();
    addServiceDataCallback("CurrentWeather", (data) => {
        updateSignals(signals, data);
    });

    onCleanup(() => {
        removeDataCallback("CurrentWeather");
    });

    return <div class="current-weather">
        <div class="weather-temp-wrapper flex-row">
            <div class="weather-temp-label-wrapper flex-column">
                <div class="weather-temp-label weather-label data-label">temp</div>
                <div class="weather-temp-feels-label weather-label data-label">feels</div>
            </div>
            <div class="weather-temp-data-wrapper flex-column">
                <div class='weather-temp weather-data'>{props.signals.temp}</div>
                <div class='weather-temp-feels weather-data'>{signals.feelsLikeTemp}</div>
            </div>
        </div>
        <div class="weather-condition-bar flex-row">
            <div class="weather-condition-current-wrapper flex-column">
                <div class='weather-condition-current-icon weather-icon'><i class={"fa-solid " + weatherIconStyleClass(signals.currentWeatherConditions())}></i></div>
                <div class="weather-condition-current-label weather-label data-label">current</div>
            </div>
            <div class="weather-condition-today-wrapper flex-column">
                <div class='weather-condition-today-icon weather-icon'><i class={"fa-solid " + weatherIconStyleClass(signals.todayWeatherConditions())}></i></div>
                <div class="weather-condition-today-label weather-label data-label">today</div>
            </div>
        </div>
    </div>
}