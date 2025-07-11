package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
)

type ASNRequest struct {
	IP string `json:"ip"`
}

func asnHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ASNRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.IP == "" {
		http.Error(w, "IP is required", http.StatusBadRequest)
		return
	}

	// L'outil 'asn' doit être dans le PATH
	cmd := exec.Command("asn", req.IP, "--json")
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("ASN execution failed for %s: %v\nOutput: %s", req.IP, err, string(output))
		http.Error(w, "Failed to execute asn command", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(output)
}

func main() {
	http.HandleFunc("/lookup", asnHandler)
	log.Println("ASN service starting on port 5008...")
	if err := http.ListenAndServe(":5008", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}