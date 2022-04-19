import { render } from "solid-js/web";
import { createSignal, onCleanup } from 'solid-js';

function getTimeText() {
  return new Date().toLocaleTimeString();
}

function getDateText() {
  let dateOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
  var dateText = new Date().toLocaleDateString("en-GB", dateOptions);
  return dateText.replace(',', '');
}


function absoluteTempToCelsiusText(absTemp) {
    let celsius = absTemp - 273.15;
    let celsiusText = celsius.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1})
    return `${celsiusText}°c`
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

const App = () => {
  const [myTime, setMyTime] = createSignal(getTimeText());
  const [myDate, setMyDate] = createSignal(getDateText());
  const [temp, setTemp] = createSignal("");
  const [feelsLikeTemp, setFeelsLikeTemp] = createSignal("");
  const [weatherDescription, setWeatherDescription] = createSignal("");

  let updateWeatherContent = () => {
    window.api.send("getClockData");
  }
  let timeInterval = setInterval(
    () => {
      setMyTime(getTimeText());
      setMyDate(getDateText());
    },
    100
  );
  let weatherInterval = setInterval(
    updateWeatherContent,
    1000 * 60 * 10,
  )
  updateWeatherContent();

  window.api.receive("clockDataResult", (data) => {
    // let debugElement = document.getElementById('debug');
    // debugElement.innerText = JSON.stringify(data);
    let currentWeather = data["Weather"]["Current"];
    let temp = currentWeather["Temperature"];
    let feelsLike = currentWeather["FeelsLikeTemperature"];
    let description = currentWeather["Description"];
    let feelsLikeText = absoluteTempToCelsiusText(feelsLike);
    let tempText = absoluteTempToCelsiusText(temp);
    setWeatherDescription(capitalizeFirstLetter(description));
    setFeelsLikeTemp(`feels like ${feelsLikeText}`);
    setTemp(tempText);
  });

  onCleanup(() => {
    clearInterval(timeInterval);
    clearInterval(weatherInterval);
  });
  return <div id="home-screen">
    <div class="column-flex">

      <div class='flex-element'>
        <div id='time'>{myTime}</div>
      </div>
      <div class='flex-element'>
        <div id='date'>{myDate}</div>
      </div>
      
      <div class='row-flex'>
        <div class='flex-element'>
          <div id='temperature'>{temp}</div>
        </div>
        <div class='flex-element'>
          <div id='feels-like-temperature'>{feelsLikeTemp}</div>
        </div>
      </div>
      <div class='flex-element'>
        <div id='weather-description'>{weatherDescription}</div>
      </div>
    </div>
  </div>;
};

render(() => <App />, document.getElementById('app'))
