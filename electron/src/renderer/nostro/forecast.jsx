import { createSignal, onCleanup, Show } from 'solid-js';
import { addServiceDataCallback, removeDataCallback } from './ipc';
import { kelvinToCelsiusText } from '../temperature';
import { weatherIconStyleClass } from '../weatherIcon';
import { callbackName } from './callback';

let dayForecastCount = 5;
class ForecastPageSignals {
    constructor() {
        this.days = [];
        for (var i = 0; i < dayForecastCount; i++) {
            this.days.push(new DayForecastSignals())
        }
        [this.dayCount, this.setDayCount] = createSignal(0);
        [this.dayIndex, this.setDayIndex] = createSignal(0);
    }
}

class DayForecastSignals {
    constructor() {
        [this.date, this.setDate] = createSignal("");
        [this.shortDate, this.setShortDate] = createSignal("");
        [this.mornTemp, this.setMornTemp] = createSignal("");
        [this.dayTemp, this.setDayTemp] = createSignal("");
        [this.eveTemp, this.setEveTemp] = createSignal("");
        [this.nightTemp, this.setNightTemp] = createSignal("");
        [this.mornFeelsLike, this.setMornFeelsLike] = createSignal("");
        [this.dayFeelsLike, this.setDayFeelsLike] = createSignal("");
        [this.eveFeelsLike, this.setEveFeelsLike] = createSignal("");
        [this.nightFeelsLike, this.setNightFeelsLike] = createSignal("");
        [this.weatherConditions, this.setWeatherConditions] = createSignal("");
    }
}

function updateForecastPageSignals(signals, data) {
    var locale = "en-GB";
    if ("Clock" in data) {
        if ("Locale" in data["Clock"] && data["Clock"]["Locale"] !== "") {
            locale = data["Clock"]["Locale"];
        }
    }
    if ("Weather" in data) {
        if ("Daily" in data["Weather"]) {
            let daily = weather["Weather"]["Daily"];
            var dayCount = daily.length;
            if (dayCount > dayForecastCount) {
                dayCount = dayForecastCount;
            }
            signals.setDayCount(dayCount);
            for (var i = 0; i < dayCount; i++) {
                let forecast = daily[i];
                let daySignals = signals.days[i];
                let dt = forecast["Dt"];
                let date = parseUnixDate(dt);
                let dateText = renderLongDateText(locale, date);
                let shortText = renderShortDateText(locale, date);
                daySignals.setShortDate(shortText);
                daySignals.setDate(dateText);
                let temp = forecast["Temp"];
                let mornTemp = temp["Morn"];
                let dayTemp = temp["Day"];
                let eveTemp = temp["Eve"];
                let nightTemp = temp["Night"];
                let feelsLike = forecast["FeelsLike"];
                let mornFeelsLike = feelsLike["Morn"];
                let dayFeelsLike = feelsLike["Day"];
                let eveFeelsLike = feelsLike["Eve"];
                let nightFeelsLike = feelsLike["Night"];
                daySignals.setMornTemp(kelvinToCelsiusText(mornTemp));
                daySignals.setDayTemp(kelvinToCelsiusText(dayTemp));
                daySignals.setEveTemp(kelvinToCelsiusText(eveTemp));
                daySignals.setNightTemp(kelvinToCelsiusText(nightTemp));
                daySignals.setMornFeelsLike(kelvinToCelsiusText(mornFeelsLike));
                daySignals.setDayFeelsLike(kelvinToCelsiusText(dayFeelsLike));
                daySignals.setEveFeelsLike(kelvinToCelsiusText(eveFeelsLike));
                daySignals.setNightFeelsLike(kelvinToCelsiusText(nightFeelsLike));
                let weatherConditions = forecast["WeatherConditions"];
                daySignals.setWeatherConditions(weatherConditions["ConditionCode"]);
            }
        }
    }
}

function parseUnixDate(seconds) {
    let date = new Date(seconds * 1000);
    return date;
}

// renderShortDateText renders a short date text for the given date.  It consists of the day of the week and the day of the month.
function renderShortDateText(locale, date) {
    let dateOptions = { weekday: 'short', day: 'numeric' };
    var dateText = date.toLocaleDateString(locale, dateOptions);
    return dateText;
}

function renderLongDateText(locale, date) {
    let dateOptions = { month: 'long', day: 'numeric' };
    var dateText = date.toLocaleDateString(locale, dateOptions);
    return dateText;
}

export const Forecast = () => {
    let signals = new ForecastPageSignals();
    const cbName = callbackName("Forecast");
    addServiceDataCallback((data) => updateForecastPageSignals(signals, data));
    onCleanup(() => {
        removeDataCallback(cbName);
    });

    function getCurrentDay() {
        const dayIndex = signals.dayIndex();
        return signals.days[dayIndex];
    }

    function hasDay() {
        const dayCount = signals.dayCount();
        return dayCount > 0;
    }

    return <div class="forecast flex-column">
        <Show when={!hasDay()}>
            <div class="forecast-loading-indicator"><i class="fa-solid fa-spinner fa-spin"></i></div>
        </Show>
        <Show when={hasDay()}>
            <div class="forecast-day flex-column flex-grow">
                <div class="forecast-date flex-grow">{getCurrentDay().date}</div>
                <div class='flex-row flex-grow'>
                    <div class="flex-column flex-grow">
                        <div class='data-label flex-grow'>Temp</div>
                        <div class='flex-row flex-grow'>
                            <div class='data-label flex-grow'>Morn</div>
                            <div class='data-value flex-grow'>{getCurrentDay().mornTemp}</div>
                        </div>
                        <div class='flex-row flex-grow'>
                            <div class='data-label flex-grow'>Day</div>

                            <div class='data-value flex-grow'>{getCurrentDay().dayTemp}</div>
                        </div>
                        <div class='flex-row flex-grow'>
                            <div class='data-label flex-grow'>Eve</div>
                            <div class='data-value flex-grow'>{getCurrentDay().eveTemp}</div>
                        </div>
                        <div class='flex-row flex-grow'>
                            <div class='data-label flex-grow'>Night</div>
                            <div class='data-value flex-grow'>{getCurrentDay().nightTemp}</div>
                        </div>
                    </div>
                    <div class="column-flex">
                        <div class='data-label flex-grow'>Feels like</div>
                        <div class='data-value flex-grow'>{getCurrentDay().mornFeelsLike}</div>
                        <div class='data-value flex-grow'>{getCurrentDay().dayFeelsLike}</div>
                        <div class='data-value flex-grow'>{getCurrentDay().eveFeelsLike}</div>
                        <div class='data-value flex-grow'>{getCurrentDay().nightFeelsLike}</div>
                    </div>
                </div>
                <div class='weather-icon'><i class={"fa-solid " + weatherIconStyleClass(day.weatherConditions())}></i></div>
            </div>
        </Show>

    </div>
};