import { Show } from "solid-js";
import { Table, Spinner } from "solid-bootstrap";
import { Section } from "../section";
import { formatDate } from "../../../util/date/date";
import { fetchOnce } from "../../../util/fetch";
import { Service } from "../../../service/dashboard/section/order";

export function OrderSection(props) {
    const [orders, isLoaded, isError] = fetchOnce(Service.getOrders);

    return <Section title="Orders">
        <Show when={!isLoaded()}>
            <Spinner animation="border"/>
        </Show>
        <Show when={isLoaded()}>
            <Table>
                <thead>
                    <tr>
                        <th>Ordered at</th>
                        <th>Product name</th></tr>
                </thead>
                <tbody>
                    <For each={orders()}>{(order) =>
                        <tr>
                            <td>{formatDate(order.ordered_at)}</td>
                            <td>{order.product_name}</td>
                        </tr>
                    }</For>
                </tbody>
            </Table>
        </Show>
    </Section>
}