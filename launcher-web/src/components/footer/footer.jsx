import { Container, Row, Col } from 'solid-bootstrap';

// TODO we want a simplified footer that will say a copyright and say this is your local device.
export function Footer(props) {
    return <footer class="footer bg-dark text-white mt-auto min-vh-5">
        <Container>
            <Row>
                <Col>
                    <p>This page is served by a Timechief device running on your local network.</p>
                </Col>
            </Row>
            <Row>
                <Col>
                    <p>© Timechief Ltd, 2023</p>
                </Col>
            </Row>
        </Container>
    </footer>
}