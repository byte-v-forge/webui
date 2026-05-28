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
		{"/healthz", s.handleHealth},
		{"/api/service-status", s.handleServiceStatus},
		{"/", s.handleStatic},
	}
}
