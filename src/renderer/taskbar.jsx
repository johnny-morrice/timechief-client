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
                <button onClick={onClickHome}><i class="fa-solid fa-home"></i></button>
            </div>
            <div class='flex-element'>
                <button onClick={onClickForecast}><i class="fa-solid fa-cloud-sun"></i></button>
            </div>
            <div class='flex-element'>
                <button onClick={onClickAstro}><i class="fa-solid fa-moon"></i></button>
            </div>
            <div class='flex-element'>
                <button onClick={onClickConfig}><i class="fa-solid fa-gear"></i></button>
            </div>
        </div>
    </div>;
};