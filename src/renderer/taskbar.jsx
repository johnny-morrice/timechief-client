import { onCleanup } from 'solid-js';
import { showHome, showAstro, showDevice, showForecast, showAccount, showLocale } from './routes';


export const TaskBar = () => {
  onCleanup(() => {
    clearInterval(timeInterval);
  });

  return <div id="taskbar">
        <div class="row-flex">
            <div class='flex-element'>
                <button class='nav-button' onClick={showHome}><i class="fa-solid fa-home"></i></button>
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
            <div class='flex-element'>
                <button class='nav-button' onClick={showLocale}><i class="fa-solid fa-globe"></i></button>
            </div>
        </div>
    </div>;
};