import { Header } from "@/components/header";
import { EmailForm } from "@/components/email-form";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Page heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Send Bulk Email
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
              Send personalised emails at scale using your AWS SES credentials.
              Emails are delivered individually with real-time delivery logs.
            </p>
          </div>

          <EmailForm />
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>CSI Mailer · Built by CSI VIT</span>
          <span>Powered by AWS SES</span>
        </div>
      </footer>
    </div>
  );
}
