import { Col, Container, Row, Spinner } from "solid-bootstrap";
import { Authenticate } from "../authenticate";

export function WebSetupDashboard(props) {
    return <>
        <Container>
            <Row>
                <Col>
                    <h1>Setup your Timechief</h1>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Spinner animation="border" />
                </Col>
            </Row>
        </Container>
    </>
}

export function WebSetupRoute(props) {
    return <Authenticate>
        <WebSetupDashboard />
    </Authenticate>
}