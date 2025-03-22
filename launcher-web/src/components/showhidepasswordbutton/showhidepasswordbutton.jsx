import { Button } from "solid-bootstrap";

export function ShowHidePasswordButton(props) {
    const fieldType = props.fieldType;
    const setFieldType = props.setFieldType;
    function getShowHideLabel(fieldType) {
        return fieldType === "password" ? <i class="fa-solid fa-eye"></i> : <i class="fa-solid fa-eye-slash"></i>;
    }
    function toggleFieldType() {
        if (fieldType() === "password") {
            setFieldType("text");
        } else {
            setFieldType("password");
        }
    }
    return <Button variant="outline-secondary" onClick={toggleFieldType}>{getShowHideLabel(fieldType())}</Button>
}