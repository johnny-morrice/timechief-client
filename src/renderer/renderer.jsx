import { render } from "solid-js/web";
import { onCleanup } from 'solid-js';
import { initializeIPC, sendClockDataRequest } from './ipc';
import { HomePage } from "./homePage";
import { ConfigPage } from "./configPage";

const App = () => {
  let ipcInterval = initializeIPC();
  sendClockDataRequest();
  onCleanup(() => {
    clearInterval(ipcInterval);
  });

  return <div id="app-root">
      <HomePage/>
      <ConfigPage/>
    </div>
};


render(() => <App />, document.getElementById('app'));
