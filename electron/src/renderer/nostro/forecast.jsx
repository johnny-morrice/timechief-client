import { createSignal, onCleanup, Show } from 'solid-js';
import { addServiceDataCallback, removeDataCallback } from './ipc';
import { kelvinToCelsiusText } from '../temperature';
import { weatherIconStyleClass } from '../weatherIcon';
import { callbackName } from './callback';
import { Loading } from './loading';
import { textTransitionSignal } from "./textGlitch";
import { labelMaker } from './label';
import { fadeTransition } from './fadeTransition';

let dayForecastCount = 5;
class Signals {
    constructor() {
        this.days = [];
        for (var i = 0; i < dayForecastCount; i++) {
            this.days.push(new DaySignals())
        }
        [this.dayCount, this.setDayCount] = createSignal(0);
        [this.dayIndex, this.setDayIndex] = createSignal(0);
    }
}

class DaySignals {
    constructor() {
        [this.date, this.setDate] = createSignal("");
        [this.dayOfWeek, this.setDayOfWeek] = createSignal("");
        [this.shortDate, this.setShortDate] = createSignal("");
        [this.mornTemp, this.setMornTemp] = textTransitionSignal("");
        [this.dayTemp, this.setDayTemp] = textTransitionSignal("");
        [this.eveTemp, this.setEveTemp] = textTransitionSignal("");
        [this.nightTemp, this.setNightTemp] = textTransitionSignal("");
        [this.mornFeelsLike, this.setMornFeelsLike] = textTransitionSignal("");
        [this.dayFeelsLike, this.setDayFeelsLike] = textTransitionSignal("");
        [this.eveFeelsLike, this.setEveFeelsLike] = textTransitionSignal("");
        [this.nightFeelsLike, this.setNightFeelsLike] = textTransitionSignal("");
        [this.weatherConditions, this.setWeatherConditions] = createSignal("");
    }
}

function updateSignals(signals, data) {
    var locale = "en-GB";
    if ("device_profile" in data) {
        const deviceProfile = data["device_profile"];
        if ("locale" in deviceProfile && deviceProfile["locale"] !== "") {
            locale = deviceProfile["locale"];
        }
    }
    if ("weather" in data) {
        if ("haily" in data["weather"]) {
            let daily = data["weather"]["daily"];
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
                let dayOfWeek = date.toLocaleDateString(locale, { weekday: 'short' });
                daySignals.setDayOfWeek(dayOfWeek);
                let temp = forecast["temp"];
                let mornTemp = temp["morn"];
                let dayTemp = temp["day"];
                let eveTemp = temp["eve"];
                let nightTemp = temp["night"];
                let feelsLike = forecast["feels_like"];
                let mornFeelsLike = feelsLike["morn"];
                let dayFeelsLike = feelsLike["day"];
                let eveFeelsLike = feelsLike["eve"];
                let nightFeelsLike = feelsLike["night"];
                daySignals.setMornTemp(kelvinToCelsiusText(mornTemp));
                daySignals.setDayTemp(kelvinToCelsiusText(dayTemp));
                daySignals.setEveTemp(kelvinToCelsiusText(eveTemp));
                daySignals.setNightTemp(kelvinToCelsiusText(nightTemp));
                daySignals.setMornFeelsLike(kelvinToCelsiusText(mornFeelsLike));
                daySignals.setDayFeelsLike(kelvinToCelsiusText(dayFeelsLike));
                daySignals.setEveFeelsLike(kelvinToCelsiusText(eveFeelsLike));
                daySignals.setNightFeelsLike(kelvinToCelsiusText(nightFeelsLike));
                let weatherConditions = forecast["weather_conditions"];
                daySignals.setWeatherConditions(weatherConditions["condition_code"]);
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
    let signals = new Signals();
    const cbName = callbackName("Forecast");
    addServiceDataCallback(cbName, (data) => updateSignals(signals, data));
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

    function hasDayLoaded() {
        const dayIndex = signals.dayIndex();
        return signals.days[dayIndex].shortDate() !== "";
    }

    function hasPrevDay() {
        const dayIndex = signals.dayIndex();
        return dayIndex > 0;
    }

    function hasNextDay() {
        const dayIndex = signals.dayIndex();
        const dayCount = signals.dayCount();
        return dayIndex < dayCount - 1;
    }

    function onClickPrev() {
        if (hasPrevDay()) {
            fadeTransition("forecast-widget", () => {
                const dayIndex = signals.dayIndex();
                signals.setDayIndex(dayIndex - 1);
            });
        }
    }

    function onClickNext() {
        if (hasNextDay()) {
            fadeTransition("forecast-widget", () => {
                const dayIndex = signals.dayIndex();
                signals.setDayIndex(dayIndex + 1);
            });
        }
    }

    function getPrevDay() {
        if (hasPrevDay()) {
            const dayIndex = signals.dayIndex();
            return signals.days[dayIndex - 1];
        }
        return {
            'shortDate': '',
        };
    }

    function getNextDay() {
        if (hasNextDay()) {
            const dayIndex = signals.dayIndex();
            return signals.days[dayIndex + 1];
        }
        return {
            'shortDate': '',
        };
    }

    const label = labelMaker("forecast");

    return <div id="forecast-widget" class="forecast flex-column">
        <Show when={!hasDay() || !hasDayLoaded()}>
            <Loading />
        </Show>
        <Show when={hasDay() && hasDayLoaded}>
            <div class="forecast-day flex-column flex-grow">
                <div class="forecast-day-controls">
                    <Show when={hasPrevDay()}>
                        <div class="forecast-day-prev-button-wrapper">
                            <button class="forecast-control-button forecast-day-prev-button" onClick={onClickPrev}><i class="fa-solid fa-chevron-left"></i> {getPrevDay().dayOfWeek}</button>
                        </div>
                    </Show>
                    <Show when={!hasPrevDay()}>
                        <div class="forecast-day-prev-button-wrapper forecast-day-prev-button-disabled">
                        </div>
                    </Show>
                    <div class="forecast-control-label forecast-date">{getCurrentDay().shortDate}</div>
                    <Show when={hasNextDay()}>
                        <div class="forecast-day-next-button-wrapper">
                            <button class="forecast-control-button forecast-day-next-button" onClick={onClickNext}>{getNextDay().dayOfWeek} <i class="fa-solid fa-chevron-right"></i></button>
                        </div>
                    </Show>
                </div>
                <table class="forecast-weather-table flex-grow">
                    <tbody>
                        <tr>
                            <th></th>
                            <th>{label("temp")}</th>
                            <th>{label("feels")}</th>
                        </tr>
                        <tr>
                            <th>{label("morning")}</th>
                            <td>{getCurrentDay().mornTemp}</td>
                            <td>{getCurrentDay().mornFeelsLike}</td>
                        </tr>
                        <tr>
                            <th>{label("day")}</th>
                            <td>{getCurrentDay().dayTemp}</td>
                            <td>{getCurrentDay().dayFeelsLike}</td>
                        </tr>
                        <tr>
                            <th>{label("evening")}</th>
                            <td>{getCurrentDay().eveTemp}</td>
                            <td>{getCurrentDay().eveFeelsLike}</td>
                        </tr>
                        <tr>
                            <th>{label("night")}</th>
                            <td>{getCurrentDay().nightTemp}</td>
                            <td>{getCurrentDay().nightFeelsLike}</td>
                        </tr>
                        <tr>
                            <td class="weather-icon"><i class={"fa-solid " + weatherIconStyleClass(getCurrentDay().weatherConditions())}></i></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Show>
    </div>
};