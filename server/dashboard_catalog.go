package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

const dashboardCatalogFile = "dashboard-catalog.json"

type dashboardCatalog struct {
	Services []string `json:"services"`
}

func loadDashboardCatalogServices() []string {
	for _, path := range dashboardCatalogPaths() {
		services, err := readDashboardCatalogServices(path)
		if err == nil {
			return services
		}
		if !os.IsNotExist(err) {
			log.Printf("dashboard catalog unavailable at %s: %v", path, err)
		}
	}
	return nil
}

func dashboardCatalogPaths() []string {
	return []string{
		filepath.Join(".", dashboardCatalogFile),
		filepath.Join("/app", dashboardCatalogFile),
	}
}

func readDashboardCatalogServices(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var catalog dashboardCatalog
	if err := json.NewDecoder(file).Decode(&catalog); err != nil {
		return nil, err
	}

	services := make([]string, 0, len(catalog.Services))
	for _, service := range catalog.Services {
		if service = strings.TrimSpace(service); service != "" {
			services = append(services, service)
		}
	}
	if len(services) == 0 {
		return nil, fmt.Errorf("dashboard catalog has no services")
	}
	return services, nil
}
