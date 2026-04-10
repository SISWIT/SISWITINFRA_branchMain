import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { ArrowLeft, Calculator, FileStack, Package, Plus, Save, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import { Badge } from "@/ui/shadcn/badge";
import {
  useProducts,
  useCreateQuote,
  useQuote,
  useQuoteItems,
  useQuoteTemplateItems,
  useQuoteTemplates,
  useUpdateQuote,
} from "@/modules/cpq/hooks/useCPQ";
import { useAccounts, useContacts, useOpportunities } from "@/modules/crm/hooks/useCRM";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";
import { Separator } from "@/ui/shadcn/separator";
import { Textarea } from "@/ui/shadcn/textarea";
import { tenantAppPath } from "@/core/utils/routes";
import type { QuoteTemplate, QuoteTemplateItem } from "@/core/types/cpq";

interface LocalQuoteItem {
  id?: string;
  product_id: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
}

type QuoteFormState = {
  account_id: string;
  contact_id: string;
  opportunity_id: string;
  valid_until: string;
  terms: string;
  notes: string;
  discount_percent: number;
  tax_percent: number;
};

function addDaysToToday(days: number) {
  const next = new Date();
  next.setDate(next.getDate() + Math.max(1, Number(days || 30)));
  return next.toISOString().split("T")[0];
}

function mapTemplateItemsToQuoteItems(templateItems: QuoteTemplateItem[]): LocalQuoteItem[] {
  return templateItems.map((item, index) => {
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price || 0);
    const discountPercent = Number(item.discount_percent || 0);
    const total = quantity * unitPrice * (1 - discountPercent / 100);

    return {
      id: `template-${item.id}-${index}`,
      product_id: item.product_id ?? "",
      product_name: item.product_name,
      description: item.description,
      quantity,
      unit_price: unitPrice,
      discount_percent: discountPercent,
      total,
    };
  });
}

