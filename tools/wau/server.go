package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
)

type ValidateRequest struct {
	Email string `json:"email"`
}

type ValidateResponse struct {
	IsValid bool   `json:"isValid"`
	Error   string `json:"error,omitempty"`
}

func validateEmailHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var req ValidateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error decoding request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	cmd := exec.Command("wau", req.Email)
	var out bytes.Buffer
	cmd.Stdout = &out

	err := cmd.Run()
	isValid := err == nil

	resp := ValidateResponse{
		IsValid: isValid,
	}

	if !isValid {
		// wau exits with non-zero status for invalid emails, but we don't treat it as a server error.
		// The output might contain more info.
		resp.Error = "Email validation failed"
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func main() {
	http.HandleFunc("/validate", validateEmailHandler)
	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}