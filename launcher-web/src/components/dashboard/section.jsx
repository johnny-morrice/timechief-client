import { Container, Row, Col } from "solid-bootstrap";
import { children } from "solid-js";

export function Section(props) {
    const c = children(() => props.children);

    function getChildrenArray() {
        if (Array.isArray(c())) {
            return c();
        } else {
            return [c()];
        }
    }

    function isValidChild(child) {
        return new Boolean(child);
    }

    return <Container class="bg-light d-flex flex-column gap-3">
        <Row>
            <Col>
                <h1>{props.title}</h1>
            </Col>
        </Row>

        <For each={getChildrenArray()}>{(child) =>
            <Show when={isValidChild(child)}>
                <Row>
                    <Col>
                        <div class="dashboard-section-item">{child}</div>
                    </Col>
                </Row>
            </Show>
        }</For>

    </Container>
}