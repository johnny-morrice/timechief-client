import { Container, Row, Col, Card, Spinner } from 'solid-bootstrap';

function Centered(props) {
    return <Container class="pt-5">
        <Row>
            <Col>
                {props.children}
            </Col>
        </Row>
    </Container>
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
    return <div>
        <h1>Authenticate</h1>
    </div>
}