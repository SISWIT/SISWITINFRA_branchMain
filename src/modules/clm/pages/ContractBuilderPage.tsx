import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { FileText, Save, Send, ArrowLeft, Building, User, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/shadcn/card";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import { Textarea } from "@/ui/shadcn/textarea";
import { useContract, useContractTemplates, useCreateContract, useUpdateContract } from "@/modules/clm/hooks/useCLM";
import { useQuote } from "@/modules/cpq/hooks/useCPQ";
import { useAccounts, useContacts } from "@/modules/crm/hooks/useCRM";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";
import { Separator } from "@/ui/shadcn/separator";
import { Badge } from "@/ui/shadcn/badge";
import { type ContractStatus, isContractEditableStatus } from "@/core/types/clm";

const EMPTY_CONTRACT_FORM = {
  name: "",
  account_id: "",
  contact_id: "",
  opportunity_id: "",
  quote_id: "",
  template_id: "",
  start_date: "",
  end_date: "",
  value: 0,
  content: "",
};

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}


export default function ContractBuilderPage() {
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const quoteId = searchParams.get("quote_id");
  const [hasPrefilledFromQuote, setHasPrefilledFromQuote] = useState(false);
  const [loadedContractId, setLoadedContractId] = useState<string | null>(null);
  const [contractData, setContractData] = useState({
    ...EMPTY_CONTRACT_FORM,
    quote_id: quoteId || "",
  });

  const { data: existingContract, isLoading: isLoadingExistingContract } = useContract(isEditMode ? id ?? "" : "");
  const { data: quote, isLoading: isLoadingQuote } = useQuote(!isEditMode && quoteId ? quoteId : "");

  // Pre-fill from quote
  useEffect(() => {
    if (isEditMode) {
      return;
    }

    if (quoteId !== contractData.quote_id) {
      setContractData((prev) => ({
        ...prev,
        quote_id: quoteId || "",
      }));
      setHasPrefilledFromQuote(false);
    }
  }, [contractData.quote_id, isEditMode, quoteId]);

  useEffect(() => {
    if (!isEditMode && quote && !hasPrefilledFromQuote) {
      setContractData((prev) => ({
        ...prev,
        quote_id: quote.id,
        opportunity_id: quote.opportunity_id || "",
        name: `Contract for ${quote.accounts?.name || "Customer"}`,
        account_id: quote.account_id || "",
        contact_id: quote.contact_id || "",
        value: quote.total || 0,
      }));
      setHasPrefilledFromQuote(true);
    }
  }, [hasPrefilledFromQuote, isEditMode, quote]);

  useEffect(() => {
    if (!isEditMode || !existingContract || loadedContractId === existingContract.id) {
      return;
    }

    setContractData({
      name: existingContract.name || "",
      account_id: existingContract.account_id || "",
      contact_id: existingContract.contact_id || "",
      opportunity_id: existingContract.opportunity_id || "",
      quote_id: existingContract.quote_id || "",
      template_id: existingContract.template_id || "",
      start_date: toDateInputValue(existingContract.start_date),
      end_date: toDateInputValue(existingContract.end_date),
      value: existingContract.value || 0,
      content: existingContract.content || "",
    });
    setLoadedContractId(existingContract.id);
  }, [existingContract, isEditMode, loadedContractId]);

  // Use standardized hooks
  const { data: templates } = useContractTemplates();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const { data: accounts } = useAccounts();
  const { data: contacts = [] } = useContacts(contractData.account_id || undefined);

  // Apply template content
  const applyTemplate = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      setContractData((prev) => ({
        ...prev,
        template_id: templateId,
        content: template.content || "",
      }));
    }
  };

  const handleSave = (status: ContractStatus) => {
    const payload = {
      ...contractData,
      status,
      value: contractData.value || 0,
    };

    const onSuccess = (data: { id: string }) => {
      navigate(`/${tenantSlug}/app/clm/contracts/${data.id}`);
    };

    if (isEditMode && id) {
      updateContract.mutate({ id, ...payload }, { onSuccess });
      return;
    }

    createContract.mutate(payload, { onSuccess });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  const isSaving = createContract.isPending || updateContract.isPending;

  if (isEditMode && isLoadingExistingContract) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-64 rounded bg-muted" />
      </div>
    );
  }

  if (isEditMode && !existingContract) {
    return (
      <Card className="border-destructive/30 bg-destructive/10">
        <CardContent className="py-8 text-center">
          <p className="text-lg font-semibold">Contract not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The contract you are trying to edit could not be loaded.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate(`/${tenantSlug}/app/clm/contracts`)}>
            Back to contracts
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEditMode && existingContract && !isContractEditableStatus(existingContract.status)) {
    return (
      <Card className="border-warning/40 bg-warning/10">
        <CardContent className="py-8 text-center">
          <p className="text-lg font-semibold">This contract can no longer be edited</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Editing is only available while a contract is still a draft. Open the contract details page to continue the approved workflow.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate(`/${tenantSlug}/app/clm/contracts/${existingContract.id}`)}>
            Back to contract
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{isEditMode ? "Edit Contract" : "Create Contract"}</h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? "Update draft contract details before moving it forward"
                : quoteId
                  ? "Converting approved quote to contract"
                  : "Create a new contract from template"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={isSaving || !contractData.name}>
            <Save className="h-4 w-4 mr-2" />{isEditMode ? "Save Changes" : "Save Draft"}
          </Button>
          <Button onClick={() => handleSave("pending_review")} disabled={isSaving || !contractData.name}>
            <Send className="h-4 w-4 mr-2" />Submit for Review
          </Button>
        </div>
      </div>

      {/* Quote Info Banner */}
      {!isEditMode && quote && (
        <Card className="bg-info/10 border-info/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-info" />
                <div>
                  <p className="font-medium">Converting from Quote: {quote.quote_number}</p>
                  <p className="text-sm text-muted-foreground">{quote.accounts?.name} | {quote.opportunities?.name}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-lg">{formatCurrency(quote.total || 0)}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {!isEditMode && quoteId && !isLoadingQuote && !quote && (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="py-4">
            <p className="font-medium">Quote details could not be loaded</p>
            <p className="text-sm text-muted-foreground">
              The contract form is still available, but the source quote values could not be prefilled for this conversion.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Contract Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
              <CardDescription>Basic information about the contract</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Contract Name *</Label>
                <Input value={contractData.name} onChange={(e) => setContractData({ ...contractData, name: e.target.value })} placeholder="e.g., Annual SaaS License Agreement" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select value={contractData.account_id} onValueChange={(v) => setContractData({ ...contractData, account_id: v, contact_id: "" })}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {accounts?.map((acc) => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contact</Label>
                  <Select value={contractData.contact_id} onValueChange={(v) => setContractData({ ...contractData, contact_id: v })} disabled={!contractData.account_id}>
                    <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                    <SelectContent>
                      {contacts?.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Contract Value</Label>
                  <Input type="number" value={contractData.value} onChange={(e) => setContractData({ ...contractData, value: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={contractData.start_date} onChange={(e) => setContractData({ ...contractData, start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={contractData.end_date} onChange={(e) => setContractData({ ...contractData, end_date: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Template</CardTitle>
              <CardDescription>Select a template or write custom content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={contractData.template_id} onValueChange={applyTemplate}>
                  <SelectTrigger><SelectValue placeholder="Select a template (optional)" /></SelectTrigger>
                  <SelectContent>
                    {templates?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <span>{t.name}</span>
                          <Badge variant="outline">{t.type}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contract Content</Label>
                <Textarea value={contractData.content} onChange={(e) => setContractData({ ...contractData, content: e.target.value })} placeholder="Enter contract terms and conditions..." rows={15} className="font-mono text-sm" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Contract Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Account</p>
                    <p className="font-medium">{accounts?.find((a) => a.id === contractData.account_id)?.name || "Not selected"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">
                      {contacts?.find((c) => c.id === contractData.contact_id)
                        ? `${contacts.find((c) => c.id === contractData.contact_id)?.first_name} ${contacts.find((c) => c.id === contractData.contact_id)?.last_name}`
                        : "Not selected"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Value</p>
                    <p className="font-medium text-lg">{formatCurrency(contractData.value)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{contractData.start_date && contractData.end_date ? `${contractData.start_date} to ${contractData.end_date}` : "Not set"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button className="w-full" onClick={() => handleSave("pending_review")} disabled={isSaving || !contractData.name}>
                  <Send className="h-4 w-4 mr-2" />Submit for Review
                </Button>
                <Button variant="outline" className="w-full" onClick={() => handleSave("draft")} disabled={isSaving || !contractData.name}>
                  <Save className="h-4 w-4 mr-2" />{isEditMode ? "Save Changes" : "Save as Draft"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

