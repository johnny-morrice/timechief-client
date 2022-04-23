import { render } from "solid-js/web";
import { onCleanup } from 'solid-js';
import { initializeIPC, sendClockDataRequest } from './ipc';
import { HomePage } from "./homePage";
import { ConfigPage } from "./configPage";
import { TaskBar } from "./taskbar";
import { ForecastPage } from "./forecastPage";

const App = () => {
  let ipcInterval = initializeIPC();
  sendClockDataRequest();
  onCleanup(() => {
    clearInterval(ipcInterval);
  });

  return <div id="app-root">
      <HomePage/>
      <ForecastPage/>
      <ConfigPage/>
      <TaskBar/>
    </div>
};


render(() => <App />, document.getElementById('app'));
