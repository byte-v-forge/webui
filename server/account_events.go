package main

import (
	"context"
	"errors"
	"net/http"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"webui/server/pb"
)

func (s *server) streamAccountEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	sse, err := newSSEWriter(w)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	sse.Start()

	after := requestLastEventID(r)
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		latest, err := s.emitAccountEvents(r.Context(), sse, after)
		if err != nil {
			if errors.Is(r.Context().Err(), context.Canceled) || status.Code(err) == codes.Canceled {
				return
			}
			sse.Error(err)
			return
		}
		if latest > after {
			after = latest
		}
		sse.Comment("keepalive")
		select {
		case <-r.Context().Done():
			return
		case <-ticker.C:
		}
	}
}

func (s *server) emitAccountEvents(ctx context.Context, sse *sseWriter, after int64) (int64, error) {
	resp, err := s.accountClient.ListAccounts(ctx, &pb.ListAccountsRequest{Limit: 500})
	if err != nil {
		return after, err
	}
	latest := after
	for _, account := range resp.GetAccounts() {
		if account.GetUpdatedAt() <= after {
			continue
		}
		if account.GetUpdatedAt() > latest {
			latest = account.GetUpdatedAt()
		}
		sse.Event(account.GetUpdatedAt(), "account", account)
	}
	return latest, nil
}
