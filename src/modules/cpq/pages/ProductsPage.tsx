import { useEffect, useState } from "react";
import { Edit, IndianRupee, Package, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from "@/modules/cpq/hooks/useCPQ";
import type { Product } from "@/core/types/cpq";
import { useSearch } from "@/core/hooks/useSearch";
import { useCRUD } from "@/core/rbac/usePermissions";
import { ExportButton } from "@/ui/export-button";
import { FilterBar } from "@/ui/filter-bar";
import { PlanLimitBanner } from "@/ui/plan-limit-banner";
import { SearchBar } from "@/ui/search-bar";
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
import { Badge } from "@/ui/shadcn/badge";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/shadcn/dialog";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/shadcn/select";
import { Switch } from "@/ui/shadcn/switch";
import { Textarea } from "@/ui/shadcn/textarea";

const PRODUCT_FILTERS = [
  {
    key: "category",
    label: "Category",
    options: [
      { label: "CPQ", value: "CPQ" },
      { label: "CLM", value: "CLM" },
      { label: "CRM", value: "CRM" },
      { label: "E-Signature", value: "E-Signature" },
      { label: "Analytics", value: "Analytics" },
      { label: "Integration", value: "Integration" },
      { label: "Documents", value: "Documents" },
      { label: "Bundle", value: "Bundle" },
    ],
  },
  {
    key: "is_active",
    label: "Status",
    options: [
      { label: "Active", value: "true" },
      { label: "Inactive", value: "false" },
    ],
  },
];

const categories = [
  "CPQ",
  "CLM",
  "CRM",
  "E-Signature",
  "Analytics",
  "Integration",
  "Documents",
  "Bundle",
];

export default function ProductsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState<string>("CPQ");
  const [formUnitPrice, setFormUnitPrice] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");

  const { data: products, isLoading } = useProducts({ includeInactive: showInactive });
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const { canDelete } = useCRUD();

  const {
    searchQuery,
    setSearchQuery,
    activeFilters,
    setFilter,
    clearFilters,
    filteredData,
    resultCount,
    totalCount,
    filterDefs,
  } = useSearch<Product>(products ?? [], {
    searchFields: ["name", "sku", "description"],
    filterDefs: PRODUCT_FILTERS,
    customFilters: {
      is_active: (item: Product, value: string) => String(item.is_active) === value,
    },
  });

  useEffect(() => {
    if (!isDialogOpen) {
      return;
    }

    if (editingProduct) {
      setFormName(editingProduct.name || "");
      setFormSku(editingProduct.sku || "");
      setFormCategory(editingProduct.category || "CPQ");
      setFormUnitPrice(editingProduct.unit_price != null ? String(editingProduct.unit_price) : "");
      setFormDescription(editingProduct.description || "");
      return;
    }

    setFormName("");
    setFormSku("");
    setFormCategory("CPQ");
    setFormUnitPrice("");
    setFormDescription("");
  }, [editingProduct, isDialogOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedPrice = parseFloat(formUnitPrice || "0");
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const product = {
      name: formName,
      sku: formSku,
      description: formDescription,
      unit_price: parsedPrice,
      category: formCategory,
      is_active: true,
    };

    if (editingProduct) {
      updateMutation.mutate(
        { id: editingProduct.id, ...product },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingProduct(null);
          },
        },
      );
    } else {
      createMutation.mutate(product, {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <PlanLimitBanner resource="products" className="mb-4" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold md:text-3xl">Product Catalog</h1>
          <p className="text-sm text-muted-foreground md:text-base">Manage your products and pricing</p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton data={products ?? []} filename="siswit-products" sheetName="Products" isLoading={isLoading} />
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingProduct(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingProduct(null);
                }}
              >
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Add Product</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                <DialogDescription>
                  Add the core product details and the standard selling price.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="category" value={formCategory} />

                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Enterprise CPQ Suite"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. CPQ-ENT-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formCategory} onValueChange={(value: string) => setFormCategory(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price (INR)</Label>
                  <Input
                    id="unit_price"
                    name="unit_price"
                    type="number"
                    step="0.01"
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(e.target.value)}
                    placeholder="e.g. 4999"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the standard selling price for one item, product, service, license, or bundle.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Short summary of what this product includes and how it should be quoted."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingProduct ? "Update" : "Create"} Product
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search products..."
            resultCount={resultCount}
            totalCount={totalCount}
          />
          <ExportButton data={filteredData} filename="siswit-products" sheetName="Products" isLoading={isLoading} />
        </div>
        <FilterBar filters={filterDefs} activeFilters={activeFilters} onFilterChange={setFilter} onClearAll={clearFilters} />
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={showInactive} onCheckedChange={setShowInactive} id="show-inactive" />
        <label htmlFor="show-inactive" className="cursor-pointer text-sm text-muted-foreground">
          Show inactive products
        </label>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="h-48" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredData?.map((product) => (
            <Card key={product.id} className="group rounded-xl transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 md:h-10 md:w-10">
                      <Package className="h-4 w-4 text-primary md:h-5 md:w-5" />
                    </div>

                    <div className="leading-tight">
                      <CardTitle className="text-base font-semibold md:text-lg">{product.name}</CardTitle>
                      <p className="text-[11px] text-muted-foreground md:text-xs">{product.sku}</p>
                    </div>
                  </div>

                  <Badge
                    variant={product.is_active ? "default" : "secondary"}
                    className="text-[11px] md:text-xs"
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      <span className="text-lg font-semibold md:text-xl">{formatCurrency(product.unit_price)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Standard quote price</p>
                  </div>
                  <Badge variant="outline" className="text-[11px] md:text-xs">
                    {product.category}
                  </Badge>
                </div>

                <div className="flex gap-2 pt-2 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1"
                    onClick={() => {
                      setEditingProduct(product);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {canDelete() && (
                    <AlertDialog
                      open={productToDelete?.id === product.id}
                      onOpenChange={(open) => !open && setProductToDelete(null)}
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setProductToDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Delete {product.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                              deleteMutation.mutate(product.id);
                              setProductToDelete(null);
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredData?.length === 0 && (
        <div className="py-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
