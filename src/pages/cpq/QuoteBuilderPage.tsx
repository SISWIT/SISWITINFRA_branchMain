import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, Plus, Minus, Trash2, Calculator, Save, Send, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface QuoteItem {
  id?: string;
  product_id: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
}

export default function QuoteBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const opportunityId = searchParams.get("opportunity_id");
  const accountId = searchParams.get("account_id");

  // Default valid_until to 30 days from now
  const defaultValidDate = new Date();
  defaultValidDate.setDate(defaultValidDate.getDate() + 30);

  const [quoteData, setQuoteData] = useState({
    account_id: accountId || "",
    contact_id: "",
    opportunity_id: opportunityId || "",
    valid_until: defaultValidDate.toISOString().split('T')[0],
    terms: "Net 30 days",
    notes: "",
    discount_percent: 0,
    tax_percent: 18,
  });

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");

  // 1. Fetch products
  const { data: products } = useQuery({
    queryKey: ["products-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch accounts (including address fields now)
  const { data: accounts } = useQuery({
    queryKey: ["accounts-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name, address, city, state, postal_code, country")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // 3. Fetch contacts based on selected account
  const { data: contacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["contacts-list", quoteData.account_id], 
    queryFn: async () => {
      if (!quoteData.account_id) return [];
      const { data, error } = await supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .eq("account_id", quoteData.account_id)
        .order("first_name");
        
      if (error) throw error;
      return data;
    },
    enabled: !!quoteData.account_id && quoteData.account_id !== "",
  });

  // 4. Fetch opportunities based on selected account
  const { data: opportunities, isLoading: isLoadingOpportunities } = useQuery({
    queryKey: ["opportunities-list", quoteData.account_id],
    queryFn: async () => {
      if (!quoteData.account_id) return [];
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, name, amount")
        .eq("account_id", quoteData.account_id)
        .order("name");
        
      if (error) throw error;
      return data;
    },
    enabled: !!quoteData.account_id && quoteData.account_id !== "",
  });

  // Helper to get currently selected account details for display
  const selectedAccountDetails = accounts?.find(a => a.id === quoteData.account_id);

  // Handle Account Change specifically to reset dependent fields
  const handleAccountChange = (newAccountId: string) => {
    setQuoteData(prev => ({
      ...prev,
      account_id: newAccountId,
      contact_id: "", // Reset contact
      opportunity_id: "" // Reset opportunity
    }));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = subtotal * (quoteData.discount_percent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (quoteData.tax_percent / 100);
  const grandTotal = afterDiscount + taxAmount;

  const addProduct = () => {
    const product = products?.find((p) => p.id === selectedProduct);
    if (!product) return;

    const newItem: QuoteItem = {
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

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate total
    const qty = updated[index].quantity;
    const price = updated[index].unit_price;
    const disc = updated[index].discount_percent;
    updated[index].total = qty * price * (1 - disc / 100);

    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Create quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: async (status: "draft" | "pending_approval" | "approved" | "rejected" | "sent" | "accepted" | "expired") => {
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert([{
          account_id: quoteData.account_id || null,
          contact_id: quoteData.contact_id || null,
          opportunity_id: quoteData.opportunity_id || null,
          valid_until: quoteData.valid_until || null,
          terms: quoteData.terms,
          notes: quoteData.notes,
          discount_percent: quoteData.discount_percent,
          discount_amount: discountAmount,
          tax_percent: quoteData.tax_percent,
          tax_amount: taxAmount,
          subtotal,
          total: grandTotal,
          status,
          // quote_number is usually generated by database triggers if not provided
        }])
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Insert quote items
      if (items.length > 0) {
        const { error: itemsError } = await supabase.from("quote_items").insert(
          items.map((item, index) => ({
            quote_id: quote.id,
            product_id: item.product_id,
            product_name: item.product_name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent,
            total: item.total,
            sort_order: index,
          }))
        );
        if (itemsError) throw itemsError;
      }

      return quote;
    },
    onSuccess: (quote) => {
      queryClient.invalidateQueries({ queryKey: ["quotes-list"] });
      toast.success("Quote created successfully");
      navigate(`/dashboard/cpq/quotes/${quote.id}`);
    },
    onError: (error) => toast.error("Failed to create quote: " + error.message),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create Quote</h1>
              <p className="text-muted-foreground">Build a new quote with products and pricing</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => createQuoteMutation.mutate("draft")} disabled={createQuoteMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />Save Draft
            </Button>
            <Button onClick={() => createQuoteMutation.mutate("pending_approval")} disabled={createQuoteMutation.isPending || items.length === 0}>
              <Send className="h-4 w-4 mr-2" />Submit for Approval
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Quote Details & Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Details */}
            <Card>
              <CardHeader>
                <CardTitle>Quote Details</CardTitle>
                <CardDescription>Select customer and set quote parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Account</Label>
                    <Select 
                      value={quoteData.account_id} 
                      onValueChange={handleAccountChange}
                    >
                      <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                      <SelectContent>
                        {accounts?.map((acc) => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {/* Display full address context */}
                    {selectedAccountDetails && (
                      <div className="text-xs text-muted-foreground ml-1 p-2 bg-muted/50 rounded-md">
                        <p className="font-medium">Bill To:</p>
                        <p>{selectedAccountDetails.address}</p>
                        <p>
                          {[
                            selectedAccountDetails.city, 
                            selectedAccountDetails.state, 
                            selectedAccountDetails.postal_code
                          ].filter(Boolean).join(", ")}
                        </p>
                        <p>{selectedAccountDetails.country}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Contact</Label>
                    <Select 
                      value={quoteData.contact_id} 
                      onValueChange={(v) => setQuoteData({ ...quoteData, contact_id: v })} 
                      disabled={!quoteData.account_id || isLoadingContacts}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingContacts ? "Loading..." : "Select contact"} />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts?.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Opportunity</Label>
                    <Select 
                      value={quoteData.opportunity_id} 
                      onValueChange={(v) => setQuoteData({ ...quoteData, opportunity_id: v })} 
                      disabled={!quoteData.account_id || isLoadingOpportunities}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingOpportunities ? "Loading..." : "Select opportunity (optional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        {opportunities?.map((opp) => <SelectItem key={opp.id} value={opp.id}>{opp.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input type="date" value={quoteData.valid_until} onChange={(e) => setQuoteData({ ...quoteData, valid_until: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Products & Services</CardTitle>
                <CardDescription>Add products from the catalog</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select a product to add" /></SelectTrigger>
                    <SelectContent>
                      {products?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center justify-between gap-4 w-full">
                            <span>{p.name}</span>
                            <Badge variant="outline">{formatCurrency(p.unit_price)}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addProduct} disabled={!selectedProduct}><Plus className="h-4 w-4 mr-2" />Add</Button>
                </div>

                <Separator />

                {/* Items List */}
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No products added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="p-4 rounded-lg border border-border bg-card">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{item.product_name}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Quantity</Label>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItem(index, "quantity", Math.max(1, item.quantity - 1))}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input type="number" value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)} className="text-center h-8" />
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItem(index, "quantity", item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unit Price</Label>
                            <Input type="number" value={item.unit_price} onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)} className="h-8" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Discount %</Label>
                            <Input type="number" value={item.discount_percent} onChange={(e) => updateItem(index, "discount_percent", parseFloat(e.target.value) || 0)} className="h-8" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Line Total</Label>
                            <div className="h-8 px-3 flex items-center rounded-md bg-muted font-semibold">
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

            {/* Terms & Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Terms & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select value={quoteData.terms} onValueChange={(v) => setQuoteData({ ...quoteData, terms: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Net 15 days">Net 15 days</SelectItem>
                      <SelectItem value="Net 30 days">Net 30 days</SelectItem>
                      <SelectItem value="Net 45 days">Net 45 days</SelectItem>
                      <SelectItem value="Net 60 days">Net 60 days</SelectItem>
                      <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={quoteData.notes} onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })} placeholder="Additional notes or terms..." rows={3} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />Quote Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items ({items.length})</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">Discount %</Label>
                    <Input
                      type="number"
                      value={quoteData.discount_percent}
                      onChange={(e) => setQuoteData({ ...quoteData, discount_percent: parseFloat(e.target.value) || 0 })}
                      className="h-8 w-20"
                    />
                    <span className="text-sm text-destructive">-{formatCurrency(discountAmount)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">After Discount</span>
                    <span>{formatCurrency(afterDiscount)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">Tax (GST) %</Label>
                    <Input
                      type="number"
                      value={quoteData.tax_percent}
                      onChange={(e) => setQuoteData({ ...quoteData, tax_percent: parseFloat(e.target.value) || 0 })}
                      className="h-8 w-20"
                    />
                    <span className="text-sm">+{formatCurrency(taxAmount)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Grand Total</span>
                    <span className="text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button className="w-full" onClick={() => createQuoteMutation.mutate("pending_approval")} disabled={createQuoteMutation.isPending || items.length === 0}>
                    <Send className="h-4 w-4 mr-2" />Submit for Approval
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => createQuoteMutation.mutate("draft")} disabled={createQuoteMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />Save as Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}