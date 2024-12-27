package helpers

import (
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
	"github.com/csivitu/csi-mailer/pkg/models"
)

func InitiateSES(pw *io.PipeWriter, reqBody models.RequestBody) *ses.SES {
	WriteLog(pw, "Creating AWS session...", "info", nil)

	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String(reqBody.Region),
		Credentials: credentials.NewStaticCredentials(reqBody.AccessKey, reqBody.SecretKey, ""),
	})
	if reqBody.AccessKey == "" || reqBody.SecretKey == "" {
		WriteLog(pw, "AWS credentials are missing in the request body", "error", nil)
		return nil
	}
	if err != nil {
		WriteLog(pw, fmt.Sprintf("Failed to create AWS session: %v", err), "error", nil)
		return nil
	}
	WriteLog(pw, "AWS session created successfully", "success", nil)

	svc := ses.New(sess)

	return svc
}