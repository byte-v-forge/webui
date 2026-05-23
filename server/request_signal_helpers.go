package main

import (
	"net/http"
	"strconv"
	"strings"

	"webui/server/pb"
)

func requestLastEventID(r *http.Request) int64 {
	value := strings.TrimSpace(r.Header.Get("Last-Event-ID"))
	if value == "" {
		value = strings.TrimSpace(r.URL.Query().Get("after_event_id"))
	}
	if value == "" {
		return 0
	}
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0
	}
	return id
}

func requestEmailSignalKind(r *http.Request) pb.EmailSignalKind {
	value := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("signal_kind")))
	if value == "" {
		value = strings.ToLower(strings.TrimSpace(r.URL.Query().Get("signal")))
	}
	switch value {
	case "", "otp", "code", "verification_code", "email_signal_kind_otp":
		return pb.EmailSignalKind_EMAIL_SIGNAL_KIND_OTP
	case "any", "all", "unspecified":
		return pb.EmailSignalKind_EMAIL_SIGNAL_KIND_UNSPECIFIED
	default:
		return pb.EmailSignalKind_EMAIL_SIGNAL_KIND_OTP
	}
}
