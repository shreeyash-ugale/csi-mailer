export type LogStatus = "info" | "success" | "error";

export interface EmailStatus {
  recipient: string;
  success: boolean;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  status: LogStatus;
  email?: EmailStatus;
}

export interface EmailPayload {
  access_key: string;
  secret_key: string;
  region: string;
  sender: string;
  recipients: string[];
  subject: string;
  html_body: string;
  text_body: string;
  stream: boolean;
}

export interface SendResult {
  sent: number;
  failed: number;
  logs: LogEntry[];
}
