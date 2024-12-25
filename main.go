package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/service/ses"
	"github.com/csivitu/csi-mailer/pkg/helpers"
	"github.com/csivitu/csi-mailer/pkg/models"
)

func handler(ctx context.Context, request events.LambdaFunctionURLRequest) (*events.LambdaFunctionURLStreamingResponse, error) {
    var emailReq models.RequestBody
	err := json.Unmarshal([]byte(request.Body), &emailReq)
	if err != nil {
		return helpers.StreamErrorLog("Invalid request body"), nil
	}

	if emailReq.Stream {
		return &events.LambdaFunctionURLStreamingResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body: SendEmailWithLogs(emailReq),
		}, nil
	}

	return &events.LambdaFunctionURLStreamingResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: SendEmail(emailReq),
	}, nil
}


func SendEmail(reqBody models.RequestBody) io.Reader {
	pr, pw := io.Pipe()

	go func() {
		defer pw.Close()

		svc := helpers.InitiateSES(pw, reqBody)
		if svc == nil {
			helpers.WriteLog(pw, "Failed to initiate AWS session", "error", nil)
			return
		}
		input := &ses.SendEmailInput{
			Destination: &ses.Destination{
				CcAddresses: []*string{
				},
				ToAddresses: reqBody.Recipients,
			},
			Message: &ses.Message{
				Body: &ses.Body{
					Html: &ses.Content{
						Charset: aws.String(CharSet),
						Data:    aws.String(reqBody.HtmlBody),
					},
					Text: &ses.Content{
						Charset: aws.String(CharSet),
						Data:    aws.String(reqBody.TextBody),
					},
				},
				Subject: &ses.Content{
					Charset: aws.String(CharSet),
					Data:    aws.String(reqBody.Subject),
				},
			},
			Source: aws.String(reqBody.Sender),
		}
	
		_, err := svc.SendEmail(input)

		if err != nil {
			if aerr, ok := err.(awserr.Error); ok {
				switch aerr.Code() {
				case ses.ErrCodeMessageRejected:
					helpers.WriteLog(pw, fmt.Sprintf("%s: %s", ses.ErrCodeMessageRejected, aerr.Error()), "error", nil)
					return 
				case ses.ErrCodeMailFromDomainNotVerifiedException:
					helpers.WriteLog(pw, fmt.Sprintf("%s: %s", ses.ErrCodeMailFromDomainNotVerifiedException, aerr.Error()), "error", nil)
					return
				case ses.ErrCodeConfigurationSetDoesNotExistException:
					helpers.WriteLog(pw, fmt.Sprintf("%s: %s", ses.ErrCodeConfigurationSetDoesNotExistException, aerr.Error()), "error", nil)
					return
				default:
					helpers.WriteLog(pw, fmt.Sprintf("AWS error Failed to send emails: %v", err), "error", nil)
					return
				}
			} else {
				helpers.WriteLog(pw, fmt.Sprintf("Failed to send emails: %v", err), "error", nil)
				return
			}
		}
	} ()

	return pr
}

func SendEmailWithLogs(reqBody models.RequestBody) io.Reader {
	pr, pw := io.Pipe()

	go func() {
		defer pw.Close()

		svc := helpers.InitiateSES(pw, reqBody)
		if svc == nil {
			helpers.WriteLog(pw, "Failed to initiate AWS session", "error", nil)
			return
		}
		// Iterate through recipients and send emails
		for _, recipient := range reqBody.Recipients {
			input := &ses.SendEmailInput{
				Destination: &ses.Destination{
					ToAddresses: []*string{aws.String(*recipient)},
				},
				Message: &ses.Message{
					Body: &ses.Body{
						Html: &ses.Content{
							Charset: aws.String(CharSet),
							Data:    aws.String(reqBody.HtmlBody),
						},
						Text: &ses.Content{
							Charset: aws.String(CharSet),
							Data:    aws.String(reqBody.TextBody),
						},
					},
					Subject: &ses.Content{
						Charset: aws.String(CharSet),
						Data:    aws.String(reqBody.Subject),
					},
				},
				Source: aws.String(reqBody.Sender),
			}

			// Send the email
			_, err := svc.SendEmail(input)
			if err != nil {
				helpers.WriteLog(pw, fmt.Sprintf("Failed to send email to %s: %v", *recipient, err), "error", &models.EmailStatus{Recipient: *recipient, Success: false})
			} else {
				helpers.WriteLog(pw, fmt.Sprintf("email sent successfully to %s", *recipient), "success", &models.EmailStatus{Recipient: *recipient, Success: true})
			}
		}

		helpers.WriteLog(pw, "All emails processed", "info", nil)
	} ()
	return pr
}

const (
    CharSet = "UTF-8"
)

func main() {
	lambda.Start(handler)
}