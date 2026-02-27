import { useMemo } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  Clock3,
  MoreHorizontal,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/core/auth/useAuth";
import { useTenant } from "@/core/tenant/useTenant";
import { cn } from "@/core/utils/utils";
import { Badge } from "@/ui/shadcn/badge";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";
import { Progress } from "@/ui/shadcn/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/shadcn/table";

interface KPIItem {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  emphasis?: boolean;
}

interface VacancyItem {
  role: string;
  type: string;
  location: string;
  salary: string;
  applicants: number;
}

interface TaskItem {
  title: string;
  team: string;
  progress: number;
  dueDate: string;
}

interface ScheduleItem {
  time: string;
  title: string;
  team: string;
  tone: string;
}

const kpiItems: KPIItem[] = [
  { label: "Applications", value: "1,534", delta: "+12.7%", positive: true, emphasis: true },
  { label: "Shortlisted", value: "869", delta: "-1.9%", positive: false },
  { label: "Hired", value: "236", delta: "+8.3%", positive: true },
  { label: "Rejected", value: "429", delta: "-2.8%", positive: false },
];

const applicationChartData = [
  { name: "13 May", applied: 312, shortlisted: 58 },
  { name: "14 May", applied: 341, shortlisted: 126 },
  { name: "15 May", applied: 297, shortlisted: 52 },
  { name: "16 May", applied: 334, shortlisted: 104 },
  { name: "17 May", applied: 285, shortlisted: 64 },
  { name: "18 May", applied: 354, shortlisted: 117 },
];

const departmentData = [
  { name: "Engineering", value: 120, color: "hsl(var(--primary))" },
  { name: "Marketing", value: 110, color: "hsl(var(--chart-2))" },
  { name: "Sales", value: 95, color: "hsl(var(--chart-3))" },
  { name: "Customer Support", value: 85, color: "hsl(var(--chart-4))" },
  { name: "Finance", value: 65, color: "hsl(var(--chart-5))" },
  { name: "Human Resources", value: 50, color: "hsl(var(--accent-foreground))" },
];

const applicantResourceData = [
  { name: "Job Boards", value: 350, color: "hsl(var(--primary))" },
  { name: "Employee Referrals", value: 200, color: "hsl(var(--chart-2))" },
  { name: "Social Campaigns", value: 300, color: "hsl(var(--chart-3))" },
  { name: "Recruitment Agencies", value: 150, color: "hsl(var(--chart-4))" },
];

const vacancyItems: VacancyItem[] = [
  { role: "Software Developer", type: "Full-time", location: "Remote", salary: "$70K - $90K/yr", applicants: 120 },
  { role: "Graphic Designer", type: "Part-time", location: "Hybrid", salary: "$40K - $55K/yr", applicants: 75 },
  { role: "Sales Manager", type: "Full-time", location: "On-site", salary: "$65K - $80K/yr", applicants: 75 },
  { role: "HR Coordinator", type: "Contract", location: "Remote", salary: "$50K - $60K/yr", applicants: 60 },
];

const taskItems: TaskItem[] = [
  { title: "Resume Screening", team: "Evaluation", progress: 40, dueDate: "May 27, 2027" },
  { title: "Interview Scheduling", team: "Engagement", progress: 60, dueDate: "May 20, 2027" },
  { title: "Candidate Communication", team: "Relationship", progress: 30, dueDate: "May 23, 2027" },
  { title: "Offer Management", team: "Selection", progress: 50, dueDate: "May 25, 2027" },
];

const scheduleItems: ScheduleItem[] = [
  { time: "1:00 PM", title: "Marketing Strategy Presentation", team: "Marketing", tone: "bg-chart-2/20 text-foreground" },
  { time: "2:30 PM", title: "HR Policy Update Session", team: "Human Resources", tone: "bg-primary/15 text-foreground" },
  { time: "4:00 PM", title: "Customer Feedback Analysis", team: "Customer Support", tone: "bg-chart-3/20 text-foreground" },
  { time: "5:30 PM", title: "Financial Reporting Session", team: "Finance", tone: "bg-chart-4/20 text-foreground" },
];

const applicants = [
  { name: "Alex Boide", email: "a.boide@hirezy.com", role: "Software Engineer", date: "Apr 15, 2027", employment: "Full-time", status: "Interviewing" },
  { name: "Alice Johnson", email: "a.johnson@hirezy.com", role: "HR Specialist", date: "Apr 10, 2027", employment: "Contract", status: "Shortlisted" },
  { name: "Bob Lee", email: "b.lee@hirezy.com", role: "Marketing Analyst", date: "Apr 09, 2027", employment: "Full-time", status: "Screening" },
  { name: "Darren Wright", email: "d.wright@hirezy.com", role: "Sales Manager", date: "Apr 07, 2027", employment: "Full-time", status: "Interviewing" },
];

const recentActivities = [
  { title: "Darren Wright viewed 15 candidate profiles for Software Developer.", time: "10:15 AM" },
  { title: "Caren Smith scheduled interviews with 3 candidates for Marketing Manager.", time: "9:50 AM" },
  { title: "Automated reminder sent to Bob Lee to complete interview feedback.", time: "9:30 AM" },
];

