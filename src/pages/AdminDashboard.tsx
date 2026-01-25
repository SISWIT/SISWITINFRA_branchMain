import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/roles";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Loader2, ShieldAlert, UserCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SignupRequest {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  status: string;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("signup_requests" as any) 
        .select("*")
        .eq('status', 'pending')
        .order("created_at", { ascending: false });

      if (error) throw error;

      // FIX: Use double casting (as unknown as SignupRequest[])
      setRequests((data as unknown as SignupRequest[]) || []);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching requests",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (request: SignupRequest) => {
    try {
      // 1. Assign the role (user_roles table exists in types, so no 'as any' needed usually, 
      // but if you get errors here too, add it)
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: request.user_id,
          role: AppRole.EMPLOYEE, 
        });

      if (roleError) throw roleError;

      // 2. Remove from pending list
      // FIX: Cast to 'any' here as well
      const { error: deleteError } = await supabase
        .from("signup_requests" as any) 
        .delete()
        .eq("id", request.id);

      if (deleteError) {
        console.error("Failed to delete request row", deleteError);
      }

      toast({
        title: "User Approved",
        description: `${request.email} can now log in.`,
      });

      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error.message,
      });
    }
  };

  const handleReject = async (request: SignupRequest) => {
    if (!confirm(`Reject access for ${request.email}?`)) return;

    try {
      // FIX: Cast to 'any' here as well
      const { error } = await supabase
        .from("signup_requests" as any)
        .delete()
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "The signup request has been removed.",
      });

      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: error.message,
      });
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage incoming signup requests.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <ShieldAlert className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
              <p className="text-xs text-muted-foreground">Waiting for approval</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Access Requests
            </CardTitle>
            <CardDescription>
              Users who have signed up but do not have a role yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                <Check className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No pending signup requests.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>User Details</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Date Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => (
                      <TableRow key={req.id} className="hover:bg-muted/5">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-foreground">{req.first_name} {req.last_name}</span>
                            <span className="text-xs text-muted-foreground lg:hidden">{req.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{req.email}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(req.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
                            Pending Approval
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleReject(req)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                              onClick={() => handleApprove(req)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}