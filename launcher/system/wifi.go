package system

type WifiCard struct {
	Interface string
}

func (card WifiCard) ScanWifiNetworks() ([]WifiNetwork, error) {
	panic("not implemented")
}

func (card WifiCard) Connect(net WifiNetwork) error {
	panic("not implemented")
}

type WifiNetwork struct {
	ESSID string
	BSSID string
	Key   string
}

func ReadWifiCards() ([]WifiCard, error) {
	panic("not implemented")
}
