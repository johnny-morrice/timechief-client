import { Show } from "solid-js";
import { Button, Card, Spinner } from "solid-bootstrap";
import { Section } from "../section";
import { fetchOnce } from "../../../util/fetch";
import { Service } from "../../../service/dashboard/section/support";
import { CopyClipboard } from "../../copyclipboard/copyclipboard";

export function SupportSection(props) {
    const [currentPrincipal, isLoaded, isError] = fetchOnce(Service.getCurrentPrincipal);

    return <Section title="Support">
        <Show when={!isLoaded()}>
            <Spinner animation="border"/>
        </Show>
        <Show when={isLoaded()}>
            <Card>
                <Card.Body>
                    <Card.Title>Your support ID number</Card.Title>
                    <Card.Text>
                        <CopyClipboard text={currentPrincipal().uuid} />
                        <Button>Get help</Button>
                    </Card.Text>
                </Card.Body>
            </Card>
        </Show>
    </Section>
}