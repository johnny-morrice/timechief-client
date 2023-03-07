package coreclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
)

type RawSessionClient struct {
	*client.RawRestClient
}

func (clnt *RawSessionClient) baseURL() string {
	return clnt.Config.BaseURL + "/session"
}

func (clnt *RawSessionClient) CreateSession(ctx context.Context, args *viewmodel.MakeSessionParameters) (*resty.Response, error) {
	return clnt.Request(ctx).SetBody(args).Post(clnt.baseURL())
}

func (clnt *RawSessionClient) ValidateSession(ctx context.Context, sessionID string) (*resty.Response, error) {
	return clnt.Request(ctx).SetPathParam("sessionID", sessionID).Get(clnt.baseURL() + "/{sessionID}")
}

func (clnt *RawSessionClient) ValidateCSRFToken(ctx context.Context, sessionID, csrfToken string) (*resty.Response, error) {
	return clnt.Request(ctx).SetPathParam("sessionID", sessionID).SetPathParam("csrfToken", csrfToken).Get(clnt.baseURL() + "/{sessionID}/{csrfToken}")
}

func (clnt *RawSessionClient) RemoveSession(ctx context.Context, sessionID string) (*resty.Response, error) {
	return clnt.Request(ctx).SetPathParam("sessionID", sessionID).Delete(clnt.baseURL() + "/{sessionID}")
}
