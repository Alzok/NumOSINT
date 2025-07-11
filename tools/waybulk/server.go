package main

import (
	"bufio"
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
	"strings"
)

type LookupRequest struct {
	Domain string `json:"domain"`
}

func lookupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LookupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Domain == "" {
		http.Error(w, "Domain is required", http.StatusBadRequest)
		return
	}

	cmd := exec.Command("waybulk", req.Domain)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Printf("Error creating stdout pipe: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if err := cmd.Start(); err != nil {
		log.Printf("Error starting command: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var urls []string
	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		urls = append(urls, strings.TrimSpace(scanner.Text()))
	}

	if err := cmd.Wait(); err != nil {
		log.Printf("Command finished with error: %v", err)
		// Do not return error to client, as waybulk might still output some URLs
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(urls); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func main() {
	http.HandleFunc("/lookup", lookupHandler)
	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Could not start server: %s\n", err)
	}
}