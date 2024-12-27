package models

type RequestBody struct {
	AccessKey    string `json:"access_key"`    // User's AWS Access Key
	SecretKey    string `json:"secret_key"`    // User's AWS Secret Key
	Region       string `json:"region"`        // AWS Region
	Sender       string `json:"sender"`        // Email Sender
	Recipients   []*string `json:"recipients"`     // Email Recipient
	Subject      string `json:"subject"`       // Email Subject
	HtmlBody     string `json:"html_body"`     // Email HTML Body
	TextBody     string `json:"text_body"`     // Email Text Body
    Stream       bool `json:"stream"`           // Stream(if true, user can see logs of email as they are being sent)
}

type ResponseBody struct {
	Message string `json:"message"`
}

type EmailStatus struct {
	Recipient string `json:"recipient"`
	Success   bool   `json:"success"`
}

type LogEntry struct {
	Timestamp string       `json:"timestamp"`
	Message   string       `json:"message"`
	Status    string       `json:"status"`
	Email     *EmailStatus `json:"email,omitempty"`
}