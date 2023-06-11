import { login, setCsrfToken } from "./api"
import { appRedirect } from "./redirect";

export const Login = () => {
    function clearFormError() {
        const errorElem = document.getElementById("login-error");
        if (errorElem != null) {
            const errorWrapper = document.getElementById("login-error-wrapper");
            errorWrapper.removeChild(errorElem);
        }
    }
    function setFormError(message) {
        const errorWrapper = document.getElementById("login-error-wrapper");
        const errorElem = <div id="login-error">{message}</div>
        errorWrapper.appendChild(errorElem);
    }
    async function onClickLogin() {
        clearFormError();
        const username = document.getElementById("username-input").value;
        const password = document.getElementById("password-input").value;
        const resp = await login(username, password);
        if (resp.status == 200) {
            const loginJson = await resp.json();
            if ("CSRFToken" in loginJson) {
                setCsrfToken(loginJson["CSRFToken"]);
                appRedirect();
                return
            }
        }
        console.log("login failed: %d", resp.status);
        setFormError("Login failed");
    }
    return <div class="login-page">
        <div class="site-nav-bar">
            <div class="site-name-home">Timechief</div>
        </div>
        <h1>Login</h1>
        <div class="login-form-wrapper">
            <form onSubmit="return false;">
                <div class="username-wrapper login-form-component">
                    <label class="username-label login-label" for="username-input">Username</label>
                    <input class="login-input" type="text" id="username-input" name="username-input"></input>
                </div>
                <div class="password-wrapper login-form-component">
                    <label class="password-label login-label" for="password-input">Password</label>
                    <input class="password-input" type="password" id="password-input" name="password-input"></input>
                </div>
                <div class="login-button-wrapper login-form-component">
                    <button class="login-button" id="login-button" onClick={onClickLogin}>Login</button>
                </div>
            </form>
            <div id="login-error-wrapper">

            </div>
        </div>
    </div>
}