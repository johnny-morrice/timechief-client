package client

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"io"
	"net/http/httputil"

	"github.com/go-resty/resty/v2"
	"github.com/pkg/errors"
)

func DumpRequest(resp *resty.Response) (string, error) {
	buff := &bytes.Buffer{}
	dump, err := httputil.DumpRequestOut(resp.Request.RawRequest, false)
	if err != nil {
		return "", errors.Wrap(err, "failed to write out client request")
	}
	copyBytes(buff, dump)
	body, err := resp.Request.RawRequest.GetBody()
	if err != nil {
		return "", errors.Wrap(err, "failed to write out client request body")
	}
	if body == nil {
		return buff.String(), nil
	}
	defer body.Close()
	fmt.Fprintln(buff)
	_, err = io.Copy(buff, body)
	if err != nil {
		return "", errors.Wrap(err, "failed to write out client request body")
	}
	return buff.String(), nil
}

func DumpResponse(resp *resty.Response) (string, error) {
	buff := &bytes.Buffer{}
	dump, err := httputil.DumpResponse(resp.RawResponse, false)
	if err != nil {
		return "", errors.Wrap(err, "failed to write out client response")
	}
	copyBytes(buff, dump)
	body := resp.String()
	if len(body) > 0 {
		fmt.Fprintln(buff, body)
	}
	return buff.String(), nil
}

func copyBytes(w io.Writer, bytes []byte) error {
	return binary.Write(w, binary.LittleEndian, bytes)
}
