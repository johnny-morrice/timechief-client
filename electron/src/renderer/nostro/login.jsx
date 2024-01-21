import { Show } from "solid-js";

class Signals {

}

export function LoginPage(props) {
    const signals = new Signals();
    function isLoggedIn(signals) {
        return false;
    }
    return <>
    <Show when={isLoggedIn(signals)}>
        {props.element}
    </Show>
    <Show when={!isLoggedIn(signals)}>
        <h1>Login to Timechief</h1>
    </Show>
    </>
}