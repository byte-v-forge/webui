package main

import (
	"log"
	"net/http"

	"webui/server/pb"
)

type server struct {
	accountClient         pb.AccountDatabaseServiceClient
	accountWorkflowClient pb.AccountWorkflowServiceClient
	paymentWorkflowClient pb.PaymentWorkflowServiceClient
	gopayAppClient        pb.GoPayAppWorkflowServiceClient
	mailboxClient         pb.MailboxServiceClient
	smsAdminClient        pb.SmsProviderAdminServiceClient
	otpClient             pb.OTPServiceClient
	jobClient             pb.JobServiceClient
	paymentClient         pb.PaymentServiceClient
	dashboardServices     *dashboardServiceRegistry
	proxyRuntimeProxy     http.Handler
	staticDir             string
}

func main() {
	accountConn, err := newGRPCClient(envDefault("GPT_ACCOUNT_ADDR", "gpt-service:50052"))
	if err != nil {
		log.Fatalf("connect gpt account API: %v", err)
	}
	defer accountConn.Close()

	workflowConn, err := newGRPCClient(envDefault("GPT_WORKFLOW_ADDR", "gpt-service:50051"))
	if err != nil {
		log.Fatalf("connect gpt workflow API: %v", err)
	}
	defer workflowConn.Close()

	paymentConn, err := newGRPCClient(envDefault("GPT_PAYMENT_ADDR", "gpt-service:50054"))
	if err != nil {
		log.Fatalf("connect gpt payment API: %v", err)
	}
	defer paymentConn.Close()

	mailboxConn, err := newGRPCClient(envDefault("MAILBOX_ADDR", "mailbox:50051"))
	if err != nil {
		log.Fatalf("connect mailbox: %v", err)
	}
	defer mailboxConn.Close()

	smsConn, err := newGRPCClient(envDefault("SMS_ADDR", "sms-service:50051"))
	if err != nil {
		log.Fatalf("connect sms: %v", err)
	}
	defer smsConn.Close()

	s := &server{
		accountClient:         pb.NewAccountDatabaseServiceClient(accountConn),
		accountWorkflowClient: pb.NewAccountWorkflowServiceClient(workflowConn),
		paymentWorkflowClient: pb.NewPaymentWorkflowServiceClient(workflowConn),
		gopayAppClient:        pb.NewGoPayAppWorkflowServiceClient(workflowConn),
		mailboxClient:         pb.NewMailboxServiceClient(mailboxConn),
		smsAdminClient:        pb.NewSmsProviderAdminServiceClient(smsConn),
		otpClient:             pb.NewOTPServiceClient(workflowConn),
		jobClient:             pb.NewJobServiceClient(workflowConn),
		paymentClient:         pb.NewPaymentServiceClient(paymentConn),
		dashboardServices:     newDashboardServiceRegistry(loadDashboardServiceStatusConfig()),
		proxyRuntimeProxy:     newHTTPReverseProxy(envDefault("PROXY_RUNTIME_HTTP_ADDR", "http://proxy-runtime:8080")),
		staticDir:             envDefault("STATIC_DIR", "web/dist"),
	}

	addr := envDefault("LISTEN_ADDR", ":8080")
	log.Printf("dashboard listening on %s", addr)
	if err := http.ListenAndServe(addr, withCORS(s.routes())); err != nil {
		log.Fatal(err)
	}
}
