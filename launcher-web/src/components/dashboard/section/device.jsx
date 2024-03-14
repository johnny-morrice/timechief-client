import { Show } from "solid-js";
import { Card, Spinner } from "solid-bootstrap";
import { Section } from "../section";
import { fetchOnce } from "../../../util/fetch";
import { Service } from "../../../service/dashboard/section/device";
import { NavigateButton } from "../../navigatebutton/navigatebutton";

export function DeviceCard(props) {
    return <Card>
        <Card.Body>
            <Card.Title>{props.device.nickname}</Card.Title>
            <Card.Text>
                <p>{props.device.location}</p>
                <NavigateButton href={`/device/${props.device.uuid}/setup`}>Set up device</NavigateButton>
            </Card.Text>
        </Card.Body>
    </Card>
}

export function DeviceSection(props) {
    const [devices, isLoaded, isError] = fetchOnce(Service.getDevices);

    return <Section title="Devices">
        <Show when={!isLoaded()}>
            <Spinner animation="border"/>
        </Show>
        <Show when={isLoaded()}>
            <For each={devices()}>{(device) => <DeviceCard device={device} />}</For>
        </Show>
    </Section>
}