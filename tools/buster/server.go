package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
	"strings"
)

type ScanRequest struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Domain    string `json:"domain"`
}

type ScanResult struct {
	Emails []string `json:"emails"`
}

type ReverseWhoisRequest struct {
	Email string `json:"email"`
}

type ReverseWhoisResult struct {
	Domains []string `json:"domains"`
}

func reverseWhoisHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ReverseWhoisRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		http.Error(w, "email is required", http.StatusBadRequest)
		return
	}

	cmd := exec.Command("buster", "-e", req.Email, "-s", "reversewhois")
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Buster reverse whois execution finished with an error for '%s': %v\nOutput: %s", req.Email, err, string(output))
		// Buster peut échouer s'il ne trouve rien, on retourne un tableau vide.
		json.NewEncoder(w).Encode(ReverseWhoisResult{Domains: []string{}})
		return
	}

	// La sortie de Buster n'est pas du JSON, il faut la parser.
	lines := strings.Split(string(output), "\n")
	var domains []string
	for _, line := range lines {
		if strings.HasPrefix(line, "[+]") && strings.Contains(line, "Found:") {
			parts := strings.Split(line, "Found:")
			if len(parts) > 1 {
				domain := strings.TrimSpace(parts[1])
				domains = append(domains, domain)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ReverseWhoisResult{Domains: domains})
}

func scanHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.FirstName == "" || req.LastName == "" || req.Domain == "" {
		http.Error(w, "firstName, lastName, and domain are required", http.StatusBadRequest)
		return
	}

	// Le script buster.py est dans le PATH via un lien symbolique
	cmd := exec.Command("buster", "-f", req.FirstName, "-l", req.LastName, "-c", req.Domain)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Buster execution finished with an error for '%s %s @ %s': %v\nOutput: %s", req.FirstName, req.LastName, req.Domain, err, string(output))
		// Buster peut échouer s'il ne trouve rien, on retourne un tableau vide.
		json.NewEncoder(w).Encode(ScanResult{Emails: []string{}})
		return
	}

	// La sortie de Buster n'est pas du JSON, il faut la parser.
	// Elle contient généralement des lignes comme "[+] Found: john.doe@example.com"
	lines := strings.Split(string(output), "\n")
	var emails []string
	for _, line := range lines {
		if strings.Contains(line, "Found:") {
			parts := strings.Split(line, "Found:")
			if len(parts) > 1 {
				email := strings.TrimSpace(parts[1])
				emails = append(emails, email)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ScanResult{Emails: emails})
}

func main() {
	http.HandleFunc("/scan", scanHandler)
	http.HandleFunc("/reverse-whois", reverseWhoisHandler)
	log.Println("Buster service starting on port 5003...")
	if err := http.ListenAndServe(":5003", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}