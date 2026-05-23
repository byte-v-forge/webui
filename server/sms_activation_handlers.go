package main

import (
	"errors"
	"net/http"

	"webui/server/pb"
)

func (s *server) handleSMSActivations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	resp, err := s.smsAdminClient.ListActivations(r.Context(), &pb.ListActivationsRequest{
		IncludeFinal: queryBool(r, "include_final", false),
		Limit:        int32(queryInt(r, "limit", 100)),
	})
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}
	if writeProviderError(w, resp.GetError()) {
		return
	}
	writeProtoJSON(w, http.StatusOK, resp)
}

func (s *server) handleSMSActivation(w http.ResponseWriter, r *http.Request) {
	id, action, ok := splitSMSPath(r.URL.Path, "/api/sms/activations/")
	if !ok || action != "cancel" {
		writeError(w, http.StatusNotFound, errors.New("sms activation action not found"))
		return
	}
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req pb.CancelProviderActivationRequest
	if err := readProtoJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	req.ActivationId = id
	resp, err := s.smsAdminClient.CancelActivation(r.Context(), &req)
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}
	if writeProviderError(w, resp.GetError()) {
		return
	}
	writeProtoJSON(w, http.StatusOK, resp)
}
