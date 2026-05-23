package main

import (
	"errors"
	"net/http"
	"strings"

	"webui/server/pb"
)

func (s *server) handleMailboxOperations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	resp, err := s.mailboxClient.ListMailboxOperations(r.Context(), &pb.ListMailboxOperationsRequest{
		Limit:        int32(queryInt(r, "limit", 50)),
		Status:       strings.TrimSpace(r.URL.Query().Get("status")),
		Action:       strings.TrimSpace(r.URL.Query().Get("action")),
		EmailAddress: strings.TrimSpace(r.URL.Query().Get("email_address")),
	})
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}
	if resp.GetErrorMessage() != "" {
		writeError(w, http.StatusBadGateway, errors.New(resp.GetErrorMessage()))
		return
	}
	operations := resp.GetOperations()
	if operations == nil {
		operations = []*pb.MailboxOperation{}
	}
	writeJSON(w, http.StatusOK, operations)
}

func (s *server) handleMailboxOperation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	operationID := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/mailbox-operations/"), "/")
	if operationID == "" {
		writeError(w, http.StatusBadRequest, errors.New("operation_id is required"))
		return
	}
	resp, err := s.mailboxClient.GetMailboxOperation(r.Context(), &pb.GetMailboxOperationRequest{OperationId: operationID})
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}
	if resp.GetErrorMessage() != "" {
		writeError(w, http.StatusNotFound, errors.New(resp.GetErrorMessage()))
		return
	}
	writeJSON(w, http.StatusOK, resp.GetOperation())
}
