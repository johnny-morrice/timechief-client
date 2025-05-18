import { For, Show } from "solid-js";

export function WinTable(props) {
    function getTableClass() {
        var tableClass = "win-table";
        if (props.tableClass) {
            tableClass = tableClass + " " + props.tableClass;
        }
        return tableClass;
    }

    function hasHeadings() {
        return props.table.headings && props.table.headings.length > 0;
    }

    function hasBody() {
        return props.table.body && props.table.body.length > 0;
    }

    return <div class="sunken-panel">
        <table class={getTableClass()}>
            <Show when={hasHeadings()}>
                <thead>
                    <tr>
                        <For each={props.table.headings}>
                            {(heading) => <th>{heading}</th>}
                        </For>
                    </tr>
                </thead>
            </Show>
            <Show when={hasBody()}>
                <tbody>
                    <For each={props.table.body}>
                        {(row) => <tr>
                            <For each={row}>
                                {(cellSignal) => <td>{cellSignal}</td>}
                            </For>
                        </tr>}
                    </For>
                </tbody>
            </Show>
        </table>
    </div>;
}