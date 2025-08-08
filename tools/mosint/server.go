package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"strings"
)

type ScanRequest struct {
	Email string `json:"email"`
}

// La structure de la réponse sera simplement le JSON brut de mosint
// car il est déjà bien structuré.

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

	if req.Email == "" {
		http.Error(w, "email is required", http.StatusBadRequest)
		return
	}

	// Le binaire mosint est dans le PATH car installé avec 'go install'
	// L'option -o json est utilisée pour obtenir une sortie JSON
	cmd := exec.Command("mosint", "-o", "json", req.Email)
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Mosint peut retourner un code d'erreur même avec une sortie valide (ex: email non trouvé)
		// On logue l'erreur mais on essaie quand même de parser la sortie.
		log.Printf("Mosint execution finished with an error for '%s': %v\nOutput: %s", req.Email, err, string(output))
	}

	// Vérifier si la sortie est un JSON valide
	var result json.RawMessage
	if err := json.Unmarshal(output, &result); err != nil {
		log.Printf("Failed to parse Mosint JSON output for '%s': %v", req.Email, err)
		http.Error(w, fmt.Sprintf("Failed to parse Mosint JSON output: %s", string(output)), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(output)
}

func hibpLookupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		http.Error(w, "email is required", http.StatusBadRequest)
		return
	}

	// Exécute mosint avec le service 'pwned'
	cmd := exec.Command("mosint", "-s", "pwned", req.Email)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Mosint HIBP lookup finished with an error for '%s': %v\nOutput: %s", req.Email, err, string(output))
	}

	// La sortie est une liste de brèches séparées par des sauts de ligne.
	breaches := strings.Split(strings.TrimSpace(string(output)), "\n")
	if len(breaches) == 1 && breaches[0] == "" {
		breaches = []string{}
	}

	jsonResponse, err := json.Marshal(breaches)
	if err != nil {
		http.Error(w, "Failed to create JSON response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonResponse)
}

func ipLookupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		http.Error(w, "email is required", http.StatusBadRequest)
		return
	}

	cmd := exec.Command("mosint", "-s", "ipapi", req.Email)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Mosint IP lookup finished with an error for '%s': %v\nOutput: %s", req.Email, err, string(output))
	}

	// La sortie est un JSON, on le renvoie directement.
	var result json.RawMessage
	if err := json.Unmarshal(output, &result); err != nil {
		log.Printf("Failed to parse Mosint IP API JSON output for '%s': %v", req.Email, err)
		http.Error(w, fmt.Sprintf("Failed to parse Mosint IP API JSON output: %s", string(output)), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(output)
}

func linkSearchHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		http.Error(w, "email is required", http.StatusBadRequest)
		return
	}

	cmd := exec.Command("mosint", "-s", "google", req.Email)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Mosint link search finished with an error for '%s': %v\nOutput: %s", req.Email, err, string(output))
	}

	// La sortie est une liste de liens séparés par des sauts de ligne.
	links := strings.Split(strings.TrimSpace(string(output)), "\n")
	if len(links) == 1 && links[0] == "" {
		links = []string{}
	}

	jsonResponse, err := json.Marshal(links)
	if err != nil {
		http.Error(w, "Failed to create JSON response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonResponse)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	http.HandleFunc("/scan", scanHandler)
	http.HandleFunc("/hibp-lookup", hibpLookupHandler)
	http.HandleFunc("/ip-lookup", ipLookupHandler)
	http.HandleFunc("/link-search", linkSearchHandler)
	http.HandleFunc("/health", healthHandler)
	log.Println("Mosint service starting on port 5004...")
	if err := http.ListenAndServe(":5004", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}