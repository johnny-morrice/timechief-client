package viewmodel

type PairingCode struct {
	Code string
}

type PairingStatus struct {
	Status       string
	DeviceSerial string
	Principal    ClockPrincipal
}

type CreatePairingRequest struct {
	DeviceSerial string
}

type LinkPrincipalPairingRequest struct {
	PrincipalSerial string
	PairingCode     string
}
