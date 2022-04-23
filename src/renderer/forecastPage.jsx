import { createSignal } from 'solid-js';
import { addClockDataCallback } from './ipc';
import { getTaskBarSignals } from './taskbarSignals';

let dayForecastCount = 5;
class ForecastPageSignals {
  constructor() {
    this.days = [];
    for (var i = 0; i < dayForecastCount; i++) {
        this.days.push(new DayForecastSignals())
    }
  }
}

class DayForecastSignals {
    constructor() {
        [this.date, this.setDate] = createSignal("");
        [this.mornTemp, this.setMornTemp] = createSignal("");
        [this.dayTemp, this.setDayTemp] = createSignal("");
        [this.eveTemp, this.setEveTemp] = createSignal("");
        [this.nightTemp, this.setNightTemp] = createSignal("");
        [this.mornFeelsLike, this.setMornFeelsLike] = createSignal("");
        [this.dayFeelsLike, this.setDayFeelsLike] = createSignal("");
        [this.eveFeelsLike, this.setEveFeelsLike] = createSignal("");
        [this.nightFeelsLike, this.setNightFeelsLike] = createSignal("");
        [this.weatherDescriptions, this.setWeatherDescriptions] = createSignal([]);
    }
}

function updateForecastPageSignals(signals, data) {
    let weather = data["Weather"];
    let daily = data["daily"];
    for (var i = 0; i < daily.length && i < dayForecastCount; i++) {
        let forecast = daily[i];
        let dt = forecast["dt"];
        let dateText = parseUnixDate(dt);
        let daySignals = signals.day[i];
        daySignals.setDate(dateText);
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
        daySignals.setMornTemp(mornTemp);
        daySignals.setDayTemp(dayTemp);
        daySignals.setEveTemp(eveTemp);
        daySignals.setNightTemp(nightTemp);
        daySignals.setMornFeelsLike(mornFeelsLike);
        daySignals.setDayFeelsLike(dayFeelsLike);
        daySignals.setEveFeelsLike(eveFeelsLike);
        daySignals.setNightFeelsLike(nightFeelsLike);
        let descriptions = [];
        let weatherConditions = forecast["weather"];
        for (var i = 0; i < weatherConditions.length; i++) {
            descriptions.push(weatherConditions[i]["description"]);
        }
        daySignals.setWeatherDescriptions(descriptions);
    }
}

function parseUnixDate(seconds) {
    let date = new Date(seconds * 1000);
    let dateOptions = { month: 'long', day: 'numeric' };
    var dateText = date.toLocaleDateString("en-GB", dateOptions);
    return dateText;
}

export const ForecastPage = () => {
  let forecastSignals = new ForecastPageSignals();
  let taskBarSignals = getTaskBarSignals();

  addClockDataCallback((data) => updateForecastPageSignals(forecastSignals, data));

  return <div id="forecast-screen" style={{
        display: `${taskBarSignals.forecastDisplayStyle()}` 
        }}
        >
        <div class="row-flex">
            <div class='flex-element'>
            <Index each={forecastSignals.days}>{(day, i) =>
                <div class='column-flex'>
                    <div class='flex-element'>{day.getDate}</div>
                    <div class='row-flex'>
                        <div class='flex-element'>{day.getMornTemp}</div>
                        <div class='flex-element'>{day.getMornFeelsLike}</div>
                    </div>
                    <div class='row-flex'>
                        <div class='flex-element'>{day.getDayTemp}</div>
                        <div class='flex-element'>{day.getDayFeelsLike}</div>
                    </div>
                    <div class='row-flex'>
                        <div class='flex-element'>{day.getEveTemp}</div>
                        <div class='flex-element'>{day.getEveFeelsLike}</div>
                    </div>
                    <div class='row-flex'>
                        <div class='flex-element'>{day.getNightTemp}</div>
                        <div class='flex-element'>{day.getNightFeelsLike}</div>
                    </div>
                    <Index each={day.getWeatherDescriptions()}>{(desc, i) =>
                        <div class="row-flex">
                        <div class='flex-element'>
                            <div class='current-weather-icon'><i class={"fa-solid " + weatherIconStyleClass(desc())}></i></div>
                        </div>
                        <div class='flex-element'>
                            <div class='current-weather-description'>{desc()}</div>
                        </div>
                    </div>
                    }</Index>
                </div>
            }</Index>
            </div>
        </div>
  </div>;
};