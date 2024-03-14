import { Show } from "solid-js";
import { Button, Card, Spinner, Badge } from "solid-bootstrap";
import { Section } from "../section";
import { formatDate } from "../../../util/date/date";
import { fetchOnce } from "../../../util/fetch";
import { Service } from "../../../service/dashboard/section/subscription";

function formatDaysRemaining(unixTime) {
    const now = new Date();
    const validUntil = new Date(unixTime * 1000);
    if (now < validUntil) {
        const diff = validUntil - now;
        return Math.round(diff / (1000 * 60 * 60 * 24));
    }
    return 0;
}

function isValid(unixTime) {
    const now = new Date();
    const validUntil = new Date(unixTime * 1000);
    return now < validUntil;
}

export function LicenseCard(props) {
    return <Card>
        <Card.Body>
            <Card.Title>Your subscription has {formatDaysRemaining(props.license.valid_until)} days remaining</Card.Title>
            <Card.Text>
                <Show when={isValid(props.license.valid_until)}>
                    <strong>Valid until</strong>
                    <p>{formatDate(props.license.valid_until)}</p>
                </Show>
                <Show when={isValid(props.license.valid_until) && props.license.premium}>
                    <Badge bg="secondary">Premium</Badge>
                </Show>
                <Show when={isValid(props.license.valid_until) && !props.license.premium}>
                    <Button>Upgrade</Button>
                </Show>
                <Show when={!isValid(props.license.valid_until)}>
                    <p>Expired</p>
                    <Button>Renew</Button>
                </Show>
            </Card.Text>
        </Card.Body>
    </Card>
}

export function LicenseSection(props) {
    const [licenses, isLoaded, isError] = fetchOnce(Service.getLicenses);

    return <Section title="Subscription">
        <Show when={!isLoaded()}>
            <Spinner animation="border"/>
        </Show>
        <Show when={isLoaded()}>
            <For each={licenses()}>{(license) => <LicenseCard license={license} />}</For>
        </Show>
    </Section>
}