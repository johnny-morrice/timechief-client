import { Navbar, Container } from 'solid-bootstrap';

// TODO navbar should make clear this is your local device.
// TODO we need to change the colours so it is different from main timechief site.
export function TCNavbar(props) {
    return <Navbar bg="primary" variant="dark" class="min-vh-2">
        <Container>
            <Navbar.Brand href="/">Timechief</Navbar.Brand>
        </Container>
    </Navbar>
}