package protocol

import (
	"errors"

	"github.com/google/uuid"
)

const FISH_TAG_HEADER = "X-Fish-Tag"
const AUTHORIZATION_HEADER = "Authorization"
const CONTENT_TYPE_HEADER = "Content-Type"
const ACCEPT_HEADER = "Accept"
const IDEMPOTENCY_HEADER = "Idempotency"
const IDEMPOTENCY_NAMESPACE_HEADER = "X-Idempotency-Namespace"

const MIME_APPLICATION_JSON = "application/json; charset=utf-8"

func NewFishTag() string {
	return uuid.NewString()
}

func InvalidHeaderMessage(headerName string) string {
	return "invalid " + headerName + " header"
}

func InvalidHeaderError(headerName string) error {
	return errors.New(InvalidHeaderMessage(headerName))
}
