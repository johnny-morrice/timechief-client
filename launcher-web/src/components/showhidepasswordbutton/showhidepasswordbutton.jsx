export function ShowHidePasswordButton(props) {
    const fieldType = props.fieldType;
    const setFieldType = props.setFieldType;
    function getShowHideLabel(fieldType) {
        return fieldType === "password" ? "Show password" : "Hide password";
    }
    function toggleFieldType() {
        if (fieldType() === "password") {
            setFieldType("text");
        } else {
            setFieldType("password");
        }
    }
    return <Button variant="secondary" onClick={toggleFieldType}>{getShowHideLabel(fieldType())}</Button>
}