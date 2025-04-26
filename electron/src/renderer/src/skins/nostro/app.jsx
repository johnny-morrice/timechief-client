import { render } from 'solid-js/web';
import { onCleanup } from 'solid-js';
import { initializeIPC } from './ipc';
import { WebSetupPage } from "./webSetup";
import { HomePage } from "./homePage";
import { LoginPage } from './login';
import { IntroVideo } from '../../components/introVideo';
import { MediaVideo } from '../../components/mediavideo';
import { WindowResizer } from '../../components/windowResizer';
import { ThemeDetector } from '../../components/themeDetector';

const AppScreen = (props) => {
  console.log("AppScreen render");
  return <WindowResizer element={
      <IntroVideo element={
        <ThemeDetector element ={
          <WebSetupPage element={
            <LoginPage element={
              <MediaVideo element={props.element} />} />}/>} />} />} />
};

const App = () => {
  console.log("App render");
  let ipcIntervals = initializeIPC();
  onCleanup(() => {
    ipcIntervals.forEach(interval => clearInterval(interval));
  });

  return <AppScreen element={<HomePage/>}/>
};

export function attachApp() {
    render(() => <App />, document.getElementById('app'));
}