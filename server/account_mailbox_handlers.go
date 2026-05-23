package main

import (
	"context"
	"net/http"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"webui/server/pb"
)

type accountMailboxSyncRequest struct {
	LimitPerMailbox int32 `json:"limit_per_mailbox"`
	AccountLimit    int32 `json:"account_limit"`
}

func (s *server) handleAccountMailboxInbox(w http.ResponseWriter, r *http.Request, accountID string) {
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

	timeout := envInt("ACCOUNT_MAILBOX_INBOX_TIMEOUT_SECONDS", envInt("MAILBOX_INBOX_TIMEOUT_SECONDS", 180))
	if timeout < 30 {
		timeout = 30
	}
	ctx, cancel := context.WithTimeout(r.Context(), time.Duration(timeout)*time.Second)
	defer cancel()

	resp, err := s.accountWorkflowClient.FetchAccountMailbox(ctx, &pb.FetchAccountMailboxRequest{
		AccountId:       accountID,
		LimitPerMailbox: req.LimitPerMailbox,
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

func (s *server) handleAccountMailboxSync(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req accountMailboxSyncRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if req.LimitPerMailbox <= 0 {
		req.LimitPerMailbox = 25
	}
	if req.LimitPerMailbox > 100 {
		req.LimitPerMailbox = 100
	}
	if req.AccountLimit <= 0 {
		req.AccountLimit = 500
	}
	if req.AccountLimit > 500 {
		req.AccountLimit = 500
	}
	timeout := envInt("ACCOUNT_MAILBOX_SYNC_TIMEOUT_SECONDS", 300)
	if timeout < 30 {
		timeout = 30
	}
	ctx, cancel := context.WithTimeout(r.Context(), time.Duration(timeout)*time.Second)
	defer cancel()
	resp, err := s.accountWorkflowClient.SyncAccountMailboxes(ctx, &pb.SyncAccountMailboxesRequest{
		LimitPerMailbox: req.LimitPerMailbox,
		AccountLimit:    req.AccountLimit,
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
