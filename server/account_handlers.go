package main

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"webui/server/pb"
)

type createAccountRequest struct {
	Email         string `json:"email"`
	Password      string `json:"password"`
	EmailStrategy string `json:"email_strategy"`
}

type updateAccountRequest struct {
	SessionToken      string  `json:"session_token"`
	AccessToken       string  `json:"access_token"`
	ActivationChannel *string `json:"activation_channel"`
}

func (s *server) handleAccounts(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		limit := int32(queryInt(r, "limit", 100))
		resp, err := s.accountClient.ListAccounts(r.Context(), &pb.ListAccountsRequest{
			Status: r.URL.Query().Get("status"),
			Limit:  limit,
		})
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		accounts := resp.GetAccounts()
		if accounts == nil {
			accounts = []*pb.Account{}
		}
		writeJSON(w, http.StatusOK, accounts)
	case http.MethodPost:
		var req createAccountRequest
		if err := readJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		email := strings.TrimSpace(req.Email)
		emailStrategy, err := accountEmailStrategy(req.EmailStrategy, email)
		if err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		accountID := randomID()
		resp, err := s.accountWorkflowClient.CreateGPTAccount(r.Context(), &pb.CreateGPTAccountRequest{
			AccountId:     accountID,
			Email:         email,
			Password:      req.Password,
			EmailStrategy: emailStrategy,
		})
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		if resp.GetErrorMessage() != "" {
			writeError(w, http.StatusBadGateway, errors.New(resp.GetErrorMessage()))
			return
		}
		writeJSON(w, http.StatusCreated, resp.GetAccount())
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func accountEmailStrategy(value string, email string) (pb.AccountEmailStrategy, error) {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "cloudflare", "manual":
		if strings.TrimSpace(email) == "" {
			return pb.AccountEmailStrategy_ACCOUNT_EMAIL_STRATEGY_UNSPECIFIED, fmt.Errorf("%s strategy requires email", value)
		}
		return pb.AccountEmailStrategy_ACCOUNT_EMAIL_STRATEGY_EXPLICIT, nil
	case "outlook_primary":
		return pb.AccountEmailStrategy_ACCOUNT_EMAIL_STRATEGY_OUTLOOK_PRIMARY, nil
	case "outlook_alias":
		return pb.AccountEmailStrategy_ACCOUNT_EMAIL_STRATEGY_OUTLOOK_ALIAS, nil
	case "":
		if strings.TrimSpace(email) != "" {
			return pb.AccountEmailStrategy_ACCOUNT_EMAIL_STRATEGY_EXPLICIT, nil
		}
		return pb.AccountEmailStrategy_ACCOUNT_EMAIL_STRATEGY_OUTLOOK_ALIAS, nil
	default:
		return pb.AccountEmailStrategy_ACCOUNT_EMAIL_STRATEGY_UNSPECIFIED, fmt.Errorf("unsupported email strategy: %s", value)
	}
}

func (s *server) handleAccount(w http.ResponseWriter, r *http.Request) {
	accountPath := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/accounts/"), "/")
	parts := strings.Split(accountPath, "/")
	accountID := parts[0]
	if accountID == "" {
		writeError(w, http.StatusBadRequest, errors.New("account_id is required"))
		return
	}
	if len(parts) > 1 {
		if len(parts) == 2 && parts[1] == "access-token" {
			s.handleAccountAccessToken(w, r, accountID)
			return
		}
		if len(parts) == 2 && parts[1] == "checkout-link" {
			s.handleAccountCheckoutLink(w, r, accountID)
			return
		}
		if len(parts) == 3 && parts[1] == "mailbox" && parts[2] == "inbox" {
			s.handleAccountMailboxInbox(w, r, accountID)
			return
		}
		writeError(w, http.StatusNotFound, errors.New("account endpoint not found"))
		return
	}

	switch r.Method {
	case http.MethodGet:
		resp, err := s.accountClient.GetAccount(r.Context(), &pb.GetAccountRequest{AccountId: accountID})
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		writeJSON(w, http.StatusOK, resp.GetAccount())
	case http.MethodPatch, http.MethodPut:
		var req updateAccountRequest
		if err := readJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		sessionToken, accessToken := normalizeAccountAuthInput(req.SessionToken, req.AccessToken)
		if sessionToken == "" && accessToken == "" && req.ActivationChannel == nil {
			writeError(w, http.StatusBadRequest, errors.New("session_token, access_token, or activation_channel is required"))
			return
		}
		account := &pb.Account{
			AccountId:    accountID,
			SessionToken: sessionToken,
			AccessToken:  accessToken,
		}
		if req.ActivationChannel != nil {
			activationChannel := strings.TrimSpace(*req.ActivationChannel)
			account.ActivationChannel = &activationChannel
		}
		resp, err := s.accountClient.UpdateAccount(r.Context(), &pb.UpdateAccountRequest{Account: account})
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		writeJSON(w, http.StatusOK, resp.GetAccount())
	case http.MethodDelete:
		resp, err := s.accountClient.DeleteAccount(r.Context(), &pb.DeleteAccountRequest{AccountId: accountID})
		if err != nil {
			writeError(w, http.StatusBadGateway, err)
			return
		}
		writeJSON(w, http.StatusOK, resp)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
