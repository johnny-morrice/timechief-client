import { Container, Row, Col, Card, Form, Button } from 'solid-bootstrap';
import { createSignal } from 'solid-js';
import { getMe } from '../api/api';
import { ShowHidePasswordButton } from './showhidepasswordbutton/showhidepasswordbutton';

function Centered(props) {
    return <Container class="pt-5">
        <Row>
            <Col>
                {props.children}
            </Col>
        </Row>
    </Container>
}

function WebSetupLoginCard(props) {
    const [fieldType, setFieldType] = createSignal("password");
    function onClickLogin(event) {
        event.preventDefault();
        console.log("Clicked log in");
        props.onClickLogin();
    }
    return <Card>
        <Card.Body>
            <Card.Title>Log in to your Timechief device</Card.Title>
            <Card.Text>
                
                    <Form onSubmit={onClickLogin}>
                        <Form.Group class="mb-3" controlId="hotspotKey">
                            <Form.Label>Hotspot Key</Form.Label>
                            <Show when={props.isError()}>
                                <Row class="g-3">
                                    <Col xs={12} md={6} lg={3}>
                                        <Form.Control type={fieldType()} placeholder="Password" autocomplete="on" required isInvalid />
                                    </Col>
                                    <Col xs={12} md={6} lg={3}>
                                        <ShowHidePasswordButton fieldType={fieldType} setFieldType={setFieldType} />
                                    </Col>
                                </Row>
                                <Form.Control.Feedback type="invalid">{props.errorMessage}</Form.Control.Feedback>
                            </Show>
                            <Show when={!props.isError()}>
                                <Row class="g-3">
                                    <Col xs={12} md={6} lg={3}>
                                        <Form.Control type={fieldType()} placeholder="Password" autocomplete="on" required />
                                    </Col>
                                    <Col xs={12} md={6} lg={3}>
                                        <ShowHidePasswordButton fieldType={fieldType} setFieldType={setFieldType} />
                                    </Col>
                                </Row>
                            </Show>
                            <Form.Text>The hotspot key is your password.  It should be displayed on your Timechief when in web setup mode.</Form.Text>
                            
                        </Form.Group>
                        
                        <Button variant="primary" type="submit">Log in</Button>
                        
                    </Form>
                
            </Card.Text>
        </Card.Body>
    </Card>
}

export function Authenticate(props) {
    const [isLoggedIn, setIsLoggedIn] = createSignal(false);
    const [isError, setError] = createSignal(false);
    const [errorMessage, setErrorMessage] = createSignal("");
    function verifyLogin(token) {
        setError(false);
        setErrorMessage("");
        getMe(token).then((response) => {
            // Check for this JSON:
            // {'auth_mode': 'web_setup'}
            if (response.auth_mode === 'web_setup' && response.device_mode === 'web_setup') {
                props.onToken(token);
                setError(false);
                setIsLoggedIn(true);
            } else {
                setErrorMessage("Use the Timechief hotspot key and put the device into setup mode.");
                setError(true);
            }
        }).catch(err => {
            console.log(`login error: ${err}`);
            setErrorMessage("Bad password.  Please try again.");
            setError(true);
        });
    }
    function onClickLogin() {
        // Get the value of the hotspotKey input
        const token = document.getElementById('hotspotKey').value;
        verifyLogin(token);
    }
    return <>
        <Show when={!isLoggedIn()}>
            <Centered>
                <WebSetupLoginCard isError={isError} errorMessage={errorMessage} onClickLogin={onClickLogin} />
            </Centered>
        </Show>
        <Show when={isLoggedIn()}>
            {props.children}
        </Show>
    </>

}