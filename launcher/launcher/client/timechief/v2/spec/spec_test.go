package spec

import (
	"context"
	"testing"

	"github.com/deepmap/oapi-codegen/pkg/util"
)

func TestLintOpenAPISpec(t *testing.T) {
	// Load your OpenAPI spec from a file
	specPath := "./openapi-3.0/api_spec.yaml"
	spec, err := util.LoadSwagger(specPath)
	if err != nil {
		t.Fatalf("Failed to load OpenAPI spec: %v", err)
	}

	err = spec.Validate(context.Background())
	if err != nil {
		t.Fatalf("Failed to validate OpenAPI spec: %v", err)
	}
}
