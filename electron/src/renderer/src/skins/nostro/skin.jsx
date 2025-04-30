import { onCleanup } from 'solid-js';
import { WebSetupPage } from "./webSetup";
import { HomePage } from "./homePage";
import { LoginPage } from './login';
import { IntroVideo } from '../../components/introVideo';
import { MediaVideo } from '../../components/mediavideo';
import { WindowResizer } from '../../components/windowResizer';
import { ThemeDetector } from '../../components/themeDetector';

function NostroApp(props) {
  console.log("AppScreen render");
  return <WindowResizer element={
      <IntroVideo element={
        <ThemeDetector element ={
          <WebSetupPage element={
            <LoginPage element={
              <MediaVideo element={props.element} />} />}/>} />} />} />
};

export function NostroSkin() {
  console.log("Nostro skin render");
  return <NostroApp element={<HomePage/>}/>
};