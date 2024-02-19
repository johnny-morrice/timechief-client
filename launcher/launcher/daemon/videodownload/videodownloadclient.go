package videodownload

import "time"

type VideoDownloadClient interface {
	ListVideos() ([]VideoSource, error)
}

type VideoSource struct {
	UUID     string
	Duration time.Duration
	URL      string
}
