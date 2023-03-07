package viewmodel

type CalendarResponse struct {
	LastUpdated int64
	Calendar    *Calendar
}

type Calendar struct {
	Events []CalendarEvent
}

type CalendarEvent struct {
	ID        string
	ShortText string
	AllDay    bool
	Start     int64
	End       int64
}
