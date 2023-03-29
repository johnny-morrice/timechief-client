package api

import (
	"net/http"

	"github.com/johnny-morrice/timechief-client/client/viewmodel"
)

type API struct {
}

type APIService interface {
	GetDeviceData() (*viewmodel.ClockData, error)
	GetTarget(*Target, error)
	Recover()
}

type Target struct {
	TargetRoot string
	LogFile    string
}

type TargetStatus struct {
	Ready bool
}

func HandleGetTarget(w http.ResponseWriter, r *http.Request) {
	panic("not implemented")
}

func HandleGetDeviceData(w http.ResponseWriter, r *http.Request) {
	panic("not implemented")
}

func HandleRecoverTarget(w http.ResponseWriter, r *http.Request) {
	// TODO: implement
}
