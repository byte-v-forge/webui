package main

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"webui/server/pb"
)

func (s *server) handleMailboxRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	resp, err := s.mailboxClient.RegisterMailbox(ctx, &pb.RegisterMailboxRequest{})
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}

	writeMailboxOperationStart(w, resp)
}

func (s *server) handleMailboxOAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req mailboxOAuthRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if req.Limit <= 0 {
		req.Limit = 100
	}
	if strings.TrimSpace(req.EmailAddress) == "" {
		req.OnlyMissing = true
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	resp, err := s.mailboxClient.RunMailboxOAuth(ctx, &pb.StartMailboxOAuthRequest{
		EmailAddress: strings.TrimSpace(req.EmailAddress),
		OnlyMissing:  req.OnlyMissing,
		Limit:        req.Limit,
	})
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}
	writeMailboxOperationStart(w, resp)
}

func (s *server) handleMailboxInbox(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req mailboxInboxRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if req.LimitPerMailbox <= 0 {
		req.LimitPerMailbox = 10
	}
	if req.LimitPerMailbox > 100 {
		req.LimitPerMailbox = 100
	}
	if req.MaxMailboxes <= 0 {
		req.MaxMailboxes = 100
	}
	if req.MaxMailboxes > 500 {
		req.MaxMailboxes = 500
	}

	timeout := envInt("MAILBOX_INBOX_TIMEOUT_SECONDS", 180)
	if timeout < 30 {
		timeout = 30
	}
	ctx, cancel := context.WithTimeout(r.Context(), time.Duration(timeout)*time.Second)
	defer cancel()

	resp, err := s.mailboxClient.FetchMailboxInboxes(ctx, &pb.FetchMailboxInboxesRequest{
		LimitPerMailbox: req.LimitPerMailbox,
		MaxMailboxes:    req.MaxMailboxes,
		EmailAddress:    strings.TrimSpace(req.EmailAddress),
		ParserProfile:   strings.TrimSpace(req.ParserProfile),
	})
	if err != nil {
		if status.Code(err) == codes.DeadlineExceeded {
			writeError(w, http.StatusGatewayTimeout, err)
			return
		}
		writeError(w, http.StatusBadGateway, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (s *server) streamMailboxEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	email := strings.TrimSpace(r.URL.Query().Get("email_address"))
	if email == "" {
		email = strings.TrimSpace(r.URL.Query().Get("email"))
	}
	if email == "" {
		writeError(w, http.StatusBadRequest, errors.New("email_address is required"))
		return
	}

	stream, err := s.mailboxClient.StreamMailboxEmailEvents(r.Context(), &pb.StreamMailboxEmailEventsRequest{
		EmailAddress:   email,
		SubjectKeyword: strings.TrimSpace(r.URL.Query().Get("subject_keyword")),
		ParserProfile:  strings.TrimSpace(r.URL.Query().Get("parser_profile")),
		SignalKind:     requestEmailSignalKind(r),
	})
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}

	sse, err := newSSEWriter(w)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	sse.Start()

	for {
		resp, err := stream.Recv()
		if err != nil {
			if errors.Is(r.Context().Err(), context.Canceled) || status.Code(err) == codes.Canceled {
				return
			}
			sse.Error(err)
			return
		}
		message := resp.GetMessage()
		if message != nil {
			eventID := message.GetReceivedAtUnix()
			if eventID <= 0 {
				eventID = time.Now().Unix()
			}
			eventEmail := strings.TrimSpace(resp.GetEmailAddress())
			if eventEmail == "" {
				eventEmail = email
			}
			sse.Event(eventID, "email", map[string]any{
				"email_address": eventEmail,
				"message":       message,
			})
		}
	}
}

type mailboxOperationStartResponse interface {
	GetStarted() bool
	GetOperationId() string
	GetErrorMessage() string
}

func writeMailboxOperationStart(w http.ResponseWriter, resp mailboxOperationStartResponse) {
	statusCode := http.StatusAccepted
	if !resp.GetStarted() || resp.GetErrorMessage() != "" {
		statusCode = http.StatusBadGateway
	}
	writeJSON(w, statusCode, map[string]any{
		"started":       resp.GetStarted(),
		"operation_id":  resp.GetOperationId(),
		"error_message": resp.GetErrorMessage(),
		"backend":       "mailbox",
	})
}