const applicantTabs = ["All Applicants", "Screening", "Shortlisted", "Interviewing", "Job Offer"];

export default function OrganizationAdminDashboard() {
  const { user } = useAuth();
  const { tenant } = useTenant();

  const userName = useMemo(() => {
    const firstName = String(user?.user_metadata?.first_name ?? "").trim();
    const lastName = String(user?.user_metadata?.last_name ?? "").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;
    return user?.email?.split("@")[0] ?? "Admin";
  }, [user?.email, user?.user_metadata]);

  const orgName = tenant?.company_name || tenant?.name || "Your Workspace";
  const departmentTotal = departmentData.reduce((sum, item) => sum + item.value, 0);
  const resourceTotal = applicantResourceData.reduce((sum, item) => sum + item.value, 0);
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Hiring operations summary for {orgName}.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[300px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search candidate, vacancy, etc."
                className="h-10 rounded-xl border-border/70 bg-background pl-9"
              />
            </div>
            <Button variant="outline" size="sm" className="h-10 rounded-xl">
              <CalendarDays className="mr-2 h-4 w-4" />
              Today
            </Button>
            <div className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-primary/15 px-3 text-sm font-semibold text-primary">
              {userInitial || "A"}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-9">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpiItems.map((item) => (
              <Card
                key={item.label}
                className={cn(
                  "border-border/70 shadow-sm",
                  item.emphasis && "border-primary/40 bg-primary/15",
                )}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold leading-tight">{item.value}</p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "mt-3 border-0 bg-background/80 px-2 py-0.5 text-[11px] font-medium",
                      item.positive ? "text-primary" : "text-destructive",
                    )}
                  >
                    {item.positive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                    {item.delta}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-lg">Applications</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs text-muted-foreground">
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  13-18 May
                </Button>
              </CardHeader>
              <CardContent className="h-[250px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applicationChartData} barGap={10}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                      contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
                    />
                    <Bar dataKey="applied" name="Applied" fill="hsl(var(--primary) / 0.55)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="shortlisted" name="Shortlisted" fill="hsl(var(--chart-2) / 0.8)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-lg">Applications by Department</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs text-muted-foreground">
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  Today
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 pt-4 sm:grid-cols-[170px_1fr]">
                <div className="relative h-[170px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={2}
                      >
                        {departmentData.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-semibold">{departmentTotal}</span>
                    <span className="text-xs text-muted-foreground">Total Applications</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {departmentData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-primary/30 bg-gradient-to-b from-primary/15 via-card to-card shadow-sm xl:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Applicant Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative mx-auto h-[180px] w-full max-w-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={applicantResourceData} dataKey="value" innerRadius={56} outerRadius={78} paddingAngle={4}>
                    {applicantResourceData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold">{resourceTotal.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">Total Applicants</span>
              </div>
            </div>

            <div className="grid gap-2">
              {applicantResourceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-background/70 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Card className="border-border/70 shadow-sm xl:col-span-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Current Vacancies</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs">
              See All
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {vacancyItems.map((vacancy) => (
              <article key={vacancy.role} className="rounded-xl border border-border/70 bg-background/80 p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold leading-tight">{vacancy.role}</h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="bg-muted px-2 py-0.5 text-[11px]">{vacancy.type}</Badge>
                  <Badge variant="secondary" className="bg-muted px-2 py-0.5 text-[11px]">{vacancy.location}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{vacancy.salary}</span>
                  <span className="text-muted-foreground">{vacancy.applicants} Applicants</span>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Tasks</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {taskItems.map((task) => (
              <article key={task.title} className="space-y-2.5 rounded-xl border border-border/70 bg-background/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.team}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-2.5 bg-muted/60" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  Due {task.dueDate}
                </div>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Schedule</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs text-muted-foreground">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              Today
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {scheduleItems.map((event) => (
              <article key={event.time + event.title} className="grid grid-cols-[56px_1fr] items-start gap-2.5">
                <p className="pt-1 text-xs text-muted-foreground">{event.time}</p>
                <div className={cn("rounded-xl border border-border/50 px-3 py-2.5", event.tone)}>
                  <p className="text-sm font-semibold leading-snug">{event.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{event.team}</p>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Card className="border-border/70 shadow-sm xl:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Applicants List (1,242)</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs">
              See All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {applicantTabs.map((tab, index) => (
                <Badge
                  key={tab}
                  variant={index === 0 ? "default" : "secondary"}
                  className={cn("rounded-full px-3 py-1 text-[11px]", index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                >
                  {tab}
                </Badge>
              ))}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Employment Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.map((applicant) => (
                  <TableRow key={applicant.email}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{applicant.name}</p>
                        <p className="text-xs text-muted-foreground">{applicant.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{applicant.role}</TableCell>
                    <TableCell>{applicant.date}</TableCell>
                    <TableCell>{applicant.employment}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                        {applicant.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm xl:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.map((activity) => (
              <article key={activity.title} className="rounded-xl border border-border/70 bg-background/75 p-3">
                <p className="text-sm leading-relaxed">{activity.title}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">{activity.time}</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
