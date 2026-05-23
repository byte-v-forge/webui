package main

import (
	"errors"
	"net/http"
	"strings"

	"webui/server/pb"
)

func (s *server) handleSMSRouteOptions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	resp, err := s.smsAdminClient.ListRouteOptions(r.Context(), &pb.ListRouteOptionsRequest{
		ProviderConfigId: strings.TrimSpace(r.URL.Query().Get("provider_config_id")),
		ProviderKey:      strings.TrimSpace(r.URL.Query().Get("provider_key")),
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

func (s *server) handleSMSRouteProfiles(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		resp, err := s.smsAdminClient.ListRouteProfiles(r.Context(), &pb.ListRouteProfilesRequest{
			IncludeDisabled: queryBool(r, "include_disabled", true),
		})
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		if writeProviderError(w, resp.GetError()) {
			return
		}
		writeProtoJSON(w, http.StatusOK, resp)
	case http.MethodPost:
		var req pb.UpsertRouteProfileRequest
		if err := readProtoJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		resp, err := s.smsAdminClient.UpsertRouteProfile(r.Context(), &req)
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		if writeProviderError(w, resp.GetError()) {
			return
		}
		writeProtoJSON(w, http.StatusOK, resp)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *server) handleSMSRouteProfile(w http.ResponseWriter, r *http.Request) {
	key, action, ok := splitSMSPath(r.URL.Path, "/api/sms/route-profiles/")
	if !ok || action != "" {
		writeError(w, http.StatusBadRequest, errors.New("profile_key is required"))
		return
	}
	switch r.Method {
	case http.MethodGet:
		resp, err := s.smsAdminClient.GetRouteProfile(r.Context(), &pb.GetRouteProfileRequest{ProfileKey: key})
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		if writeProviderError(w, resp.GetError()) {
			return
		}
		writeProtoJSON(w, http.StatusOK, resp)
	case http.MethodDelete:
		resp, err := s.smsAdminClient.DeleteRouteProfile(r.Context(), &pb.DeleteRouteProfileRequest{ProfileKey: key})
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		if writeProviderError(w, resp.GetError()) {
			return
		}
		writeProtoJSON(w, http.StatusOK, resp)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
