import { createSignal, Show } from 'solid-js';
import { addClockDataCallback } from './ipc';
import { getTaskBarSignals } from './taskbarSignals';
import { kelvinToCelsiusText } from './temperature';
import { weatherIconStyleClass } from './weatherIcon';

let dayForecastCount = 3;
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
        [this.weatherConditions, this.setWeatherConditions] = createSignal([]);
    }
}

function updateForecastPageSignals(signals, data) {
    let weather = data["Weather"];
    let daily = weather["Daily"];
    for (var i = 0; i < daily.length && i < dayForecastCount; i++) {
        let forecast = daily[i];
        let daySignals = signals.days[i];
        let dt = forecast["Dt"];
        let dateText = parseUnixDate(dt);
        
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

  function weatherColumnClass(i) {
      if (i % 2 == 0) {
        return 'column-flex phat'
      }
      return 'column-flex phat table-color-flip';
  }

  return <div id="forecast-screen" style={{
        display: `${taskBarSignals.forecastDisplayStyle()}` 
        }}
        >
            <div class="row-flex">
                <For each={forecastSignals.days}>{(day, i) => 
                    <div class={weatherColumnClass(i())}>
                        <div class="flex-element section-name">{day.date}</div>
                        <div class='row-flex flex-element'>
                            <div class="column-flex flex-element">
                                <div class='data-name flex-element'>Temp</div>
                                <div class='row-flex'>
                                    <Show when={i() == 0}>
                                        <div class='flex-element data-name'>Morn</div>
                                    </Show>
                                    <div class='flex-element'>{day.mornTemp}</div>
                                </div>
                                <div class='row-flex'>
                                    <Show when={i() == 0}>
                                        <div class='flex-element data-name'>Day</div>
                                    </Show>
                                    
                                    <div class='flex-element'>{day.dayTemp}</div>
                                </div>
                                <div class='row-flex'>
                                    <Show when={i() == 0}>
                                        <div class='flex-element data-name'>Eve</div>
                                    </Show>
                                    <div class='flex-element'>{day.eveTemp}</div>
                                </div>
                                <div class='row-flex'>
                                    <Show when={i() == 0}>
                                        <div class='flex-element data-name'>Night</div>
                                    </Show>
                                    <div class='flex-element'>{day.nightTemp}</div>
                                </div>
                            </div>
                            <div class="column-flex">
                                <div class='data-name flex-element'>Feels like</div>
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
                        <div class="row-flex weather-icon-bar">
                            <div class='flex-element weather-icon'><i class={"fa-solid " + weatherIconStyleClass(day.weatherConditions())}></i></div>
                        </div>  
                    </div>
                }</For>
            </div>
        </div>
};