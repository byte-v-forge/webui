package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"webui/server/pb"
)

func fetchChatGPTAccessToken(ctx context.Context, sessionToken string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://chatgpt.com/api/auth/session", nil)
	if err != nil {
		return "", err
	}
	cookieHeader := chatGPTSessionCookieHeader(sessionToken)
	if cookieHeader == "" {
		return "", errors.New("session_token is required")
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Referer", "https://chatgpt.com/")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36")
	req.Header.Set("Cookie", cookieHeader)

	resp, err := (&http.Client{Timeout: 25 * time.Second}).Do(req)
	if err != nil {
		return "", fmt.Errorf("fetch auth session: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("auth session returned status %d", resp.StatusCode)
	}

	var payload struct {
		AccessToken string `json:"accessToken"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return "", fmt.Errorf("decode auth session: %w", err)
	}
	accessToken := strings.TrimSpace(payload.AccessToken)
	if accessToken == "" {
		return "", errors.New("auth session did not return access token")
	}
	return accessToken, nil
}

func normalizeAccountAuthInput(sessionInput, accessInput string) (string, string) {
	sessionToken := strings.TrimSpace(sessionInput)
	accessToken := extractAccessToken(accessInput)
	if payloadSession, payloadAccess := authSessionJSONTokens(sessionToken); payloadSession != "" || payloadAccess != "" {
		if payloadSession != "" {
			sessionToken = payloadSession
		}
		if accessToken == "" {
			accessToken = payloadAccess
		}
	}
	if payloadSession, payloadAccess := authSessionJSONTokens(accessInput); payloadSession != "" || payloadAccess != "" {
		if sessionToken == "" {
			sessionToken = payloadSession
		}
		if payloadAccess != "" {
			accessToken = payloadAccess
		}
	}
	if parsedSession := extractSessionToken(sessionToken); parsedSession != "" {
		sessionToken = parsedSession
	}
	return strings.TrimSpace(sessionToken), strings.TrimSpace(accessToken)
}

func authSessionJSONTokens(raw string) (string, string) {
	text := strings.TrimSpace(raw)
	if !strings.HasPrefix(text, "{") {
		return "", ""
	}
	var payload struct {
		SessionToken string `json:"sessionToken"`
		AccessToken  string `json:"accessToken"`
	}
	if err := json.Unmarshal([]byte(text), &payload); err != nil {
		return "", ""
	}
	return strings.TrimSpace(payload.SessionToken), strings.TrimSpace(payload.AccessToken)
}

func extractAccessToken(raw string) string {
	text := strings.TrimSpace(raw)
	if _, accessToken := authSessionJSONTokens(text); accessToken != "" {
		return accessToken
	}
	return text
}

func paymentCredential(sessionToken, accessToken string) *pb.ChatGPTCredential {
	accessToken = strings.TrimSpace(accessToken)
	if accessToken != "" {
		return &pb.ChatGPTCredential{
			AccessToken: accessToken,
		}
	}
	sessionToken = strings.TrimSpace(sessionToken)
	if sessionToken != "" {
		return &pb.ChatGPTCredential{
			SessionToken: sessionToken,
		}
	}
	return nil
}
