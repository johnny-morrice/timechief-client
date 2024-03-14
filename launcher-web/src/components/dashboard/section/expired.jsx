import { Card, Button } from "solid-bootstrap";
import { Section } from "../section";

export function ExpiredSubscriptionSection() {
    return <Section title="Payment required">
        <Card>
            <Card.Body>
                <Card.Title>Your subscription has expired</Card.Title>
                <Card.Text>
                    <Button>Renew</Button>
                    <p>See details of your expired subscription and previous orders below.</p>
                </Card.Text>
            </Card.Body>
        </Card>
    </Section>
}
