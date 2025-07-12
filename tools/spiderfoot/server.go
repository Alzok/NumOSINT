package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"
)

type ScanRequest struct {
	Targets string `json:"targets"`
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

	if req.Targets == "" {
		http.Error(w, "targets are required", http.StatusBadRequest)
		return
	}

	// Utiliser le lien symbolique 'spiderfoot' pour exécuter le script python
	// Les cibles sont passées en argument
	// La sortie est directement en JSON
	cmd := exec.Command("spiderfoot", "-s", req.Targets, "-o", "json")
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Spiderfoot execution finished with an error for '%s': %v\nOutput: %s", req.Targets, err, string(output))
		http.Error(w, fmt.Sprintf("Spiderfoot execution failed: %s", string(output)), http.StatusInternalServerError)
		return
	}

	// Vérifier si la sortie est un JSON valide
	var result json.RawMessage
	if err := json.Unmarshal(output, &result); err != nil {
		log.Printf("Failed to parse Spiderfoot JSON output for '%s': %v", req.Targets, err)
		http.Error(w, fmt.Sprintf("Failed to parse Spiderfoot JSON output: %s", string(output)), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(output)
}

func main() {
	http.HandleFunc("/scan", scanHandler)
	log.Println("Spiderfoot service starting on port 5006...")
	if err := http.ListenAndServe(":5006", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}