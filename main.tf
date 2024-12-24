provider "aws" {
  region = "eu-north-1"
}

resource "aws_iam_role" "lambda_role_csi" {
  name = "lambda_role_csi"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy" "lambda_policy_csi" {
  name   = "lambda_policy_csi"
  role   = aws_iam_role.lambda_role_csi.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "lambda:InvokeFunction",
          "lambda:CreateFunction",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "ses:SendEmail",
          "ses:SendRawEmail",
          "iam:GetRole",
          "iam:ListRoles"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "null_resource" "lambda" {
  triggers = {
    main = "${base64sha256(filebase64("build/bootstrap"))}"
  }
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "build"
  output_path = "build/function.zip"

  depends_on = [null_resource.lambda]
}

resource "aws_lambda_function" "lambda_function" {
  function_name = "csi-mailer"
  filename      = data.archive_file.lambda_zip.output_path
  handler       = "bootstrap"
  runtime       = "provided.al2023"
  role          = aws_iam_role.lambda_role_csi.arn
  publish       = true
  environment {
    variables = {
      REGION = "eu-north-1"
    }
  }

  depends_on = [data.archive_file.lambda_zip]
}

resource "aws_lambda_function_url" "lambda_function_url" {
  function_name       = aws_lambda_function.lambda_function.function_name
  authorization_type  = "NONE"
  cors {
    allow_origins = ["*"]
    allow_methods = ["POST"]
  }
  invoke_mode = "RESPONSE_STREAM"  # Enable the response stream option
}