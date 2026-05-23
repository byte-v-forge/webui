package main

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"webui/server/pb"
)

func (s *server) streamJobsEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	stream, err := s.jobClient.WatchJobs(r.Context(), &pb.WatchJobsRequest{
		JobIds: requestJobIDs(r),
		Status: strings.TrimSpace(r.URL.Query().Get("status")),
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
		event, err := stream.Recv()
		if err != nil {
			if !errors.Is(err, io.EOF) && status.Code(err) != codes.Canceled {
				sse.Error(err)
			}
			return
		}
		if event.GetErrorMessage() != "" {
			sse.Error(errors.New(event.GetErrorMessage()))
			return
		}
		jobEvent := event.GetEvent()
		if jobEvent == nil {
			continue
		}
		sse.Event(jobEvent.GetEventId(), "job", jobEvent)
	}
}

func sseJSON(value any) string {
	b, err := json.Marshal(value)
	if err != nil {
		b, _ = json.Marshal(map[string]string{"error": err.Error()})
	}
	return string(b)
}

func requestJobIDs(r *http.Request) []string {
	query := r.URL.Query()
	values := append([]string{}, query["job_id"]...)
	values = append(values, query["job_ids"]...)
	out := []string{}
	seen := map[string]struct{}{}
	for _, value := range values {
		for _, part := range strings.Split(value, ",") {
			part = strings.TrimSpace(part)
			if part == "" {
				continue
			}
			if _, ok := seen[part]; ok {
				continue
			}
			seen[part] = struct{}{}
			out = append(out, part)
		}
	}
	return out
}
