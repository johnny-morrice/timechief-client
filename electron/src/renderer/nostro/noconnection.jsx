import { Loading } from "./loading";

export function NoConnection() {
    return <div class="no-connection exposed">
        <div>No connection to local Linux service</div>
        <Loading />
    </div>;
}