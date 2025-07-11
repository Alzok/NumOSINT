package main

import (
	"encoding/json"
	"net/http"
	"os/exec"
	"strings"

	"github.com/gin-gonic/gin"
)

type EmailValidationRequest struct {
	Email string `json:"email"`
}

type ValidationResult struct {
	Email      string `json:"email"`
	IsValid    bool   `json:"is_valid"`
	IsRisky    bool   `json:"is_risky"`
	Reason     string `json:"reason"`
	RawOutput  string `json:"raw_output"`
}

func main() {
	r := gin.Default()

	r.POST("/validate", func(c *gin.Context) {
		var req EmailValidationRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.Email == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
			return
		}

		cmd := exec.Command("wau", req.Email)
		output, err := cmd.CombinedOutput()

		result := parseWauOutput(req.Email, string(output), err)

		c.JSON(http.StatusOK, result)
	})

	r.Run(":8080")
}

func parseWauOutput(email string, rawOutput string, err error) ValidationResult {
	// Implémentation basique du parsing. wau peut avoir différents codes de sortie.
	// Une sortie réussie (exit code 0) signifie généralement que l'e-mail est valide.
	// On se base sur le contenu textuel pour plus de détails.

	isValid := err == nil
	isRisky := false
	reason := "Validation successful"

	if strings.Contains(rawOutput, "is risky") {
		isRisky = true
		reason = "Email is considered risky"
	}

	if err != nil {
		reason = err.Error()
		if exitError, ok := err.(*exec.ExitError); ok {
			reason = string(exitError.Stderr)
		}
	}
	
	// Simplification: si le code de sortie n'est pas 0, on considère invalide.
	// On pourrait affiner avec les codes de sortie spécifiques de wau.
	if err != nil {
		isValid = false
	}

	return ValidationResult{
		Email:     email,
		IsValid:   isValid,
		IsRisky:   isRisky,
		Reason:    reason,
		RawOutput: rawOutput,
	}
}