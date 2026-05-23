package main

import (
	"errors"
	"net/http"
	"strings"

	"webui/server/pb"
)

func (s *server) handleSMSProviderConfigs(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		resp, err := s.smsAdminClient.ListProviderConfigs(r.Context(), &pb.ListProviderConfigsRequest{
			IncludeDisabled: queryBool(r, "include_disabled", true),
			ProviderKey:     strings.TrimSpace(r.URL.Query().Get("provider_key")),
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
		var req pb.UpsertProviderConfigRequest
		if err := readProtoJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		resp, err := s.smsAdminClient.UpsertProviderConfig(r.Context(), &req)
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

func (s *server) handleSMSProviderConfig(w http.ResponseWriter, r *http.Request) {
	id, action, ok := splitSMSPath(r.URL.Path, "/api/sms/provider-configs/")
	if !ok {
		writeError(w, http.StatusBadRequest, errors.New("provider_config_id is required"))
		return
	}
	switch {
	case r.Method == http.MethodGet && action == "":
		resp, err := s.smsAdminClient.GetProviderConfig(r.Context(), &pb.GetProviderConfigRequest{ProviderConfigId: id})
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		if writeProviderError(w, resp.GetError()) {
			return
		}
		writeProtoJSON(w, http.StatusOK, resp)
	case r.Method == http.MethodDelete && action == "":
		resp, err := s.smsAdminClient.DeleteProviderConfig(r.Context(), &pb.DeleteProviderConfigRequest{ProviderConfigId: id})
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		if writeProviderError(w, resp.GetError()) {
			return
		}
		writeProtoJSON(w, http.StatusOK, resp)
	case r.Method == http.MethodGet && action == "balance":
		resp, err := s.smsAdminClient.GetProviderBalance(r.Context(), &pb.GetProviderBalanceRequest{ProviderConfigId: id})
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		if writeProviderError(w, resp.GetError()) {
			return
		}
		writeProtoJSON(w, http.StatusOK, resp)
	case r.Method == http.MethodGet && action == "route-options":
		resp, err := s.smsAdminClient.ListRouteOptions(r.Context(), &pb.ListRouteOptionsRequest{ProviderConfigId: id})
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
