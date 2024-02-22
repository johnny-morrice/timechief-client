package memblob

import "errors"

// Simple in-memory blob store for testing purposes.
type BlobStore struct {
	blobs map[string][]byte
}

// Create a new BlobStore.
func NewBlobStore() BlobStore {
	return BlobStore{blobs: make(map[string][]byte)}
}

const maxBlobSize = 1024 * 1024 * 256 // 256 MB

// Put a blob in the store.
func (store BlobStore) Put(key string, data []byte) error {
	if key == "" {
		return errors.New("empty key")
	}
	if len(data) > maxBlobSize {
		return errors.New("blob too large")
	}
	store.blobs[key] = data
	return nil
}

// Get a blob from the store.
func (store BlobStore) Get(key string) ([]byte, error) {
	data, ok := store.blobs[key]
	if !ok {
		return nil, nil
	}
	return data, nil
}
