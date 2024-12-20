package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
)

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (ResponseBody, error) {

    var emailReq RequestBody
	err := json.Unmarshal([]byte(request.Body), &emailReq)
	if err != nil {
		return ResponseBody{Message: "Invalid request body"}, err
	}
	response, err := SendEmail(emailReq)

	if err != nil {
		log.Printf("Failed to send email: %v", err)
		return ResponseBody{Message: fmt.Sprintf("Failed to send email : %v", err)}, err
	}

	return ResponseBody{Message: fmt.Sprintf("Email sent successfully: %s", response)}, nil
}

type RequestBody struct {
	AccessKey    string `json:"access_key"`    // User's AWS Access Key
	SecretKey    string `json:"secret_key"`    // User's AWS Secret Key
	Region       string `json:"region"`        // AWS Region
	Sender       string `json:"sender"`        // Email Sender
	Recipients   []*string `json:"recipients"`     // Email Recipient
	Subject      string `json:"subject"`       // Email Subject
	HtmlBody     string `json:"html_body"`     // Email HTML Body
	TextBody     string `json:"text_body"`     // Email Text Body
}

type ResponseBody struct {
	Message string `json:"message"`
}

func SendEmail(reqBody RequestBody) (*ses.SendEmailOutput, error) {
	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String(reqBody.Region), // Replace with your region
		Credentials: credentials.NewStaticCredentials(reqBody.AccessKey, reqBody.SecretKey, ""),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to create session: %v", err)
	}
    
    svc := ses.New(sess)

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

	result, err := svc.SendEmail(input)
    
    if err != nil {
        if aerr, ok := err.(awserr.Error); ok {
            switch aerr.Code() {
            case ses.ErrCodeMessageRejected:
                return nil, fmt.Errorf("%s: %s", ses.ErrCodeMessageRejected, aerr.Error())
            case ses.ErrCodeMailFromDomainNotVerifiedException:
                return nil, fmt.Errorf("%s: %s", ses.ErrCodeMailFromDomainNotVerifiedException, aerr.Error())
            case ses.ErrCodeConfigurationSetDoesNotExistException:
                return nil, fmt.Errorf("%s: %s", ses.ErrCodeConfigurationSetDoesNotExistException, aerr.Error())
            default:
                return nil, err
            }
        } else {
            return nil, err
        }
    }
    
    return result, nil
}

const (
    CharSet = "UTF-8"
)

func main() {
	lambda.Start(handler)
}