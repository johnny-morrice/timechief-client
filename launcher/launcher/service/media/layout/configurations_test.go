package layout

import "testing"

func TestTouch2ResolutionDefaultLayout(t *testing.T) {
	criteria := Criteria{
		Width:  1280,
		Height: 720,
	}
	configurations := GetConfigurations()
	actualConfig := configurations.GetSuitable(criteria)
	if actualConfig.Name != "Touch2" {
		t.Errorf("expected Touch2 layout, got %s", actualConfig.Name)
	}
}
