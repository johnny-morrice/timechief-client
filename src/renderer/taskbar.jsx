import { onCleanup } from 'solid-js';
import { getTaskBarSignals } from './taskbarSignals';


export const TaskBar = () => {
  let signals = getTaskBarSignals();

  onCleanup(() => {
    clearInterval(timeInterval);
  });

  function onClickHome() {
      signals.showScreen("home");
  }

  function onClickConfig() {
      signals.showScreen("config");
  }

  function onClickForecast() {
      signals.showScreen("forecast");
  }

  function onClickAstro() {
      signals.showScreen("astro");
  }

  onClickHome();

  return <div id="taskbar">
        <div class="row-flex">
            <div class='flex-element'>
                <button onClick={onClickHome}>Home</button>
            </div>
            <div class='flex-element'>
                <button onClick={onClickForecast}>Forecast</button>
            </div>
            <div class='flex-element'>
                <button onClick={onClickAstro}>Astro</button>
            </div>
            <div class='flex-element'>
                <button onClick={onClickConfig}>Config</button>
            </div>
        </div>
    </div>;
};