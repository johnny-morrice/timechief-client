package media

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"time"
)

type MediaDownloader struct {
	timeout time.Duration
}

func MakeMediaDownloader(timeout time.Duration) (MediaDownloader, error) {
	if timeout <= 0 {
		return MediaDownloader{}, fmt.Errorf("timeout must be positive")
	}
	downloader := MediaDownloader{
		timeout: timeout,
	}
	return downloader, nil
}

func (md MediaDownloader) Download(ctx context.Context, url string, sha256 []byte) ([]byte, error) {
	content, err := md.doDownload(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("failed to download video content: %w", err)
	}
	err = doSHA256(bytes.NewReader(content), sha256)
	if err != nil {
		return nil, fmt.Errorf("failed to validate video content at %s: %w", url, err)
	}
	return content, nil
}

func (md MediaDownloader) doDownload(ctx context.Context, url string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, md.timeout)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create video content request: %w", err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to download video content: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to download video content: status code %d", resp.StatusCode)
	}
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read video content: %w", err)
	}
	return data, nil
}
