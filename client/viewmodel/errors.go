package viewmodel

type Errors struct {
	Errors []string
}

func NewErrorResponse(err string) *Errors {
	return &Errors{
		Errors: []string{
			err,
		},
	}
}
