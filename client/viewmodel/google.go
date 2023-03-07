package viewmodel

type GoogleAuthorizationURL struct {
	URL string
}

type GoogleProfile struct {
	RegisteredEmailAddress string
}

type GoogleProfileResponse struct {
	Profile     *GoogleProfile
	LastUpdated int64
}
