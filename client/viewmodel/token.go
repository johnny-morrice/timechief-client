package viewmodel

import "fmt"

type TokenResponse struct {
	JWT string
}

type AuthCodeResponse struct {
	AuthCode string
}

type TokenPolicy string

const (
	WebSessionTokenPolicy = "WebSession"
	RefreshTokenPolicy    = "Refresh"
	DevicePolicy          = "Device"
)

func AllTokenPolicies() []TokenPolicy {
	return []TokenPolicy{
		WebSessionTokenPolicy,
		RefreshTokenPolicy,
		DevicePolicy,
	}
}

func MakeTokenPolicy(policyName string) (TokenPolicy, error) {
	for _, policy := range AllTokenPolicies() {
		if policy == TokenPolicy(policyName) {
			return policy, nil
		}
	}
	return "", fmt.Errorf("unsupported TokenPolicy: %s", policyName)
}

type TokenRequest struct {
	PrincipalSerial string
	PrincipalSecret string
	DeviceSerial    string
	DeviceSecret    string
	AuthCode        string
	Scopes          []string
	TokenPolicy     TokenPolicy
}

type TokenPermissions struct {
	Scopes      []string
	TokenPolicy TokenPolicy
}
