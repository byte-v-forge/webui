package main

import "net/http"

type routeBinding struct {
	path    string
	handler http.HandlerFunc
}

func (s *server) routes() http.Handler {
	mux := http.NewServeMux()
	for _, route := range s.routeBindings() {
		mux.HandleFunc(route.path, route.handler)
	}
	return mux
}

func (s *server) routeBindings() []routeBinding {
	return []routeBinding{
		{"/api/health", s.handleHealth},
		{"/api/service-status", s.handleServiceStatus},
		{"/api/accounts/events", s.streamAccountEvents},
		{"/api/accounts/mailbox/sync", s.handleAccountMailboxSync},
		{"/api/accounts", s.handleAccounts},
		{"/api/accounts/", s.handleAccount},
		{"/api/mailboxes/register", s.handleMailboxRegister},
		{"/api/mailboxes/oauth", s.handleMailboxOAuth},
		{"/api/mailboxes/inbox", s.handleMailboxInbox},
		{"/api/mailboxes/events", s.streamMailboxEvents},
		{"/api/mailbox-domains", s.handleMailboxDomains},
		{"/api/mailbox-provider-capabilities", s.handleMailboxProviderCapabilities},
		{"/api/mailbox-operations/", s.handleMailboxOperation},
		{"/api/mailbox-operations", s.handleMailboxOperations},
		{"/api/mailboxes/", s.handleMailbox},
		{"/api/mailboxes", s.handleMailboxes},
		{"/api/sms/provider-plugins", s.handleSMSProviderPlugins},
		{"/api/sms/provider-configs/", s.handleSMSProviderConfig},
		{"/api/sms/provider-configs", s.handleSMSProviderConfigs},
		{"/api/sms/route-options", s.handleSMSRouteOptions},
		{"/api/sms/route-profiles/", s.handleSMSRouteProfile},
		{"/api/sms/route-profiles", s.handleSMSRouteProfiles},
		{"/api/sms/activations/", s.handleSMSActivation},
		{"/api/sms/activations", s.handleSMSActivations},
		{"/api/gpt-email-allocations", s.handleGPTEmailAllocations},
		{"/api/jobs", s.handleJobs},
		{"/api/jobs/events", s.streamJobsEvents},
		{"/api/jobs/", s.handleJob},
		{"/api/proxy-runtime/", s.handleProxyRuntime},
		{"/api/gopay/state", s.handleGoPayState},
		{"/api/gopay/profile", s.handleGoPayProfile},
		{"/api/gopay/user/", s.handleGoPayUserAction},
		{"/api/workflows/register-protocol", s.handleRegisterProtocol},
		{"/api/workflows/register", s.handleRegister},
		{"/api/workflows/activate", s.handleActivate},
		{"/api/workflows/autopay", s.handleAutopay},
		{"/api/workflows/login-protocol", s.handleLoginProtocol},
		{"/api/workflows/login", s.handleLogin},
		{"/api/workflows/codex-oauth", s.handleCodexOAuth},
		{"/api/workflows/codex-oauth-protocol", s.handleCodexOAuthProtocol},
		{"/api/workflows/codex-oauth-add-phone/batch", s.handleCodexOAuthBatchAddPhone},
		{"/api/workflows/codex-oauth-add-phone", s.handleCodexOAuthAddPhone},
		{"/api/workflows/probe", s.handleProbeAccount},
		{"/api/workflows/gopay-app", s.handleGoPayApp},
		{"/api/workflows/gopay-qris-payment-activate", s.handleGoPayQRISPaymentActivate},
		{"/api/workflows/gopay-wa-payment", s.handleGoPayWAPayment},
		{"/api/workflows/gopay-payment/rebind", s.handleGoPayPaymentRebind},
		{"/api/workflows/gopay-payment", s.handleGoPayPayment},
		{"/api/workflows/register-and-activate", s.handleRegisterAndActivate},
		{"/", s.handleStatic},
	}
}
