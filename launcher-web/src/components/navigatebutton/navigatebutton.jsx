import { A } from "@solidjs/router";
import { Button } from "solid-bootstrap";

export function NavigateButton(props) {
    // Strip leading hash from href if present
    const href = props.href.startsWith("#") ? props.href.substring(1) : props.href;
    return <A href={href}>
        <Button>{props.children}</Button>
    </A>
}