import { onCleanup, createSignal } from "solid-js";
import { callbackName } from "../../util/callback"
import { addServiceDataCallback, removeDataCallback } from "../../ipc";
import { weatherIconStyleClass } from '../../util/weatherIcon';
import { kelvinToCelsiusText } from '../../util/temperature';
import { Loading } from "./loading";
import { textTransitionSignal } from "../../util/textGlitch";
import { labelMaker } from "../../components/label";

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


export const CurrentWeather = () => {
    console.log("CurrentWeather render");
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
            <ul class="tree-view">
                <li>{label("location")}
                    <ul>{signals.location}</ul>
                </li>
                <li>{label("temp")}
                    <ul>{signals.temp}</ul>
                </li>
                <li>{label("feels")}
                    <ul>{signals.feelsLikeTemp}</ul>
                </li>
                <li>{label("current-condition")}
                    <ul><i class={"fa-solid " + weatherIconStyleClass(signals.currentWeatherConditions())}></i></ul>
                </li>
                <li>{label("today-condition")}
                    <ul><i class={"fa-solid " + weatherIconStyleClass(signals.todayWeatherConditions())}></i></ul>
                </li>
            </ul>
        </Show >
    </div >
}