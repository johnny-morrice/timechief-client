import { WebSetupPage } from "./webSetup";
import { HomePage } from "./homePage";
import { LoginPage } from './login';

export function NostroSkin() {
  console.log("NostroSkin render");
  return <WebSetupPage element={
    <LoginPage element={<HomePage />} />} />;
};