import { Loading } from "./loading";

export function NoConnection() {
    console.log("NoConnection render");
    return <div class="system-error">
        <div>No connection to local Linux service</div>
        <Loading />
    </div>;
}