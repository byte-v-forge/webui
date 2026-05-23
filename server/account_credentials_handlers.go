package main

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"webui/server/pb"
)

func (s *server) handleAccountAccessToken(w http.ResponseWriter, r *http.Request, accountID string) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	accountResp, err := s.accountClient.GetAccount(ctx, &pb.GetAccountRequest{AccountId: accountID})
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}
	account := accountResp.GetAccount()
	if account == nil {
		writeError(w, http.StatusNotFound, errors.New("account not found"))
		return
	}
	sessionToken := strings.TrimSpace(account.GetSessionToken())
	if sessionToken == "" {
		writeError(w, http.StatusBadRequest, errors.New("session_token is required"))
		return
	}

	accessToken, err := fetchChatGPTAccessToken(ctx, sessionToken)
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}
	updated, err := s.accountClient.UpdateAccount(ctx, &pb.UpdateAccountRequest{Account: &pb.Account{
		AccountId:   accountID,
		AccessToken: accessToken,
	}})
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}
	writeJSON(w, http.StatusOK, updated.GetAccount())
}

func (s *server) handleAccountCheckoutLink(w http.ResponseWriter, r *http.Request, accountID string) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancel()

	accountResp, err := s.accountClient.GetAccount(ctx, &pb.GetAccountRequest{AccountId: accountID})
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}
	account := accountResp.GetAccount()
	if account == nil {
		writeError(w, http.StatusNotFound, errors.New("account not found"))
		return
	}

	sessionToken := strings.TrimSpace(account.GetSessionToken())
	accessToken := strings.TrimSpace(account.GetAccessToken())
	if sessionToken == "" && accessToken == "" {
		writeError(w, http.StatusBadRequest, errors.New("session_token or access_token is required"))
		return
	}

	resp, err := s.paymentClient.CreateCheckoutLink(ctx, &pb.CreateCheckoutLinkRequest{
		Credential: paymentCredential(sessionToken, accessToken),
	})
	if err != nil {
		writeError(w, http.StatusBadGateway, err)
		return
	}
	if !resp.GetSuccess() || resp.GetErrorMessage() != "" {
		msg := strings.TrimSpace(resp.GetErrorMessage())
		if msg == "" {
			msg = "checkout link creation failed"
		}
		writeError(w, http.StatusBadGateway, errors.New(msg))
		return
	}
	writeJSON(w, http.StatusOK, resp)
}
