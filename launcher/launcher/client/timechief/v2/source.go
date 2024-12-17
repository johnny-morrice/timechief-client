//go:generate oapi-codegen -generate types,client -package v2 -o ./gen.go ./spec/openapi-3.0/openapi.yaml
package v2

// Generate a go client based on the API spec at ./spec/api_spec.yaml.
