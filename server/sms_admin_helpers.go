package main

import (
	"errors"
	"net/http"
	"net/url"
	"strings"

	"webui/server/pb"
)

func splitSMSPath(path, prefix string) (string, string, bool) {
	tail := strings.Trim(strings.TrimPrefix(path, prefix), "/")
	parts := strings.Split(tail, "/")
	if len(parts) == 0 || strings.TrimSpace(parts[0]) == "" {
		return "", "", false
	}
	id, err := url.PathUnescape(parts[0])
	if err != nil || strings.TrimSpace(id) == "" {
		return "", "", false
	}
	action := ""
	if len(parts) > 1 {
		action = strings.TrimSpace(parts[1])
	}
	return strings.TrimSpace(id), action, true
}

func queryBool(r *http.Request, key string, fallback bool) bool {
	value := strings.ToLower(strings.TrimSpace(r.URL.Query().Get(key)))
	if value == "" {
		return fallback
	}
	return value == "true" || value == "1" || value == "yes"
}

func writeProviderError(w http.ResponseWriter, err *pb.ProviderError) bool {
	if err == nil || err.GetPublicError() == nil {
		return false
	}
	message := strings.TrimSpace(err.GetPublicError().GetMessage())
	if message == "" {
		message = err.GetPublicError().GetCode().String()
	}
	writeError(w, http.StatusBadGateway, errors.New(message))
	return true
}
