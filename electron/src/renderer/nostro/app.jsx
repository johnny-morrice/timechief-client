import { render } from 'solid-js/web';
import { onCleanup } from 'solid-js';
import { hashIntegration, Router, Routes, Route } from "@solidjs/router";
import { initializeIPC } from './ipc';
import { WebSetupPage } from "./webSetup";
import { HomePage } from "./homePage";
import { LoginPage } from './login';
import { IntroVideo } from './introVideo';
import { MediaVideo } from './mediavideo';


const AppScreen = (props) => {
  console.log("AppScreen render");
  return <IntroVideo element={<WebSetupPage element={<LoginPage element={<MediaVideo element={props.element} />} />}/>} />;
};

const App = () => {
  console.log("App render");
  let ipcIntervals = initializeIPC();
  onCleanup(() => {
    ipcIntervals.forEach(interval => clearInterval(interval));
  });

  return <Routes>
        <Route path="/home" element={<AppScreen element={<HomePage/>}/>}/>
        <Route path="/" element={<AppScreen element={<HomePage/>}/>}/>
      </Routes>
};

export function attachApp() {
    render(() => <Router source={hashIntegration()}><App></App></Router>, document.getElementById('app'));
}