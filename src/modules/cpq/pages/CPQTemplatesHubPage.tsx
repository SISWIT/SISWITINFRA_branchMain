import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgeIndianRupee,
  CopyPlus,
  FileStack,
  Layers3,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  useCreateQuoteTemplate,
  useDeleteQuoteTemplate,
  useProducts,
  useQuoteTemplateItems,
  useQuoteTemplates,
  useUpdateQuoteTemplate,
} from "@/modules/cpq/hooks/useCPQ";
import type { Product, QuoteTemplate } from "@/core/types/cpq";
import { tenantAppPath } from "@/core/utils/routes";
import { cn } from "@/core/utils/utils";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Badge } from "@/ui/shadcn/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/shadcn/dialog";
import { Label } from "@/ui/shadcn/label";
import { Input } from "@/ui/shadcn/input";
import { Textarea } from "@/ui/shadcn/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/shadcn/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/shadcn/alert-dialog";

type TemplateDraftItem = {
  id: string;
  product_id?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
};

type TemplateFormState = {
  name: string;
  description: string;
  category: string;
  validity_days: number;
  discount_percent: number;
  tax_percent: number;
  terms: string;
  notes: string;
};

const EMPTY_FORM: TemplateFormState = {
  name: "",
  description: "",
  category: "Sales",
  validity_days: 30,
  discount_percent: 0,
  tax_percent: 18,
  terms: "Net 30 days",
  notes: "",
};

