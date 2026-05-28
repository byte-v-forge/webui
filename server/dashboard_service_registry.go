package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	dashboardv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/dashboard/v1"
	"github.com/byte-v-forge/common-lib/httpx"
)

const defaultTraefikAPIAddr = "http://traefik:8080"

type dashboardServiceRegistry struct {
	client *traefikStatusClient
}

type traefikStatusClient struct {
	baseURL *url.URL
	http    *http.Client
}

func newDashboardServiceRegistry(apiAddr string) *dashboardServiceRegistry {
	client, err := newTraefikStatusClient(apiAddr)
	if err != nil {
		client, _ = newTraefikStatusClient(defaultTraefikAPIAddr)
	}
	return &dashboardServiceRegistry{client: client}
}

func newTraefikStatusClient(apiAddr string) (*traefikStatusClient, error) {
	apiAddr = strings.TrimSpace(apiAddr)
	if apiAddr == "" {
		apiAddr = defaultTraefikAPIAddr
	}
	baseURL, err := url.Parse(apiAddr)
	if err != nil {
		return nil, err
	}
	return &traefikStatusClient{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 2 * time.Second},
	}, nil
}

func (s *server) handleServiceStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	writeProtoJSON(w, http.StatusOK, s.dashboardServices.snapshot(r.Context()))
}

func (r *dashboardServiceRegistry) snapshot(ctx context.Context) *dashboardv1.DashboardServiceStatusResponse {
	checkedAt := time.Now().Unix()
	if r == nil || r.client == nil {
		return &dashboardv1.DashboardServiceStatusResponse{Services: []*dashboardv1.DashboardServiceStatus{traefikUnavailable(checkedAt, "Traefik API is not configured")}}
	}
	services, err := r.client.statuses(ctx, checkedAt)
	if err != nil {
		return &dashboardv1.DashboardServiceStatusResponse{Services: []*dashboardv1.DashboardServiceStatus{traefikUnavailable(checkedAt, err.Error())}}
	}
	return &dashboardv1.DashboardServiceStatusResponse{Services: services}
}

func (c *traefikStatusClient) statuses(ctx context.Context, checkedAt int64) ([]*dashboardv1.DashboardServiceStatus, error) {
	merged := map[string]*dashboardv1.DashboardServiceStatus{}
	var errs []string
	for _, endpoint := range []string{"/api/http/services", "/api/tcp/services"} {
		items, err := c.fetchServiceItems(ctx, endpoint)
		if err != nil {
			errs = append(errs, err.Error())
			continue
		}
		for _, item := range items {
			status := traefikServiceStatus(item, checkedAt)
			if status.GetName() == "" {
				continue
			}
			mergeDashboardServiceStatus(merged, status)
		}
	}
	if len(merged) == 0 && len(errs) > 0 {
		return nil, fmt.Errorf("read Traefik services: %s", strings.Join(errs, "; "))
	}
	services := make([]*dashboardv1.DashboardServiceStatus, 0, len(merged))
	for _, status := range merged {
		services = append(services, status)
	}
	sort.Slice(services, func(i, j int) bool { return services[i].GetName() < services[j].GetName() })
	return services, nil
}

func (c *traefikStatusClient) fetchServiceItems(ctx context.Context, endpoint string) ([]map[string]any, error) {
	target := c.baseURL.ResolveReference(&url.URL{Path: endpoint})
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := httpx.ReadLimited(resp.Body, 512)
		return nil, fmt.Errorf("%s: %s %s", endpoint, resp.Status, strings.TrimSpace(string(body)))
	}
	var items []map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, fmt.Errorf("%s: %w", endpoint, err)
	}
	return items, nil
}

func traefikServiceStatus(item map[string]any, checkedAt int64) *dashboardv1.DashboardServiceStatus {
	name := normalizeTraefikServiceName(stringField(item, "name"))
	status := &dashboardv1.DashboardServiceStatus{
		Name:          name,
		Status:        dashboardv1.DashboardServiceStatusState_DASHBOARD_SERVICE_AVAILABLE,
		CheckedAtUnix: checkedAt,
	}
	messages := errorMessages(item)
	serverStatus := mapField(item, "serverStatus")
	for server, value := range serverStatus {
		serverState := strings.ToLower(strings.TrimSpace(fmt.Sprint(value)))
		if serverState == "" || serverState == "up" {
			continue
		}
		messages = append(messages, fmt.Sprintf("%s %s", server, serverState))
	}
	state := strings.ToLower(strings.TrimSpace(stringField(item, "status")))
	if isUnavailableTraefikState(state) || len(messages) > 0 {
		status.Status = dashboardv1.DashboardServiceStatusState_DASHBOARD_SERVICE_UNAVAILABLE
		status.Message = strings.Join(messages, "; ")
		if status.Message == "" {
			status.Message = state
		}
	}
	return status
}

func mergeDashboardServiceStatus(target map[string]*dashboardv1.DashboardServiceStatus, next *dashboardv1.DashboardServiceStatus) {
	current := target[next.GetName()]
	if current == nil || next.GetStatus() == dashboardv1.DashboardServiceStatusState_DASHBOARD_SERVICE_UNAVAILABLE {
		target[next.GetName()] = next
		return
	}
	if current.GetMessage() == "" && next.GetMessage() != "" {
		current.Message = next.GetMessage()
	}
}

func normalizeTraefikServiceName(name string) string {
	name = strings.TrimSpace(name)
	if before, _, ok := strings.Cut(name, "@"); ok {
		name = before
	}
	if after, ok := strings.CutPrefix(name, "default/"); ok {
		name = after
	}
	if slash := strings.LastIndex(name, "/"); slash >= 0 && slash+1 < len(name) {
		name = name[slash+1:]
	}
	return stableDashboardServiceName(name)
}

func stableDashboardServiceName(name string) string {
	name = strings.TrimSpace(name)
	for _, component := range dashboardServiceComponents() {
		if name == component || strings.Contains(name, component) {
			return component
		}
	}
	return strings.TrimPrefix(name, "byte-v-forge-")
}

func dashboardServiceComponents() []string {
	return []string{
		"browser-automation",
		"proxy-runtime-protocol",
		"proxy-runtime",
		"workflow-runtime",
		"gpt-service",
		"sms-service",
		"n8n-webhook",
		"n8n-main",
		"mailbox",
		"webui",
	}
}

func errorMessages(item map[string]any) []string {
	var messages []string
	for _, key := range []string{"error", "errors"} {
		switch value := item[key].(type) {
		case string:
			if strings.TrimSpace(value) != "" {
				messages = append(messages, strings.TrimSpace(value))
			}
		case []any:
			for _, entry := range value {
				if text := strings.TrimSpace(fmt.Sprint(entry)); text != "" {
					messages = append(messages, text)
				}
			}
		}
	}
	return messages
}

func stringField(item map[string]any, key string) string {
	if value, ok := item[key].(string); ok {
		return value
	}
	return ""
}

func mapField(item map[string]any, key string) map[string]any {
	value, _ := item[key].(map[string]any)
	return value
}

func isUnavailableTraefikState(state string) bool {
	switch state {
	case "disabled", "down", "error", "failed", "unhealthy", "warning":
		return true
	default:
		return false
	}
}

func traefikUnavailable(checkedAt int64, message string) *dashboardv1.DashboardServiceStatus {
	return &dashboardv1.DashboardServiceStatus{
		Name:          "traefik",
		Status:        dashboardv1.DashboardServiceStatusState_DASHBOARD_SERVICE_UNAVAILABLE,
		Message:       message,
		CheckedAtUnix: checkedAt,
	}
}
