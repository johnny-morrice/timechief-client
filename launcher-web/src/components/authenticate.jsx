import { Show, createSignal } from 'solid-js';
import { Container, Row, Col, Card, Spinner } from 'solid-bootstrap';
import { Service } from '../service/auth';
import { LoggedOutFooter } from './footer/loggedoutfooter';
import { LoggedOutNavbar } from './navbar/loggedoutnavbar';

function Centered(props) {
    return <Container class="pt-5">
        <Row>
            <Col>
                {props.children}
            </Col>
        </Row>
    </Container>
}

function LoadingLoginCard(props) {
    return <Card>
        <Card.Body>
            <Card.Title>Logging in...</Card.Title>
            <Card.Text>
                Please wait for log in.
            </Card.Text>
            <Spinner animation="border" />
        </Card.Body>
    </Card>
}

function LoginFailedRedirectCard(props) {
    return <Card>
        <Card.Body>
            <Card.Title>Failed to log in</Card.Title>
            <Card.Text>
                Redirecting to the login page.
            </Card.Text>
        </Card.Body>
    </Card>
}

export function Authenticate(props) {
    // This should check the /me API.
    Service.clearQueryParams();
    const [isAuthenticated, setIsAuthenticated] = createSignal(false);
    const [isWaitingForAuthentication, setIsWaitingForAuthentication] = createSignal(true);
    Service.checkAuthentication().then((result) => {
        if (!result.uuid) {
            Service.loginRedirect();
            return;
        }
        console.log("Authentication result: " + JSON.stringify(result));
        setIsAuthenticated(true);
        setIsWaitingForAuthentication(false);
    }).catch((error) => {
        console.log("Error checking authentication: " + error);
        console.log(error.stack);
        setIsAuthenticated(false);
        setIsWaitingForAuthentication(false);
        if (!isAuthenticated()) {
            Service.loginRedirect();
            return
        }
    });

    return <>
        <Show when={isWaitingForAuthentication()}>
            <>
                <LoggedOutNavbar />
                <Centered><LoadingLoginCard /></Centered>
                <LoggedOutFooter/>
            </>
        </Show>
        <Show when={!isWaitingForAuthentication() && !isAuthenticated()}>
            <>
                <LoggedOutNavbar />
                <Centered><LoginFailedRedirectCard /></Centered>
                <LoggedOutFooter/>
            </>
        </Show>
        <Show when={isAuthenticated()}>
            {props.children}
        </Show>
    </>
}