package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"
)

type ScanRequest struct {
	PhoneNumber string `json:"phoneNumber"`
}

// La structure de la réponse sera simplement le JSON brut de phoneinfoga

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

	if req.PhoneNumber == "" {
		http.Error(w, "phoneNumber is required", http.StatusBadRequest)
		return
	}

	// Le binaire phoneinfoga est dans le PATH
	// Utiliser l'option -o json pour obtenir une sortie JSON
	cmd := exec.Command("phoneinfoga", "scan", "-n", req.PhoneNumber, "-o", "json")
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Phoneinfoga peut retourner un code d'erreur, mais quand même fournir une sortie JSON partielle.
		log.Printf("Phoneinfoga execution finished with an error for '%s': %v\nOutput: %s", req.PhoneNumber, err, string(output))
	}

	// Vérifier si la sortie est un JSON valide
	var result json.RawMessage
	if err := json.Unmarshal(output, &result); err != nil {
		log.Printf("Failed to parse Phoneinfoga JSON output for '%s': %v", req.PhoneNumber, err)
		http.Error(w, fmt.Sprintf("Failed to parse Phoneinfoga JSON output: %s", string(output)), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(output)
}

func main() {
	http.HandleFunc("/scan", scanHandler)
	log.Println("Phoneinfoga service starting on port 5005...")
	if err := http.ListenAndServe(":5005", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}