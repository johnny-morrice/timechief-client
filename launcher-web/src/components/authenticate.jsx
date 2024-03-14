import { Container, Row, Col, Card, Form, Button } from 'solid-bootstrap';
import { createSignal } from 'solid-js';
import { getMe } from '../api/api';

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
    function onClickLogin(event) {
        event.preventDefault();
        console.log("Clicked log in");
        props.onClickLogin();
    }
    return <Card>
        <Card.Body>
            <Card.Title>Log in</Card.Title>
            <Card.Text>
                <Form onSubmit={onClickLogin}>
                    <Form.Group class="mb-3" controlId="hotspotKey">
                        <Form.Label>Hotspot Key</Form.Label>
                        <Form.Control type="password" placeholder="Password" autocomplete="on"/>
                        <Form.Text>The hotspot key should be displayed on your timechief when in web setup mode.</Form.Text>
                    </Form.Group>

                    <Button variant="primary" type="submit">Log in</Button>
                </Form>
            </Card.Text>
        </Card.Body>
    </Card>
}

export function Authenticate(props) {
    const [isLoggedIn, setIsLoggedIn] = createSignal(false);
    function verifyLogin(token) {
        getMe(token).then((response) => {
            // Check for this JSON:
            // {'auth_mode': 'web_setup'}
            if (response.auth_mode === 'web_setup') {
                setIsLoggedIn(true);
            }
        });
    }
    function onClickLogin() {
        // Get the value of the hotspotKey input
        const token = document.getElementById('hotspotKey').value;
        verifyLogin(token);
    }
    return <Centered>
        <Show when={!isLoggedIn()}>
            <WebSetupLoginCard onClickLogin={onClickLogin} />
        </Show>
        <Show when={isLoggedIn()}>
            {props.children}
        </Show>
    </Centered>
}