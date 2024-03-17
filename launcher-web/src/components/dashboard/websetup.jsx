import { Accordion, Col, Container, Row, Spinner } from "solid-bootstrap";
import { Authenticate } from "../authenticate";
import { TCNavbar } from "../navbar/navbar";
import { Footer } from "../footer/footer";
import { getListNetworks } from "../../api/api";
import { For, createSignal, onMount } from "solid-js";
import { NetworkButton } from "../networkbutton/networkbutton";

export function WebSetupDashboard(props) {
    const [networks, setNetworks] = createSignal([]);
    const [isConnecting, setConnecting] = createSignal(false);
    onMount(() => {
        getListNetworks(props.token()).then((response) => {
            setNetworks(response);
        });
    });
    function areNetworksAvailable() {
        return networks().length > 0;
    }
    function doOnConnecting() {
        setConnecting(true);
    }
    return <>
        <TCNavbar />
        <Show when={isConnecting()}>
            <Container>
                <Row>
                    <Col>
                        <h1>Your Timechief is connecting to your home network</h1>
                        <p>Follow instructions on your device to continue.</p>
                    </Col>
                </Row>
            </Container>
        </Show>
        <Show when={!isConnecting()}>
            <Container>
                <Row>
                    <Col>
                        <h1>Setup your Timechief</h1>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Show when={areNetworksAvailable()}>
                            <Accordion>
                                <For each={networks()}>{
                                    (network, i) =>
                                        <NetworkButton onConnecting={doOnConnecting} token={props.token} eventKey={i()} ssid={network.ssid} signal={network.signal_strength} encryption={network.encryption} />
                                }
                                </For>
                            </Accordion>
                        </Show>
                        <Show when={!areNetworksAvailable()}>
                            <Spinner animation="border" />
                        </Show>
                    </Col>
                </Row>
            </Container>
        </Show>
        <Footer />
    </>
}

export function WebSetupRoute(props) {
    const [token, setToken] = createSignal("");
    return <Authenticate onToken={setToken}>
        <WebSetupDashboard token={token} />
    </Authenticate>
}