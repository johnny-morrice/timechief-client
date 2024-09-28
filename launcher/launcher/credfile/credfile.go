package credfile

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"
)

type credentials struct {
	APIKey string `json:"api_key"`
}

func WriteCredentials(credentialsPath string, apiKey string) error {
	creds := credentials{APIKey: apiKey}
	file, err := os.Create(credentialsPath)
	if err != nil {
		return fmt.Errorf("failed to open credentials file for writing: %v", err)
	}
	defer func() {
		err := file.Close()
		if err != nil {
			log.Printf("failed to close credentials file after writing: %v", err)
		}
	}()
	enc := json.NewEncoder(file)
	err = enc.Encode(creds)
	if err != nil {
		return fmt.Errorf("failed to write credentials to file: %v", err)
	}
	return nil
}

func ReadCredentials(credentialsPath string) (string, error) {
	// Retry reading credentials file if it is not found
	const timeout = 30 * time.Second
	const interval = 1 * time.Second
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		apiKey, err := doReadCredentials(credentialsPath)
		if err == nil && apiKey != "" {
			return apiKey, nil
		}
		log.Printf("failed to read credentials file: %v", err)
		time.Sleep(interval)
	}
	return "", fmt.Errorf("timed out reading credentials file after %v", timeout)
}

func doReadCredentials(credentialsPath string) (string, error) {
	file, err := os.Open(credentialsPath)
	if err != nil {
		return "", fmt.Errorf("failed to open credentials file for reading: %v", err)
	}
	defer func() {
		err := file.Close()
		if err != nil {
			log.Printf("failed to close credentials file after reading: %v", err)
		}
	}()
	dec := json.NewDecoder(file)
	creds := credentials{}
	err = dec.Decode(&creds)
	if err != nil {
		return "", fmt.Errorf("failed to read credentials from file: %v", err)
	}
	return creds.APIKey, nil
}
