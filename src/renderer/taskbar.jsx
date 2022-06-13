import { onCleanup } from 'solid-js';
import { showHome, showAstro, showDevice, showForecast, showAccount } from './routes';


export const TaskBar = () => {
  let signals = getTaskBarSignals();

  onCleanup(() => {
    clearInterval(timeInterval);
  });

  return <div id="taskbar">
        <div class="row-flex">
            <div class='flex-element'>
                <button class='nav-button' onClick={showHow}><i class="fa-solid fa-home"></i></button>
            </div>
            <div class='flex-element'>
                <button class='nav-button' onClick={showForecast}><i class="fa-solid fa-cloud-sun"></i></button>
            </div>
            <div class='flex-element'>
                <button class='nav-button' onClick={showAstro}><i class="fa-solid fa-moon"></i></button>
            </div>
            <div class='flex-element'>
                <button class='nav-button' onClick={showDevice}><i class="fa-solid fa-gear"></i></button>
            </div>
            <div class='flex-element'>
                <button class='nav-button' onClick={showAccount}><i class="fa-solid fa-user"></i></button>
            </div>
        </div>
    </div>;
};