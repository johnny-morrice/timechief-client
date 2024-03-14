import { Col, Container, Row, Spinner } from "solid-bootstrap";
import { DeviceSection } from "./section/device";
import { OrderSection } from "./section/order";
import { LicenseSection } from "./section/subscription";
import { SupportSection } from "./section/support";
import { ExpiredSubscriptionSection } from "./section/expired";
import { Footer } from "../footer/footer";
import { TCNavbar } from "../navbar/navbar";
import { Service } from "../../service/dashboard/dashboard";
import { Show } from "solid-js";
import { fetchOnce } from "../../util/fetch";
import { Authenticate } from "../authenticate";

function DeviceRow(props) {
    return <Row>
        <Col>
            <DeviceSection />
        </Col>
    </Row>;
}

function LicenseRow(props) {
    return <Row>
        <Col>
            <LicenseSection />
        </Col>
    </Row>;
}

function OrderRow(props) {
    return <Row>
        <Col>
            <OrderSection />
        </Col>
    </Row>;
}

function SupportRow(props) {
    return <Row>
        <Col>
            <SupportSection />
        </Col>
    </Row>
}

function ExpiredSubscriptionRow(props) {
    return <Row>
        <Col>
            <ExpiredSubscriptionSection />
        </Col>
    </Row>
}

// TODO make a section about networks.
// We will also a component that is a network list.

// Rename to WebSetupDashboard.
export function Dashboard(props) {
    // TODO here we list networks.
    // We need to poll the /me API to see if still authed, still on network.
    // If network error/auth error, display a "refer back to your device" component.
    const [hasValidSub, isSubLoaded, isSubError] = fetchOnce(Service.hasValidSubscription);
    const [hasDevices, isDevicesLoaded, isDeviceError] = fetchOnce(Service.hasDevices);
    const [hasLicenses, isLicensesLoaded, isLicenseError] = fetchOnce(Service.hasLicenses);
    const [hasOrders, isOrdersLoaded, isOrderError] = fetchOnce(Service.hasOrders);
    return <>
        <TCNavbar />
        <Container class="bg-light min-vh-93 d-flex flex-column gap-5 pt-3 pb-3">
            <Show when={!isSubLoaded() || !isDevicesLoaded()}>
                <Row>
                    <Col>
                        <Spinner animation="border"/>
                    </Col>
                </Row>
            </Show>
            <Show when={isSubLoaded() && hasValidSub() && hasDevices() && isDevicesLoaded()}>
                <DeviceRow />
            </Show>
            <Show when={isSubLoaded() && !hasValidSub()}>
                <ExpiredSubscriptionRow />
            </Show>
            <Show when={!isLicensesLoaded()}>
                <Row>
                    <Col>
                        <Spinner animation="border"/>
                    </Col>
                </Row>
            </Show>
            <Show when={isLicensesLoaded() && hasLicenses()}>
                <LicenseRow />
            </Show>
            <Show when={!isOrdersLoaded()}>
                <Row>
                    <Col>
                        <Spinner animation="border"/>
                    </Col>
                </Row>
            </Show>
            <Show when={isOrdersLoaded() && hasOrders()}>
                <OrderRow />
            </Show>
            <SupportRow />
        </Container>
        <Footer />
    </>;
}

export function DashboardRoute(props) {
    return <Authenticate>
        <Dashboard />
    </Authenticate>;
}