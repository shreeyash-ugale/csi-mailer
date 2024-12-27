provider "aws" {
  shared_config_files      = ["C:\\Users\\Shreeyash Ugale\\.aws\\config"]
  shared_credentials_files = ["C:\\Users\\Shreeyash Ugale\\.aws\\credentials"]
  profile                  = "default"
  region                   = "ap-south-1"

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
      REGION = "ap-south-1"
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

resource "aws_api_gateway_rest_api" "api" {
  name        = "csi-mailer-api"
  description = "API Gateway for CSI Mailer Lambda function"
}

resource "aws_api_gateway_resource" "resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "send-email"
}

resource "aws_api_gateway_method" "method" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.resource.id
  http_method = aws_api_gateway_method.method.http_method
  type        = "AWS_PROXY"
  integration_http_method = "POST"
  uri         = aws_lambda_function.lambda_function.invoke_arn
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [aws_api_gateway_integration.integration]
  rest_api_id = aws_api_gateway_rest_api.api.id
}

resource "aws_api_gateway_stage" "stage" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = "dev"
}

output "api_gateway_url" {
  value = "${aws_api_gateway_deployment.deployment.invoke_url}dev/send-email"
  description = "The URL of the API Gateway endpoint"
}