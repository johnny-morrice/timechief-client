package spec

import (
	"context"
	"embed"
	"testing"

	"github.com/getkin/kin-openapi/openapi3"
)

//go:embed openapi-3.0/openapi.yaml
var specFS embed.FS

func TestLintOpenAPISpec(t *testing.T) {
	// Read your OpenAPI spec from the embedded file system
	specBytes, err := specFS.ReadFile("openapi-3.0/openapi.yaml")
	if err != nil {
		t.Fatalf("Failed to read OpenAPI spec: %v", err)
	}

	// Load your OpenAPI spec from the byte slice
	loader := openapi3.NewLoader()
	spec, err := loader.LoadFromData(specBytes)
	if err != nil {
		t.Fatalf("Failed to load OpenAPI spec: %v", err)
	}

	err = spec.Validate(context.Background())
	if err != nil {
		t.Fatalf("OpenAPI spec is invalid: %v", err)
	}
}
