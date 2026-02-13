import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, Plus, Search, MoreVertical, Edit, Copy, 
  Trash2, FileStack, Clock, User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const templates = [
  { id: "1", name: "Sales Agreement", category: "Contract", uses: 156, lastUpdated: "2 days ago", createdBy: "Admin" },
  { id: "2", name: "Quote Proposal", category: "Quote", uses: 289, lastUpdated: "1 week ago", createdBy: "Sales Team" },
  { id: "3", name: "Non-Disclosure Agreement", category: "NDA", uses: 87, lastUpdated: "3 days ago", createdBy: "Legal" },
  { id: "4", name: "Service Level Agreement", category: "Contract", uses: 45, lastUpdated: "1 month ago", createdBy: "Operations" },
  { id: "5", name: "Invoice Template", category: "Invoice", uses: 512, lastUpdated: "5 days ago", createdBy: "Finance" },
  { id: "6", name: "Employment Offer Letter", category: "HR", uses: 34, lastUpdated: "2 weeks ago", createdBy: "HR Team" },
];

const categories = ["All", "Contract", "Quote", "NDA", "Invoice", "HR"];

const DocumentTemplatesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Document Templates</h1>
            <p className="text-muted-foreground">Manage and create reusable document templates</p>
          </div>
          <Button variant="hero">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-card-hover transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="w-4 h-4 mr-2" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold text-foreground mb-2">{template.name}</h3>
              <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground mb-4">
                {template.category}
              </span>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileStack className="w-4 h-4" />
                  <span>{template.uses} documents generated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Updated {template.lastUpdated}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Created by {template.createdBy}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button size="sm" className="flex-1">
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
  );
};

export default DocumentTemplatesPage;
