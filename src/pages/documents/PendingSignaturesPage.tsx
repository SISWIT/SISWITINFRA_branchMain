import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  Send, Clock, User, Building2, FileStack, 
  Mail, AlertCircle, RefreshCw
} from "lucide-react";

const pendingDocuments = [
  { 
    id: "DOC-2024-0891", 
    name: "Quote Proposal - TechStart Inc", 
    type: "Quote",
    recipient: "john@techstart.com",
    recipientName: "John Williams",
    company: "TechStart Inc",
    sentAt: "Dec 28, 2024",
    expiresIn: "5 days",
    remindersSent: 1
  },
  { 
    id: "DOC-2024-0885", 
    name: "Service Agreement - DataFlow", 
    type: "Contract",
    recipient: "sarah@dataflow.io",
    recipientName: "Sarah Chen",
    company: "DataFlow Solutions",
    sentAt: "Dec 26, 2024",
    expiresIn: "3 days",
    remindersSent: 2
  },
  { 
    id: "DOC-2024-0880", 
    name: "NDA - CloudTech Partners", 
    type: "NDA",
    recipient: "mike@cloudtech.com",
    recipientName: "Mike Rodriguez",
    company: "CloudTech Partners",
    sentAt: "Dec 24, 2024",
    expiresIn: "1 day",
    remindersSent: 3
  },
  { 
    id: "DOC-2024-0875", 
    name: "Partnership Agreement", 
    type: "Contract",
    recipient: "lisa@innovate.co",
    recipientName: "Lisa Thompson",
    company: "Innovate Co",
    sentAt: "Dec 22, 2024",
    expiresIn: "7 days",
    remindersSent: 0
  },
];

const PendingSignaturesPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pending Signatures</h1>
            <p className="text-muted-foreground">Documents awaiting signature from recipients</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="hero">
              <Mail className="w-4 h-4 mr-2" />
              Send Reminders
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{pendingDocuments.length}</div>
                <div className="text-sm text-muted-foreground">Awaiting Signature</div>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">1</div>
                <div className="text-sm text-muted-foreground">Expiring Soon</div>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">6</div>
                <div className="text-sm text-muted-foreground">Reminders Sent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Documents List */}
        <div className="space-y-4">
          {pendingDocuments.map((doc) => (
            <div
              key={doc.id}
              className="p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Send className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{doc.name}</h3>
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {doc.type}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">{doc.id}</div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 lg:gap-6">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{doc.recipientName}</div>
                      <div className="text-xs text-muted-foreground">{doc.recipient}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{doc.company}</div>
                      <div className="text-xs text-muted-foreground">Sent {doc.sentAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className={`text-sm font-medium ${
                        doc.expiresIn === "1 day" ? "text-destructive" : "text-foreground"
                      }`}>
                        Expires in {doc.expiresIn}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {doc.remindersSent} reminder{doc.remindersSent !== 1 ? "s" : ""} sent
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 lg:ml-4">
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-1" />
                    Remind
                  </Button>
                  <Button size="sm">
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {pendingDocuments.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No pending signatures</h3>
            <p className="text-muted-foreground">All documents have been signed or there are no documents awaiting signatures.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PendingSignaturesPage;
