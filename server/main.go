package main

import (
	"log"
	"net/http"

	"github.com/byte-v-forge/common-lib/envx"
)

type server struct {
	dashboardServices *dashboardServiceRegistry
	staticDir         string
}

func main() {
	s := &server{
		dashboardServices: newDashboardServiceRegistry(envx.StringDefault("TRAEFIK_API_ADDR", defaultTraefikAPIAddr), loadDashboardCatalogServices()),
		staticDir:         envx.StringDefault("STATIC_DIR", "web/dist"),
	}

	addr := envx.StringDefault("LISTEN_ADDR", ":8080")
	log.Printf("dashboard shell listening on %s", addr)
	if err := http.ListenAndServe(addr, withCORS(s.routes())); err != nil {
		log.Fatal(err)
	}
}
