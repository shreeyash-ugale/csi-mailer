package helpers

import (
	"encoding/json"
	"io"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/csivitu/csi-mailer/pkg/models"
)

// Helper to write logs
func WriteLog(pw *io.PipeWriter, message, status string, emailStatus *models.EmailStatus) {
	logEntry := models.LogEntry{
		Timestamp: time.Now().Format(time.RFC3339),
		Message:   message,
		Status:    status,
		Email:     emailStatus,
	}
	logData, _ := json.Marshal(logEntry)
	pw.Write(append(logData, '\n'))
}

// Stream an error log for invalid requests
func StreamErrorLog(message string) *events.LambdaFunctionURLStreamingResponse {
	pr, pw := io.Pipe()
	go func() {
		defer pw.Close()
		WriteLog(pw, message, "error", nil)
	}()
	return &events.LambdaFunctionURLStreamingResponse{
		StatusCode: 400,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: pr,
	}
}