export default function QuoteBuilderPage() {
  const navigate = useNavigate();
  const { id: quoteId, tenantSlug = "" } = useParams<{ id?: string; tenantSlug: string }>();
  const [searchParams] = useSearchParams();
  const opportunityId = searchParams.get("opportunity_id");
  const accountId = searchParams.get("account_id");
  const templateIdFromQuery = searchParams.get("template_id") ?? "";
  const isEditMode = !!quoteId;

  const defaultValidDate = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 30);
    return next.toISOString().split("T")[0];
  }, []);

  const [quoteData, setQuoteData] = useState<QuoteFormState>({
    account_id: accountId || "",
    contact_id: "",
    opportunity_id: opportunityId || "",
    valid_until: defaultValidDate,
    terms: "Net 30 days",
    notes: "",
    discount_percent: 0,
    tax_percent: 18,
  });

  const [items, setItems] = useState<LocalQuoteItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateIdFromQuery);
  const [hasAutoAppliedTemplate, setHasAutoAppliedTemplate] = useState(false);

  const updateQuoteData = (updates: Partial<QuoteFormState> | ((prev: QuoteFormState) => QuoteFormState)) => {
    setQuoteData((prev) => (typeof updates === "function" ? updates(prev) : { ...prev, ...updates }));
  };

  const { data: existingQuote, isLoading: isLoadingQuote } = useQuote(isEditMode ? quoteId! : "");
  const { data: existingItems, isLoading: isLoadingItems } = useQuoteItems(isEditMode ? quoteId! : "");
  const { data: products } = useProducts();
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuoteTemplates();
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  const { data: selectedTemplateItems = [], isLoading: isLoadingTemplateItems } = useQuoteTemplateItems(selectedTemplateId);
  const createQuoteMutation = useCreateQuote();
  const updateQuoteMutation = useUpdateQuote();

  useEffect(() => {
    if (isEditMode && existingQuote && !isLoadingQuote) {
      setQuoteData({
        account_id: existingQuote.account_id || "",
        contact_id: existingQuote.contact_id || "",
        opportunity_id: existingQuote.opportunity_id || "",
        valid_until: existingQuote.valid_until || defaultValidDate,
        terms: existingQuote.terms || "Net 30 days",
        notes: existingQuote.notes || "",
        discount_percent: existingQuote.discount_percent || 0,
        tax_percent: existingQuote.tax_percent || 18,
      });
    }
  }, [defaultValidDate, isEditMode, existingQuote, isLoadingQuote]);

  useEffect(() => {
    if (isEditMode && existingItems && !isLoadingItems) {
      setItems(existingItems.map(item => ({
        id: item.id,
        product_id: item.product_id ?? "",
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent || 0,
        total: item.total || 0,
      })));
    }
  }, [isEditMode, existingItems, isLoadingItems]);

  const { data: accounts } = useAccounts();
  const { data: contacts = [] } = useContacts(quoteData.account_id || undefined);
  const { data: opportunities = [] } = useOpportunities(quoteData.account_id || undefined);

  const selectedAccountDetails = accounts?.find(a => a.id === quoteData.account_id);

  const applyTemplate = (
    template: QuoteTemplate,
    templateItems: QuoteTemplateItem[],
    options?: { silent?: boolean },
  ) => {
    updateQuoteData((prev) => ({
      ...prev,
      valid_until: addDaysToToday(template.validity_days),
      terms: template.terms || "",
      notes: template.notes || "",
      discount_percent: Number(template.discount_percent || 0),
      tax_percent: Number(template.tax_percent || 0),
    }));
    setItems(mapTemplateItemsToQuoteItems(templateItems));
    setSelectedProduct("");

    if (!options?.silent) {
      toast.success(`${template.name} template applied`);
    }
  };

  const handleAccountChange = (newAccountId: string) => {
    updateQuoteData({ account_id: newAccountId, contact_id: "", opportunity_id: "" });
  };

  useEffect(() => {
    if (
      isEditMode ||
      hasAutoAppliedTemplate ||
      !templateIdFromQuery ||
      !selectedTemplate ||
      isLoadingTemplateItems
    ) {
      return;
    }

    updateQuoteData((prev) => ({
      ...prev,
      valid_until: addDaysToToday(selectedTemplate.validity_days),
      terms: selectedTemplate.terms || "",
      notes: selectedTemplate.notes || "",
      discount_percent: Number(selectedTemplate.discount_percent || 0),
      tax_percent: Number(selectedTemplate.tax_percent || 0),
    }));
    setItems(mapTemplateItemsToQuoteItems(selectedTemplateItems));
    setSelectedProduct("");
    setHasAutoAppliedTemplate(true);
  }, [
    hasAutoAppliedTemplate,
    isEditMode,
    isLoadingTemplateItems,
    selectedTemplate,
    selectedTemplateItems,
    templateIdFromQuery,
  ]);

  const grossTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalItemDiscounts = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price * (item.discount_percent / 100));
  }, 0);

  const subtotal = grossTotal - totalItemDiscounts;
  const quoteDiscountAmount = subtotal * (quoteData.discount_percent / 100);
  const afterQuoteDiscount = subtotal - quoteDiscountAmount;
  const taxAmount = afterQuoteDiscount * (quoteData.tax_percent / 100);
  const grandTotal = afterQuoteDiscount + taxAmount;

  const addProduct = () => {
    const product = products?.find((p) => p.id === selectedProduct);
    if (!product) return;

    const newItem: LocalQuoteItem = {
      product_id: product.id,
      product_name: product.name,
      description: product.description || "",
      quantity: 1,
      unit_price: product.unit_price,
      discount_percent: 0,
      total: product.unit_price,
    };

    setItems([...items, newItem]);
    setSelectedProduct("");
  };

  const updateItem = (index: number, field: keyof LocalQuoteItem, value: LocalQuoteItem[keyof LocalQuoteItem]) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    const qty = item.quantity;
    const price = item.unit_price;
    const disc = item.discount_percent;
    item.total = qty * price * (1 - disc / 100);

    updated[index] = item;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveQuote = (status: "draft" | "pending_approval") => {
    const quotePayload = {
      account_id: quoteData.account_id || undefined,
      contact_id: quoteData.contact_id || undefined,
      opportunity_id: quoteData.opportunity_id || undefined,
      status,
      valid_until: quoteData.valid_until || undefined,
      terms: quoteData.terms,
      notes: quoteData.notes,
      subtotal,
      discount_percent: quoteData.discount_percent,
      discount_amount: quoteDiscountAmount,
      tax_percent: quoteData.tax_percent,
      tax_amount: taxAmount,
      total: grandTotal,
    };

    if (isEditMode && quoteId) {
      updateQuoteMutation.mutate(
        { id: quoteId, ...quotePayload },
        { onSuccess: () => navigate(tenantAppPath(tenantSlug, `cpq/quotes/${quoteId}`)) }
      );
    } else {
      createQuoteMutation.mutate(
        { ...quotePayload, items },
        { onSuccess: (quote) => navigate(tenantAppPath(tenantSlug, `cpq/quotes/${quote.id}`)) }
      );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  const isSaving = createQuoteMutation.isPending || updateQuoteMutation.isPending;
  const canSubmit = isEditMode || items.length > 0;

  if (isEditMode && !isLoadingQuote && existingQuote && existingQuote.status !== "draft") {
    return (
      <div className="container mx-auto max-w-2xl p-1 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Only draft quotes can be edited</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This quote is currently in the <span className="font-medium text-foreground">{existingQuote.status.replace(/_/g, " ")}</span> state.
              Editing is only available while a quote is still a draft, so the workflow stays consistent.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => navigate(tenantAppPath(tenantSlug, `cpq/quotes/${quoteId}`))}>
                View Quote
              </Button>
              <Button variant="outline" onClick={() => navigate(tenantAppPath(tenantSlug, "cpq/quotes"))}>
                Back to Quotes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-1 md:p-6">
      <div className="space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-fit px-1 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(tenantAppPath(tenantSlug, "cpq/quotes"))}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Quotes
        </Button>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold md:text-3xl">{isEditMode ? "Edit Quote" : "Create Quote"}</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Build a clean customer-ready quote with the right customer, commercial settings, and line items.
          </p>
        </div>
      </div>

      {isLoadingQuote || isLoadingItems ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-40 rounded-xl bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {!isEditMode && (
              <Card className="border-border/70 shadow-sm">
                <CardHeader className="gap-4 border-b border-border/60">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Quote Templates
                      </Badge>
                      <div className="space-y-1">
                        <CardTitle>Start from a saved template</CardTitle>
                        <CardDescription className="max-w-2xl">
                          Use a reusable quote blueprint to prefill commercial defaults and draft line items without
                          overwriting the customer details you choose for this deal.
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => navigate(tenantAppPath(tenantSlug, "cpq/templates"))}>
                      <FileStack className="mr-2 h-4 w-4" />
                      Manage Templates
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>Quote Template</Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={templates.length === 0}>
                          <SelectTrigger className="flex-1 bg-background">
                            <SelectValue
                              placeholder={
                                isLoadingTemplates
                                  ? "Loading templates..."
                                  : templates.length === 0
                                    ? "No templates available yet"
                                    : "Choose a quote template"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => {
                            if (selectedTemplate) {
                              applyTemplate(selectedTemplate, selectedTemplateItems);
                            }
                          }}
                          disabled={!selectedTemplate || isLoadingTemplateItems || templates.length === 0}
                        >
                          Apply Template
                        </Button>
                      </div>
                      {templates.length === 0 ? (
                        <p className="text-xs leading-5 text-muted-foreground">
                          Create a quote template first to prefill line items, pricing defaults, terms, and notes from the CPQ template library.
                        </p>
                      ) : (
                        <p className="text-xs leading-5 text-muted-foreground">
                          Templates only prefill defaults and draft line items. Account, contact, and opportunity stay under your control.
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                      {selectedTemplate ? (
                        <div className="space-y-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold">{selectedTemplate.name}</p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                {selectedTemplate.description || "Reusable quote setup with saved line items and pricing logic."}
                              </p>
                            </div>
                            <Badge variant="outline" className="w-fit">{selectedTemplate.category || "Sales"}</Badge>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div className="rounded-lg bg-background p-3">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Items</p>
                              <p className="mt-2 text-lg font-semibold">{selectedTemplate.item_count}</p>
                            </div>
                            <div className="rounded-lg bg-background p-3">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Validity</p>
                              <p className="mt-2 text-lg font-semibold">{selectedTemplate.validity_days}d</p>
                            </div>
                            <div className="rounded-lg bg-background p-3">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Est. Total</p>
                              <p className="mt-2 text-lg font-semibold">{formatCurrency(selectedTemplate.estimated_total)}</p>
                            </div>
                          </div>
                          {templateIdFromQuery && hasAutoAppliedTemplate && selectedTemplate.id === templateIdFromQuery && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                              This quote started from the selected template and is ready for account-specific edits.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-6 py-8 text-center">
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                          <p className="mt-3 text-sm font-medium">No template selected yet</p>
                          <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                            Choose a template to preload line items, terms, and pricing defaults into this quote.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60">
                <CardTitle>Quote Details</CardTitle>
                <CardDescription>Pick the customer context and set the commercial defaults for this quote.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Account</Label>
                    <Select value={quoteData.account_id} onValueChange={handleAccountChange}>
                      <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                      <SelectContent>
                        {accounts?.map((acc) => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {selectedAccountDetails && (
                      <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground xl:col-span-3">
                        <p className="font-medium">Bill To: {selectedAccountDetails.address}</p>
                        <p>{selectedAccountDetails.city}, {selectedAccountDetails.state}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Contact</Label>
                    <Select
                      key={`contact-${quoteData.account_id || "none"}`}
                      value={quoteData.contact_id}
                      onValueChange={(v) => updateQuoteData({ contact_id: v })}
                      disabled={!quoteData.account_id}
                    >
                      <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                      <SelectContent>
                        {contacts?.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Opportunity</Label>
                    <Select
                      key={`opportunity-${quoteData.account_id || "none"}`}
                      value={quoteData.opportunity_id}
                      onValueChange={(v) => updateQuoteData({ opportunity_id: v })}
                      disabled={!quoteData.account_id}
                    >
                      <SelectTrigger><SelectValue placeholder="Select opportunity" /></SelectTrigger>
                      <SelectContent>
                        {opportunities?.map((opp) => <SelectItem key={opp.id} value={opp.id}>{opp.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input type="date" value={quoteData.valid_until} onChange={(e) => updateQuoteData({ valid_until: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Quote Discount %</Label>
                    <Input
                      type="number"
                      value={quoteData.discount_percent}
                      onChange={(e) => updateQuoteData({ discount_percent: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GST %</Label>
                    <Input
                      type="number"
                      value={quoteData.tax_percent}
                      onChange={(e) => updateQuoteData({ tax_percent: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60">
                <CardTitle>Terms & Notes</CardTitle>
                <CardDescription>Add customer-facing terms and internal-ready notes that belong with this quote.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Textarea
                    value={quoteData.terms}
                    onChange={(e) => updateQuoteData({ terms: e.target.value })}
                    rows={5}
                    placeholder="e.g. Net 30 days"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={quoteData.notes}
                    onChange={(e) => updateQuoteData({ notes: e.target.value })}
                    rows={5}
                    placeholder="Add customer notes, delivery context, or proposal guidance"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>Line Items</CardTitle>
                    <CardDescription>Add products, then fine-tune quantity, pricing, and item-level discount.</CardDescription>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Choose a product to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - {formatCurrency(p.unit_price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addProduct} disabled={!selectedProduct}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </div>
                <Separator />
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-muted-foreground">
                    <Package className="mx-auto mb-3 h-10 w-10 opacity-30" />
                    <p className="text-sm font-medium text-foreground">No products added yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add products from the catalog or apply a template to start pricing this quote.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="space-y-4 rounded-xl border border-border/70 bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="font-medium">{item.product_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.description || "No item description provided."}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Unit Price</Label>
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Item Discount %</Label>
                            <Input
                              type="number"
                              value={item.discount_percent}
                              onChange={(e) => updateItem(index, "discount_percent", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Line Total</Label>
                            <div className="flex h-10 items-center rounded-md bg-muted/40 px-3 text-sm font-semibold">
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <Card className="overflow-hidden border-border/70 shadow-sm lg:flex lg:max-h-[calc(100vh-8rem)] lg:flex-col">
              <CardHeader className="shrink-0 border-b border-border/60">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Quote Summary
                </CardTitle>
                <CardDescription>Review the financial breakdown before you save or submit.</CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                  {!isEditMode && selectedTemplate && (
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Template Source</p>
                      <p className="mt-2 font-medium">{selectedTemplate.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {selectedTemplate.category || "Sales"} template with {selectedTemplate.item_count} default items
                      </p>
                    </div>
                  )}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gross Amount</span>
                      <span>{formatCurrency(grossTotal)}</span>
                    </div>
                    {totalItemDiscounts > 0 && (
                      <div className="flex justify-between text-sm text-destructive italic">
                        <span>Product Discounts</span>
                        <span>-{formatCurrency(totalItemDiscounts)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm font-medium">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-sm">
                      <span className="text-muted-foreground">Quote Discount ({quoteData.discount_percent}%)</span>
                      <span className="text-sm text-destructive">-{formatCurrency(quoteDiscountAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-1 text-sm">
                      <span className="text-muted-foreground">GST ({quoteData.tax_percent}%)</span>
                      <span className="text-sm">+{formatCurrency(taxAmount)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold text-primary">
                      <span>Grand Total</span>
                      <span>{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Line items</span>
                      <span>{items.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Valid until</span>
                      <span>{quoteData.valid_until || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status on save</span>
                      <span>{isEditMode ? "Draft update" : "New draft"}</span>
                    </div>
                  </div>

                  {!canSubmit && (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      Add at least one line item before submitting this quote for approval.
                    </div>
                  )}
                </div>

                <div className="shrink-0 border-t border-border/60 bg-background px-6 py-4">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Actions</p>
                  <div className="mt-3 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full bg-background"
                      onClick={() => handleSaveQuote("draft")}
                      disabled={isSaving}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isEditMode ? "Save Changes" : "Save Draft"}
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => handleSaveQuote("pending_approval")}
                      disabled={isSaving || !canSubmit}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit Quote
                    </Button>
                  </div>
                </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
