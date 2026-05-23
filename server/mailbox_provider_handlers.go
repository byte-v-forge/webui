package main

import (
	"errors"
	"net/http"

	"webui/server/pb"
)

func (s *server) handleMailboxDomains(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		resp, err := s.mailboxClient.ListMailboxDomains(r.Context(), &pb.ListMailboxDomainsRequest{})
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		if resp.GetErrorMessage() != "" {
			writeError(w, http.StatusBadGateway, errors.New(resp.GetErrorMessage()))
			return
		}
		writeJSON(w, http.StatusOK, resp.GetDomains())
	case http.MethodPost:
		var req pb.SyncMailboxDomainsRequest
		if err := readProtoJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		resp, err := s.mailboxClient.SyncMailboxDomains(r.Context(), &req)
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		if resp.GetErrorMessage() != "" {
			writeError(w, http.StatusBadGateway, errors.New(resp.GetErrorMessage()))
			return
		}
		writeProtoJSON(w, http.StatusOK, resp)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *server) handleMailboxProviderCapabilities(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	resp, err := s.mailboxClient.ListMailboxProviderCapabilities(r.Context(), &pb.ListMailboxProviderCapabilitiesRequest{})
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}
	if resp.GetErrorMessage() != "" {
		writeError(w, http.StatusBadGateway, errors.New(resp.GetErrorMessage()))
		return
	}
	writeJSON(w, http.StatusOK, resp.GetProviders())
}
