import { createSignal } from 'solid-js';
import { addClockDataCallback } from './ipc';
import { getTaskBarSignals } from './taskbarSignals';
import { kelvinToCelsiusText } from './temperature';
import { weatherIconStyleClass } from './weatherIcon';

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
    let daily = weather["daily"];
    for (var i = 0; i < daily.length && i < dayForecastCount; i++) {
        let forecast = daily[i];
        let daySignals = signals.days[i];
        let dt = forecast["dt"];
        let dateText = parseUnixDate(dt);
        
        console.log(`dateText: ${dateText}`);
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
        console.log("here 4")
        daySignals.setMornTemp(kelvinToCelsiusText(mornTemp));
        daySignals.setDayTemp(kelvinToCelsiusText(dayTemp));
        daySignals.setEveTemp(kelvinToCelsiusText(eveTemp));
        daySignals.setNightTemp(kelvinToCelsiusText(nightTemp));
        daySignals.setMornFeelsLike(kelvinToCelsiusText(mornFeelsLike));
        daySignals.setDayFeelsLike(kelvinToCelsiusText(dayFeelsLike));
        daySignals.setEveFeelsLike(kelvinToCelsiusText(eveFeelsLike));
        daySignals.setNightFeelsLike(kelvinToCelsiusText(nightFeelsLike));
        let descriptions = [];
        let weatherConditions = forecast["weather"];
        for (var j = 0; j < weatherConditions.length; j++) {
            descriptions.push(weatherConditions[j]["description"]);
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
                <For each={forecastSignals.days}>{(day, i) =>
                    <div class='column-flex'>
                        <div class='flex-element'>
                            <div class="forecast-date">{day.date}</div>
                        </div>
                        <div class='row-flex'>
                            <div class="column-flex">
                                <div class='flex-element'>Temperature</div>
                                <div class='row-flex'>
                                    <div class='flex-element'>Morn</div>
                                    <div class='flex-element'>{day.mornTemp}</div>
                                </div>
                                <div class='row-flex'>
                                    <div class='flex-element'>Day</div>
                                    <div class='flex-element'>{day.dayTemp}</div>
                                </div>
                                <div class='row-flex'>
                                    <div class='flex-element'>Eve</div>
                                    <div class='flex-element'>{day.eveTemp}</div>
                                </div>
                                <div class='row-flex'>
                                    <div class='flex-element'>Night</div>
                                    <div class='flex-element'>{day.nightTemp}</div>
                                </div>
                            </div>
                            <div class="column-flex">
                                <div class='flex-element'>Feels like</div>
                                <div class='row-flex'>
                                    {/* <div class='flex-element'>Morning</div> */}
                                    <div class='flex-element'>{day.mornFeelsLike}</div>
                                </div>
                                <div class='row-flex'>
                                    {/* <div class='flex-element'>Day</div> */}
                                    <div class='flex-element'>{day.dayFeelsLike}</div>
                                </div>
                                <div class='row-flex'>
                                    {/* <div class='flex-element'>Eve</div> */}
                                    <div class='flex-element'>{day.eveFeelsLike}</div>
                                </div>
                                <div class='row-flex'>
                                    {/* <div class='flex-element'>Night</div> */}
                                    <div class='flex-element'>{day.nightFeelsLike}</div>
                                </div>
                            </div>
                        </div>
                        <Index each={day.weatherDescriptions()}>{(desc, i) =>
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
                }</For>
            </div>
        </div>
};