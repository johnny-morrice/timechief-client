import { Accordion, Form, Button, Row, Col } from "solid-bootstrap";
import { createSignal, Show } from "solid-js";
import { postNetworkSelect } from "../../api/api";
import { ShowHidePasswordButton } from "../showhidepasswordbutton/showhidepasswordbutton";

export function NetworkButton(props) {
    const inputID = `wifiKey-${props.eventKey}`;
    const [isError, setIsError] = createSignal(false);
    const [fieldType, setFieldType] = createSignal("password");
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
        <Row class="g-3">
            <Form onSubmit={connectToNetwork}>
                <Form.Group class="mb-3" controlId={inputID}>
                        <Form.Label>Network key: ({props.encryption})</Form.Label>
                        <Show when={isError()}>
                            <Col xs={12} md={6} lg={3}>
                                <Form.Control type={fieldType()} placeholder="Key" autocomplete="on" required isInvalid/>
                            </Col>
                            <Col xs={12} md={6} lg={3}>
                                <ShowHidePasswordButton fieldType={fieldType} setFieldType={setFieldType} />
                            </Col>
                            <Form.Control.Feedback type="invalid">Invalid key</Form.Control.Feedback>
                        </Show>
                        <Show when={!isError()}>
                            <Col xs={12} md={6} lg={3}>
                                <Form.Control type={fieldType()} placeholder="Key" autocomplete="on" required/>
                            </Col>
                            <Col xs={12} md={6} lg={3}>
                                <ShowHidePasswordButton fieldType={fieldType} setFieldType={setFieldType} />
                            </Col>
                        </Show>
                        <Form.Text>Enter your home WiFi key.  This will enable the Timechief to connect to your local network.</Form.Text>
                    </Form.Group>
                    <Button variant="primary" type="submit">Connect to network</Button>
            </Form>
        </Row>
        </Accordion.Body>
    </Accordion.Item>
}