function computeLineTotal(item: Pick<TemplateDraftItem, "quantity" | "unit_price" | "discount_percent">) {
  return Number(item.quantity || 0) * Number(item.unit_price || 0) * (1 - Number(item.discount_percent || 0) / 100);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function createDraftItem(product: Product): TemplateDraftItem {
  return {
    id: `draft-${product.id}-${Date.now()}`,
    product_id: product.id,
    product_name: product.name,
    description: product.description || "",
    quantity: 1,
    unit_price: product.unit_price,
    discount_percent: 0,
    total: product.unit_price,
  };
}

export default function CPQTemplatesHubPage() {
  const navigate = useNavigate();
  const { tenantSlug = "" } = useParams<{ tenantSlug: string }>();
  const { data: templates = [], isLoading } = useQuoteTemplates();
  const { data: products = [] } = useProducts();
  const createTemplate = useCreateQuoteTemplate();
  const updateTemplate = useUpdateQuoteTemplate();
  const deleteTemplate = useDeleteQuoteTemplate();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuoteTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [formData, setFormData] = useState<TemplateFormState>(EMPTY_FORM);
  const [validityInput, setValidityInput] = useState(String(EMPTY_FORM.validity_days));
  const [draftItems, setDraftItems] = useState<TemplateDraftItem[]>([]);

  const editingTemplateId = editingTemplate?.id ?? "";
  const { data: editingItems = [], isLoading: isLoadingEditingItems } = useQuoteTemplateItems(editingTemplateId);

  useEffect(() => {
    if (!editingTemplate || !dialogOpen) {
      return;
    }

    setFormData({
      name: editingTemplate.name,
      description: editingTemplate.description || "",
      category: editingTemplate.category || "Sales",
      validity_days: editingTemplate.validity_days,
      discount_percent: editingTemplate.discount_percent,
      tax_percent: editingTemplate.tax_percent,
      terms: editingTemplate.terms || "Net 30 days",
      notes: editingTemplate.notes || "",
    });
    setValidityInput(String(editingTemplate.validity_days));
  }, [dialogOpen, editingTemplate]);

  useEffect(() => {
    if (!editingTemplate || !dialogOpen) {
      return;
    }

    setDraftItems(
      editingItems.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || "Untitled Item",
        description: item.description || "",
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || 0),
        discount_percent: Number(item.discount_percent || 0),
        total: Number(item.total || 0),
      })),
    );
  }, [dialogOpen, editingItems, editingTemplate]);

  const categories = useMemo(() => {
    const values = new Set<string>(["All"]);
    templates.forEach((template) => {
      if (template.category?.trim()) {
        values.add(template.category);
      }
    });
    return Array.from(values);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesCategory = activeCategory === "All" || (template.category || "Sales") === activeCategory;
      const matchesSearch =
        query.length === 0 ||
        template.name.toLowerCase().includes(query) ||
        (template.description || "").toLowerCase().includes(query) ||
        (template.category || "").toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, templates]);

  const stats = useMemo(() => {
    const activeTemplates = templates.filter((template) => template.is_active).length;
    const averageItems = templates.length > 0
      ? Math.round((templates.reduce((sum, template) => sum + template.item_count, 0) / templates.length) * 10) / 10
      : 0;
    const highestValue = templates.reduce((max, template) => Math.max(max, template.estimated_total), 0);

    return {
      total: templates.length,
      active: activeTemplates,
      averageItems,
      highestValue,
    };
  }, [templates]);

  const previewSubtotal = draftItems.reduce((sum, item) => sum + computeLineTotal(item), 0);
  const previewDiscount = previewSubtotal * (Number(formData.discount_percent || 0) / 100);
  const previewTaxable = previewSubtotal - previewDiscount;
  const previewTax = previewTaxable * (Number(formData.tax_percent || 0) / 100);
  const previewTotal = previewTaxable + previewTax;

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setSelectedProductId("");
    setFormData(EMPTY_FORM);
    setValidityInput(String(EMPTY_FORM.validity_days));
    setDraftItems([]);
    setDialogOpen(true);
  };

  const openEditDialog = (template: QuoteTemplate) => {
    setEditingTemplate(template);
    setSelectedProductId("");
    setDraftItems([]);
    setDialogOpen(true);
  };

  const handleUseTemplate = (templateId: string) => {
    navigate(tenantAppPath(tenantSlug, `cpq/quotes/new?template_id=${templateId}`));
  };

  const addSelectedProduct = () => {
    const product = products.find((entry) => entry.id === selectedProductId);
    if (!product) {
      return;
    }

    setDraftItems((prev) => [...prev, createDraftItem(product)]);
    setSelectedProductId("");
  };

  const updateDraftItem = (itemId: string, updates: Partial<TemplateDraftItem>) => {
    setDraftItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const nextItem = { ...item, ...updates };
        return { ...nextItem, total: computeLineTotal(nextItem) };
      }),
    );
  };

  const removeDraftItem = (itemId: string) => {
    setDraftItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) {
      toast.error("Template name is required.");
      return;
    }

    if (draftItems.length === 0) {
      toast.error("Add at least one default line item so the template is useful.");
      return;
    }

    const normalizedValidityDays =
      Number.isFinite(formData.validity_days) && formData.validity_days > 0
        ? Math.trunc(formData.validity_days)
        : 30;

    const payload = {
      ...formData,
      validity_days: normalizedValidityDays,
      items: draftItems.map((item, index) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        description: item.description,
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || 0),
        discount_percent: Number(item.discount_percent || 0),
        total: computeLineTotal(item),
        sort_order: index,
      })),
    };

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, ...payload });
      } else {
        await createTemplate.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch {
      // Mutation toasts already cover failures.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Quote Templates
          </Badge>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold md:text-3xl">Quote Templates</h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Create reusable quote setups with default pricing, terms, notes, and line items so the team can launch consistent proposals faster.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Quote Template
          </Button>
          <Button variant="outline" asChild>
            <Link to={tenantAppPath(tenantSlug, "cpq/quotes/new")}>Start Blank Quote</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-primary/10 p-3">
              <Layers3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Template Library</p>
              <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <FileStack className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Active Templates</p>
              <p className="mt-1 text-2xl font-semibold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-sky-500/10 p-3">
              <Package className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Avg Default Items</p>
              <p className="mt-1 text-2xl font-semibold">{stats.averageItems}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-amber-500/10 p-3">
              <BadgeIndianRupee className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Highest Template Total</p>
              <p className="mt-1 text-xl font-semibold">{formatCurrency(stats.highestValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
          <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            placeholder="Search templates by name, category, or idea..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-full border px-3 py-2 text-sm transition-colors",
                activeCategory === category
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {category}
            </button>
          ))}
        </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse border-border/70">
              <CardContent className="space-y-4 p-5">
                <div className="h-5 w-24 rounded bg-muted" />
                <div className="h-7 w-2/3 rounded bg-muted" />
                <div className="h-16 rounded bg-muted" />
                <div className="h-24 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="border-dashed border-border/70 shadow-sm">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Your quote library is still empty</h2>
                <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                  Start with the quote packages you sell most often: annual SaaS, onboarding bundles, hardware kits, or renewal offers.
                  Once saved, your team can launch a quote from that template in one click.
                </p>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Template
              </Button>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Standard SaaS Rollout",
                  "Annual Renewal",
                  "Starter Hardware Kit",
                  "Implementation + Support",
                ].map((idea) => (
                  <div key={idea} className="rounded-xl border border-border/60 bg-background p-4">
                    <p className="text-sm font-medium">{idea}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Save products, tax rules, notes, and commercial terms as a reusable template.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden border-border/70 shadow-sm transition-all hover:shadow-md">
              <CardHeader className="space-y-4 border-b border-border/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full px-2.5 py-1">
                        {template.category || "Sales"}
                      </Badge>
                      {!template.is_active && (
                        <Badge variant="outline" className="rounded-full px-2.5 py-1">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{template.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-3 min-h-[3.5rem]">
                        {template.description || "Reusable quote blueprint with packaged defaults for pricing, tax, and commercial notes."}
                      </CardDescription>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(template)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteTarget(template)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Estimated Total</p>
                    <p className="mt-2 text-lg font-semibold">{formatCurrency(template.estimated_total)}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Default Items</p>
                    <p className="mt-2 text-lg font-semibold">{template.item_count}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2.5 py-1">{template.validity_days} day validity</span>
                  <span className="rounded-full bg-muted px-2.5 py-1">{template.discount_percent}% default discount</span>
                  <span className="rounded-full bg-muted px-2.5 py-1">{template.tax_percent}% GST</span>
                </div>

                <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Commercial Notes</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/85">
                    {template.notes || template.terms || "No extra commercial notes yet. Add customer-facing context to make this template feel ready to send."}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="flex-1" onClick={() => handleUseTemplate(template.id)}>
                    <CopyPlus className="mr-2 h-4 w-4" />
                    Use Template
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => openEditDialog(template)}>
                    Refine Template
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex h-[92vh] max-h-[92vh] w-[96vw] max-w-6xl flex-col overflow-hidden border-border/70 p-0">
          <div className="min-h-0 flex-1 grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="min-h-0 space-y-6 overflow-y-auto p-6">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="text-2xl">
                  {editingTemplate ? "Refine Quote Template" : "Create Quote Template"}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6">
                  Package your best quote structure, default pricing logic, and line items into a reusable playbook the team can launch in one click.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="e.g. Standard SaaS Rollout"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Sales", "Renewal", "Hardware", "Services", "Enterprise"].map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Validity (Days)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={validityInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setValidityInput(nextValue);

                      if (nextValue.trim() === "") {
                        setFormData((prev) => ({ ...prev, validity_days: 0 }));
                        return;
                      }

                      const parsedValue = Number(nextValue);
                      if (!Number.isFinite(parsedValue)) {
                        return;
                      }

                      setFormData((prev) => ({
                        ...prev,
                        validity_days: Math.max(0, Math.trunc(parsedValue)),
                      }));
                    }}
                    onBlur={() => {
                      const parsedValue = Number(validityInput);
                      if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
                        setValidityInput("30");
                        setFormData((prev) => ({ ...prev, validity_days: 30 }));
                        return;
                      }

                      const normalizedValue = Math.trunc(parsedValue);
                      setValidityInput(String(normalizedValue));
                      setFormData((prev) => ({ ...prev, validity_days: normalizedValue }));
                    }}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Tell the team when to use this template and what kind of deal it supports."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Discount %</Label>
                  <Input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, discount_percent: Number(event.target.value || 0) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default GST %</Label>
                  <Input
                    type="number"
                    value={formData.tax_percent}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, tax_percent: Number(event.target.value || 0) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Payment Terms</Label>
                  <Textarea
                    value={formData.terms}
                    onChange={(event) => setFormData((prev) => ({ ...prev, terms: event.target.value }))}
                    placeholder="e.g. Net 30 days"
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Customer Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Optional guidance or positioning that should appear whenever this template is used."
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Default Line Items</h3>
                    <p className="text-sm text-muted-foreground">
                      Add the products and quantities that usually ship together for this quote motion.
                    </p>
                  </div>
                  {isLoadingEditingItems && editingTemplate && (
                    <Badge variant="outline">Loading items...</Badge>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="flex-1 bg-background">
                      <SelectValue placeholder="Choose a product to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.unit_price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addSelectedProduct} disabled={!selectedProductId}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </div>

                {draftItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
                    <AlertTriangle className="mx-auto h-5 w-5 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">No default items yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add at least one product so this template can launch a meaningful draft quote.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draftItems.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border/70 bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.description || "No extra item description"}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeDraftItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Qty</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(event) =>
                                updateDraftItem(item.id, { quantity: Number(event.target.value || 0) || 1 })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Price</Label>
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(event) =>
                                updateDraftItem(item.id, { unit_price: Number(event.target.value || 0) || 0 })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Disc %</Label>
                            <Input
                              type="number"
                              value={item.discount_percent}
                              onChange={(event) =>
                                updateDraftItem(item.id, { discount_percent: Number(event.target.value || 0) || 0 })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Line Total</Label>
                            <div className="flex h-10 items-center rounded-md border border-border/60 bg-muted/20 px-3 text-sm font-semibold">
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="min-h-0 overflow-y-auto border-t border-border/70 bg-muted/20 p-6 lg:border-l lg:border-t-0">
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live Preview</p>
                  <h3 className="mt-2 text-2xl font-semibold">{formData.name || "Untitled Template"}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {formData.description || "Describe the deal motion this template supports so the team knows when to use it."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <Card className="border-border/70 bg-background shadow-none">
                    <CardContent className="space-y-3 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Quote Defaults</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Validity</span>
                        <span>{validityInput.trim() === "" ? "-" : `${formData.validity_days} days`}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span>{formData.discount_percent}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">GST</span>
                        <span>{formData.tax_percent}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/70 bg-background shadow-none">
                    <CardContent className="space-y-3 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Estimated Outcome</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Items</span>
                        <span>{draftItems.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(previewSubtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Grand Total</span>
                        <span className="font-semibold text-foreground">{formatCurrency(previewTotal)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border/70 bg-background shadow-none">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Default Terms & Notes</p>
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Terms</span>
                      <span className="max-w-[65%] text-right text-foreground/90">
                        {formData.terms || "No payment terms yet."}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Notes</span>
                      <span className="max-w-[65%] text-right text-foreground/90">
                        {formData.notes || "No customer notes yet."}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>

          <DialogFooter className="shrink-0 border-t border-border/70 bg-background px-6 py-4">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} disabled={createTemplate.isPending || updateTemplate.isPending}>
                {editingTemplate ? "Save Template Changes" : "Create Template"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quote template?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the template and its default line items from the CPQ library. Existing quotes created from it will stay untouched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteTemplate.mutate(deleteTarget.id);
                }
                setDeleteTarget(null);
              }}
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
