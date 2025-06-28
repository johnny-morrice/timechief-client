import { For, Show } from "solid-js";

export function TreeView(props) {
    function getTableClass() {
        var tableClass = "tree-view";
        if (props.tableClass) {
            tableClass = tableClass + " " + props.tableClass;
        }
        return tableClass;
    }

    function hasBody() {
        return props.table.body && props.table.body.length > 0;
    }

    function isValid() {
        // Every row needs to have length 2.
        if (!hasBody()) {
            return false;
        }
        for (const row of props.table.body) {
            if (row.length !== 2) {
                return false;
            }
        }
        return true;
    }

    return <ul class={getTableClass()}>
            <Show when={isValid()}>
                    <For each={props.table.body}>
                        {(row) => <li> {row[0]}
                            <ul>{row[1]}</ul>
                        </li>}
                    </For>
            </Show>
        </ul>;
}