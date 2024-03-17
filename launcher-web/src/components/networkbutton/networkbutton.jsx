import { Accordion, Form, Button } from "solid-bootstrap";
import { createSignal, Show } from "solid-js";
import { postNetworkSelect } from "../../api/api";

export function NetworkButton(props) {
    const inputID = `wifiKey-${props.eventKey}`;
    const [isError, setIsError] = createSignal(false);
    function connectToNetwork(event) {
        event.preventDefault();
        setIsError(false);
        const key = document.getElementById(inputID).value;
        postNetworkSelect(props.token(), props.ssid, key).then(() => {
            console.log("Connecting to network...");
            props.onConnecting();
        }).catch(err => {
            console.log(`network connect error: ${err}`);
            setIsError(true);
        });
    }
    return <Accordion.Item eventKey={props.eventKey}>
        <Accordion.Header>{props.ssid}&nbsp;<i class="fa-solid fa-wifi"></i>&nbsp;{props.signal}</Accordion.Header>
        <Accordion.Body>
            <Form onSubmit={connectToNetwork}>
                <Form.Group class="mb-3" controlId={inputID}>
                        <Form.Label>Network key: ({props.encryption})</Form.Label>
                        <Show when={isError()}>
                            <Form.Control type="password" placeholder="Key" autocomplete="on" required isInvalid/>
                            <Form.Control.Feedback type="invalid">Invalid key</Form.Control.Feedback>
                        </Show>
                        <Show when={!isError()}>
                            <Form.Control type="password" placeholder="Key" autocomplete="on" required/>
                        </Show>
                        <Form.Text>Enter your home WiFi key.  This will enable the Timechief to connect to your local network.</Form.Text>
                    </Form.Group>
                    <Button variant="primary" type="submit">Connect to network</Button>
            </Form>
        </Accordion.Body>
    </Accordion.Item>
}