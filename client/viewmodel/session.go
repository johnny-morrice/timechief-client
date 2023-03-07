package viewmodel

type MakeSessionParameters struct {
	DeviceSerial    string
	PrincipalSerial string
}

type SessionData struct {
	SessionID       string
	PrincipalSerial string
	DeviceSerial    string
	CSRFToken       string
}
