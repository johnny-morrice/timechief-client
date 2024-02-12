#!/bin/bash
go install github.com/deepmap/oapi-codegen/v2/cmd/oapi-codegen@latest
go generate -v ./launcher/client/timechief/v2/