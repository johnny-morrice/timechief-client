import { Container, Row, Col } from 'solid-bootstrap';

// TODO we want a simplified footer that will say a copyright and say this is your local device.
export function Footer(props) {
    return <footer class="footer bg-dark text-white mt-auto min-vh-5">
        <Container>
            <Row>
                <Col>
                    <p>Customer support</p>
                </Col>
                <Col>
                    <p>Privacy policy</p>
                </Col>
                <Col>
                    <p>Terms of use</p>
                </Col>
                <Col>
                    <p>About us</p>
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