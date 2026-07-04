import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  CloudUpload,
  Command,
  Compass,
  FileCheck2,
  FileSearch,
  FileText,
  Filter,
  Globe2,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageCircleMore,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  UserRound,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  claims as seedClaims,
  communications as seedCommunications,
  customers as seedCustomers,
  discovery as seedDiscovery,
  tasks as seedTasks,
  timeline,
} from "./data";
import { api } from "./api";
import type {
  Communication,
  Customer,
  CustomerStatus,
  Page,
  Priority,
  Task,
} from "./types";

const currency = (value: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(value);

const shortDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}${value.includes("T") ? "" : "T12:00:00"}`));

const timeAgo = (value: string) => {
  const diff = new Date("2026-07-03T12:00:00").getTime() - new Date(value).getTime();
  const hours = Math.max(1, Math.floor(diff / 3_600_000));
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
};

const daysUntil = (value: string) =>
  Math.ceil(
    (new Date(`${value}T12:00:00`).getTime() -
      new Date("2026-07-03T12:00:00").getTime()) /
      86_400_000,
  );

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

const statusTone: Record<CustomerStatus, string> = {
  Opportunity: "violet",
  Lead: "sky",
  Application: "amber",
  Quoted: "orange",
  Submitted: "indigo",
  Bound: "emerald",
  Current: "emerald",
  Renewal: "rose",
  Lost: "slate",
  Archived: "slate",
};

const navGroups = [
  {
    label: "Workspace",
    items: [
      { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
      { id: "customers" as Page, label: "Customers", icon: Users },
      { id: "communications" as Page, label: "Communications", icon: MessageCircleMore, count: 3 },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { id: "analyzer" as Page, label: "Policy Analyzer", icon: FileSearch },
      { id: "discovery" as Page, label: "Discovery", icon: Compass, count: 3 },
      { id: "automations" as Page, label: "Automations", icon: Zap },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "claims" as Page, label: "Claims & Renewals", icon: ShieldCheck },
      { id: "reports" as Page, label: "Reports", icon: BarChart3 },
      { id: "admin" as Page, label: "Admin", icon: Settings2 },
    ],
  },
];

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const palette = ["forest", "plum", "gold", "blue"];
  const color = palette[name.length % palette.length];
  return <span className={`avatar ${size} ${color}`}>{initials(name)}</span>;
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Inbox;
  title: string;
  body: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={22} /></span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="login-brand">
          <span className="brand-mark"><ShieldCheck size={22} /></span>
          <span>Strategic</span>
        </div>
        <div className="story-copy">
          <Badge tone="mint">The modern agency operating system</Badge>
          <h1>Know what matters.<br />Act before it’s urgent.</h1>
          <p>
            One clear view of every relationship, renewal, claim, and opportunity—made
            for independent insurance teams.
          </p>
          <div className="story-proof">
            <div><strong>12.4 hrs</strong><span>saved per producer each week</span></div>
            <div><strong>18%</strong><span>higher renewal retention</span></div>
            <div><strong>3.2×</strong><span>faster customer response</span></div>
          </div>
        </div>
        <p className="login-quote">
          “It finally feels like our book of business is working with us.”
          <span>— Morgan Pierce, Agency Principal</span>
        </p>
      </section>
      <section className="login-form-wrap">
        <form
          className="login-card"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setLoading(true);
            setError("");
            try {
              await onLogin(String(form.get("email")), String(form.get("password")));
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Unable to sign in");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="login-mobile-brand">
            <span className="brand-mark"><ShieldCheck size={22} /></span>
            <strong>Strategic</strong>
          </div>
          <div>
            <span className="eyebrow">Welcome back</span>
            <h2>Sign in to your agency</h2>
            <p>Use the demo workspace to explore the full experience.</p>
          </div>
          <label>
            Work email
            <input name="email" type="email" defaultValue="alex@northstaragency.com" />
          </label>
          <label>
            Password
            <div className="input-with-icon">
              <LockKeyhole size={16} />
              <input name="password" type="password" defaultValue="strategicdemo" />
            </div>
          </label>
          <div className="form-row">
            <label className="check-label"><input type="checkbox" defaultChecked /> Remember me</label>
            <button type="button" className="text-button">Forgot password?</button>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="button primary large" type="submit" disabled={loading}>
            {loading ? "Connecting…" : "Open demo workspace"} {!loading && <ArrowRight size={17} />}
          </button>
          <p className="secure-note"><ShieldCheck size={14} /> Protected with agency-grade security</p>
        </form>
      </section>
    </main>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("strategic-token") ?? "");
  const [signedIn, setSignedIn] = useState(() => Boolean(localStorage.getItem("strategic-token")));
  const [dataStatus, setDataStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("cus-001");
  const [customers, setCustomers] = useState(seedCustomers);
  const [tasks, setTasks] = useState(seedTasks);
  const [communications, setCommunications] = useState(seedCommunications);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!signedIn || !token) return;
    let cancelled = false;
    setDataStatus("connecting");
    Promise.all([api.getCustomers(token), api.getDashboard(token)])
      .then(([customerData, dashboardData]) => {
        if (cancelled) return;
        setCustomers(customerData.customers);
        setTasks(dashboardData.tasks);
        setCommunications(dashboardData.communications);
        setDataStatus("online");
      })
      .catch(() => {
        if (!cancelled) setDataStatus("offline");
      });
    return () => { cancelled = true; };
  }, [signedIn, token]);

  const navigate = (next: Page) => {
    setPage(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCustomer = (id: string) => {
    setSelectedCustomerId(id);
    navigate("customer");
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const toggleTask = (id: string) => {
    const current = tasks.find((task) => task.id === id);
    if (!current) return;
    setTasks((items) => items.map((task) => task.id === id ? { ...task, completed: !task.completed } : task));
    if (token) void api.updateTask(token, id, !current.completed).catch(() => {
      setTasks((items) => items.map((task) => task.id === id ? current : task));
      notify("Could not save task");
    });
  };

  if (!signedIn) {
    return (
      <Login
        onLogin={async (email, password) => {
          const session = await api.login(email, password);
          localStorage.setItem("strategic-token", session.token);
          setToken(session.token);
          setSignedIn(true);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <div className="brand-lockup">
            <span className="brand-mark"><ShieldCheck size={20} /></span>
            <div><strong>Strategic</strong><small>Insurance CRM</small></div>
          </div>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <button className="agency-switcher">
          <span className="agency-logo">NA</span>
          <span><strong>Northstar Agency</strong><small>Professional plan</small></span>
          <ChevronDown size={15} />
        </button>
        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-label">{group.label}</span>
              {group.items.map(({ id, label, icon: Icon, count }) => (
                <button
                  key={id}
                  className={`nav-item ${page === id ? "active" : ""}`}
                  onClick={() => navigate(id)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {count ? <em>{count}</em> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="ai-credit">
            <div><Sparkles size={15} /><strong>AI usage</strong><span>72%</span></div>
            <div className="progress"><i style={{ width: "72%" }} /></div>
            <small>7,240 of 10,000 credits</small>
          </div>
          <button className="profile-button">
            <Avatar name="Alex Morgan" />
            <span><strong>Alex Morgan</strong><small>Agency Owner</small></span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="global-search">
            <Search size={17} />
            <input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search customers, policies, claims…"
            />
            <kbd>⌘ K</kbd>
            {globalSearch && (
              <div className="search-results">
                {customers
                  .filter((c) => `${c.company} ${c.contact} ${c.email}`.toLowerCase().includes(globalSearch.toLowerCase()))
                  .slice(0, 4)
                  .map((customer) => (
                    <button key={customer.id} onClick={() => { setGlobalSearch(""); openCustomer(customer.id); }}>
                      <Avatar name={customer.company} size="sm" />
                      <span><strong>{customer.company}</strong><small>{customer.contact} · {customer.status}</small></span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
              </div>
            )}
          </div>
          <div className="topbar-actions">
            <span className={`data-status ${dataStatus}`}><i />{dataStatus === "online" ? "Database connected" : dataStatus === "connecting" ? "Connecting" : "Offline demo"}</span>
            <button className="quick-create" onClick={() => navigate("customers")}><Plus size={16} /><span>Create</span><ChevronDown size={14} /></button>
            <button className="icon-button notification"><Bell size={19} /><i /></button>
            <span className="top-avatar"><Avatar name="Alex Morgan" size="sm" /></span>
          </div>
        </header>

        <main className="content">
          {page === "dashboard" && (
            <Dashboard
              customers={customers}
              tasks={tasks}
              communications={communications}
              onOpenCustomer={openCustomer}
              onNavigate={navigate}
              onCompleteTask={toggleTask}
            />
          )}
          {page === "customers" && (
            <CustomersPage
              customers={customers}
              onOpenCustomer={openCustomer}
              onAdd={async (customer) => {
                const saved = token ? (await api.createCustomer(token, customer)).customer : customer;
                setCustomers((current) => [saved, ...current]);
                notify(`${saved.company} added`);
              }}
            />
          )}
          {page === "customer" && (
            <CustomerWorkspace
              customer={customers.find((c) => c.id === selectedCustomerId) ?? customers[0]}
              tasks={tasks}
              communications={communications}
              onBack={() => navigate("customers")}
              onMessage={async (message) => {
                const saved = token
                  ? (await api.createCommunication(token, message.customerId, message)).communication
                  : message;
                setCommunications((current) => [saved, ...current]);
                return saved;
              }}
              onToggleTask={toggleTask}
              onAddTask={async (customerId, input) => {
                const saved = token
                  ? (await api.createTask(token, customerId, input)).task
                  : { id: `task-${Date.now()}`, customerId, completed: false, ...input };
                setTasks((current) => [...current, saved]);
                notify("Task added");
              }}
              notify={notify}
            />
          )}
          {page === "analyzer" && <AnalyzerPage notify={notify} onOpenCustomer={() => openCustomer("cus-001")} />}
          {page === "discovery" && <DiscoveryPage notify={notify} />}
          {page === "claims" && <ClaimsPage customers={customers} onOpenCustomer={openCustomer} />}
          {page === "communications" && (
            <CommunicationsPage customers={customers} communications={communications} onOpenCustomer={openCustomer} />
          )}
          {page === "automations" && <AutomationsPage notify={notify} />}
          {page === "reports" && <ReportsPage customers={customers} onOpenCustomer={openCustomer} />}
          {page === "admin" && <AdminPage notify={notify} />}
        </main>
      </div>
      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}

function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

function Dashboard({
  customers,
  tasks,
  communications,
  onOpenCustomer,
  onNavigate,
  onCompleteTask,
}: {
  customers: Customer[];
  tasks: Task[];
  communications: Communication[];
  onOpenCustomer: (id: string) => void;
  onNavigate: (page: Page) => void;
  onCompleteTask: (id: string) => void;
}) {
  const pipelineData = [
    { month: "Feb", premium: 72 },
    { month: "Mar", premium: 88 },
    { month: "Apr", premium: 79 },
    { month: "May", premium: 112 },
    { month: "Jun", premium: 128 },
    { month: "Jul", premium: 143 },
  ];
  const book = customers.reduce((sum, customer) => sum + customer.estimatedPremium, 0);
  const activeTasks = tasks.filter((task) => !task.completed);
  const renewals = customers.filter((customer) => {
    const days = daysUntil(customer.renewalDate);
    return days >= 0 && days <= 120;
  });

  return (
    <>
      <PageTitle
        eyebrow="Friday, July 3"
        title="Good morning, Alex."
        description="Here’s what needs your attention across the agency."
        actions={
          <>
            <button className="button secondary"><CalendarClock size={17} />Today</button>
            <button className="button primary" onClick={() => onNavigate("customers")}><Plus size={17} />New customer</button>
          </>
        }
      />
      <section className="metric-grid">
        <article className="metric-card accent">
          <div><span className="metric-icon"><CircleDollarSign size={19} /></span><Badge tone="mint">+12.8%</Badge></div>
          <strong>{currency(book, true)}</strong>
          <span>Active premium</span>
          <small>Across {customers.length} accounts</small>
        </article>
        <article className="metric-card">
          <div><span className="metric-icon amber"><CalendarClock size={19} /></span><Badge tone="amber">Next 120 days</Badge></div>
          <strong>{renewals.length}</strong>
          <span>Renewals approaching</span>
          <small>{currency(renewals.reduce((sum, c) => sum + c.estimatedPremium, 0), true)} at risk</small>
        </article>
        <article className="metric-card">
          <div><span className="metric-icon blue"><ListChecks size={19} /></span><Badge tone="rose">{activeTasks.filter((t) => t.due <= "2026-07-03").length} due</Badge></div>
          <strong>{activeTasks.length}</strong>
          <span>Open tasks</span>
          <small>{activeTasks.filter((t) => t.due < "2026-07-03").length} overdue</small>
        </article>
        <article className="metric-card">
          <div><span className="metric-icon violet"><Sparkles size={19} /></span><Badge tone="violet">High confidence</Badge></div>
          <strong>{seedDiscovery.length}</strong>
          <span>AI opportunities</span>
          <small>{currency(seedDiscovery.reduce((sum, opp) => sum + opp.premium, 0), true)} potential</small>
        </article>
      </section>

      <section className="dashboard-layout">
        <div className="dashboard-main">
          <article className="panel focus-panel">
            <div className="panel-header">
              <div><span className="eyebrow">Priority queue</span><h2>Your focus today</h2></div>
              <button className="text-button" onClick={() => onNavigate("customers")}>View all <ArrowRight size={15} /></button>
            </div>
            <div className="focus-list">
              <button className="focus-row" onClick={() => onOpenCustomer("cus-001")}>
                <span className="focus-marker urgent"><AlertTriangle size={18} /></span>
                <span className="focus-body">
                  <span><Badge tone="rose">Renewal · 46 days</Badge><small>Timberline Outdoor Supply</small></span>
                  <strong>New vehicle exposure needs review before marketing</strong>
                  <em>Premium at risk {currency(48200)} · Owner Alex Morgan</em>
                </span>
                <ArrowRight size={17} />
              </button>
              <button className="focus-row" onClick={() => onOpenCustomer("cus-004")}>
                <span className="focus-marker amber"><FileText size={18} /></span>
                <span className="focus-body">
                  <span><Badge tone="amber">Application</Badge><small>Red Peak Construction</small></span>
                  <strong>Loss runs and payroll detail still outstanding</strong>
                  <em>Potential premium {currency(87500)} · Last touch 2 days ago</em>
                </span>
                <ArrowRight size={17} />
              </button>
              <button className="focus-row" onClick={() => onNavigate("discovery")}>
                <span className="focus-marker violet"><Sparkles size={18} /></span>
                <span className="focus-body">
                  <span><Badge tone="violet">AI discovered · 94 score</Badge><small>Apex Electric & Solar</small></span>
                  <strong>Workers compensation review opportunity</strong>
                  <em>Estimated premium {currency(69200)} · Unassigned</em>
                </span>
                <ArrowRight size={17} />
              </button>
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div><span className="eyebrow">Production</span><h2>Premium momentum</h2></div>
              <button className="filter-button">Last 6 months <ChevronDown size={14} /></button>
            </div>
            <div className="chart-summary">
              <div><strong>$143K</strong><span>Bound premium this month</span></div>
              <div><strong>24.6%</strong><span>Quote-to-bind rate</span></div>
              <div><strong>18 days</strong><span>Average sales cycle</span></div>
            </div>
            <div className="area-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pipelineData} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="premiumFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1f776d" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#1f776d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e7ebe8" strokeDasharray="4 4" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#7a8580", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7a8580", fontSize: 12 }} tickFormatter={(v) => `$${v}K`} />
                  <Tooltip formatter={(value) => [`$${value}K`, "Bound premium"]} />
                  <Area type="monotone" dataKey="premium" stroke="#1f776d" strokeWidth={2.5} fill="url(#premiumFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>

        <aside className="dashboard-side">
          <article className="panel compact-panel">
            <div className="panel-header">
              <div><span className="eyebrow">My work</span><h2>Tasks</h2></div>
              <button className="icon-button"><Plus size={17} /></button>
            </div>
            <div className="task-list">
              {activeTasks.slice(0, 4).map((task) => {
                const customer = customers.find((item) => item.id === task.customerId)!;
                return (
                  <div className="task-row" key={task.id}>
                    <button className="task-check" onClick={() => onCompleteTask(task.id)}><Check size={13} /></button>
                    <button className="task-copy" onClick={() => onOpenCustomer(task.customerId)}>
                      <strong>{task.title}</strong>
                      <span>{customer.company}</span>
                      <small className={task.due <= "2026-07-03" ? "overdue" : ""}>{task.due < "2026-07-03" ? "Overdue" : task.due === "2026-07-03" ? "Due today" : shortDate(task.due)}</small>
                    </button>
                  </div>
                );
              })}
            </div>
            <button className="panel-footer-button">View all tasks <ArrowRight size={15} /></button>
          </article>

          <article className="panel compact-panel">
            <div className="panel-header">
              <div><span className="eyebrow">Inbox</span><h2>Recent messages</h2></div>
              <Badge tone="rose">{communications.filter((c) => c.unread).length} unread</Badge>
            </div>
            <div className="message-list">
              {communications.slice(0, 3).map((message) => {
                const customer = customers.find((c) => c.id === message.customerId)!;
                return (
                  <button key={message.id} onClick={() => onOpenCustomer(message.customerId)}>
                    <Avatar name={message.author} size="sm" />
                    <span><strong>{message.author}<small>{timeAgo(message.timestamp)}</small></strong><em>{customer.company}</em><p>{message.body}</p></span>
                    {message.unread && <i />}
                  </button>
                );
              })}
            </div>
            <button className="panel-footer-button" onClick={() => onNavigate("communications")}>Open inbox <ArrowRight size={15} /></button>
          </article>
        </aside>
      </section>
    </>
  );
}

function CustomersPage({
  customers,
  onOpenCustomer,
  onAdd,
}: {
  customers: Customer[];
  onOpenCustomer: (id: string) => void;
  onAdd: (customer: Customer) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ company: "", contact: "", email: "", phone: "" });
  const statuses = ["All", "Opportunity", "Lead", "Application", "Quoted", "Current", "Renewal"];
  const filtered = customers.filter(
    (customer) =>
      (status === "All" || customer.status === status) &&
      `${customer.company} ${customer.contact} ${customer.email}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <PageTitle
        eyebrow="Book of business"
        title="Customers"
        description={`${customers.length} relationships · ${currency(customers.reduce((sum, c) => sum + c.estimatedPremium, 0))} estimated premium`}
        actions={
          <>
            <button className="button secondary"><Upload size={17} />Import</button>
            <button className="button primary" onClick={() => setShowAdd(true)}><Plus size={17} />Add customer</button>
          </>
        }
      />
      <section className="panel customer-panel">
        <div className="table-toolbar">
          <div className="table-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" /></div>
          <div className="status-tabs">
            {statuses.map((item) => <button key={item} onClick={() => setStatus(item)} className={status === item ? "active" : ""}>{item}</button>)}
          </div>
          <button className="button secondary small"><Filter size={15} />Filters</button>
        </div>
        <div className="table-scroll">
          <table className="data-table customer-table">
            <thead><tr><th>Customer</th><th>Status</th><th>Agent</th><th>Health</th><th>Premium</th><th>Renewal</th><th>Last contact</th><th /></tr></thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} onClick={() => onOpenCustomer(customer.id)}>
                  <td><div className="customer-cell"><Avatar name={customer.company} /><span><strong>{customer.company}</strong><small>{customer.contact} · {customer.industry}</small></span></div></td>
                  <td><Badge tone={statusTone[customer.status]}>{customer.status}</Badge></td>
                  <td><span className="person-cell"><Avatar name={customer.assignedAgent} size="sm" />{customer.assignedAgent}</span></td>
                  <td><span className={`health-score ${customer.healthScore >= 80 ? "good" : customer.healthScore >= 60 ? "fair" : "risk"}`}><i style={{ "--score": `${customer.healthScore * 3.6}deg` } as React.CSSProperties}>{customer.healthScore}</i><small>{customer.healthScore >= 80 ? "Healthy" : customer.healthScore >= 60 ? "Watch" : "At risk"}</small></span></td>
                  <td><strong>{currency(customer.estimatedPremium)}</strong></td>
                  <td><span className={daysUntil(customer.renewalDate) <= 60 ? "date-urgent" : ""}>{shortDate(customer.renewalDate)}<small>{daysUntil(customer.renewalDate)} days</small></span></td>
                  <td>{timeAgo(customer.lastContact)}</td>
                  <td><button className="icon-button"><MoreHorizontal size={18} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <EmptyState icon={Search} title="No customers found" body="Try a different search or lifecycle status." />}
        </div>
        <div className="table-footer"><span>Showing {filtered.length} of {customers.length} customers</span><div><button disabled>Previous</button><button className="active">1</button><button disabled>Next</button></div></div>
      </section>

      {showAdd && (
        <div className="modal-backdrop" onMouseDown={() => setShowAdd(false)}>
          <form
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={async (e) => {
              e.preventDefault();
              await onAdd({
                id: `cus-${Date.now()}`,
                ...form,
                address: "",
                city: "Denver",
                state: "CO",
                status: "Lead",
                source: "Manual",
                assignedAgent: "Alex Morgan",
                csr: "Jordan Lee",
                healthScore: 50,
                estimatedPremium: 0,
                renewalDate: "2027-01-01",
                industry: "Unclassified",
                tags: ["New"],
                policies: [],
                lastContact: new Date().toISOString(),
              });
              setShowAdd(false);
            }}
          >
            <div className="modal-head"><div><span className="eyebrow">New relationship</span><h2>Add customer</h2></div><button type="button" className="icon-button" onClick={() => setShowAdd(false)}><X size={18} /></button></div>
            <div className="form-grid">
              <label className="full">Company name<input required autoFocus value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Industries" /></label>
              <label>Primary contact<input required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Full name" /></label>
              <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 555-0123" /></label>
              <label className="full">Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" /></label>
            </div>
            <div className="modal-actions"><button type="button" className="button secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="button primary" type="submit">Create customer</button></div>
          </form>
        </div>
      )}
    </>
  );
}

const workspaceTabs = ["Overview", "Communications", "Policies", "Applications", "Claims", "Documents", "Tasks", "Timeline", "AI"];

function CustomerWorkspace({
  customer,
  tasks,
  communications,
  onBack,
  onMessage,
  onToggleTask,
  onAddTask,
  notify,
}: {
  customer: Customer;
  tasks: Task[];
  communications: Communication[];
  onBack: () => void;
  onMessage: (message: Communication) => Promise<Communication>;
  onToggleTask: (id: string) => void;
  onAddTask: (
    customerId: string,
    input: { title: string; due: string; priority: Priority; assignee: string },
  ) => Promise<void>;
  notify: (message: string) => void;
}) {
  const [tab, setTab] = useState("Overview");
  const [composer, setComposer] = useState("");
  const [composerMode, setComposerMode] = useState<Communication["channel"]>("Email");
  const customerTasks = tasks.filter((task) => task.customerId === customer.id);
  const customerComms = communications.filter((comm) => comm.customerId === customer.id);
  const customerClaims = seedClaims.filter((claim) => claim.customerId === customer.id);

  const sendMessage = async () => {
    if (!composer.trim()) return;
    await onMessage({
      id: `com-${Date.now()}`,
      customerId: customer.id,
      channel: composerMode,
      direction: composerMode === "Note" ? "internal" : "outbound",
      author: "Alex Morgan",
      body: composer,
      timestamp: new Date().toISOString(),
    });
    setComposer("");
    notify(`${composerMode} added to timeline`);
  };

  return (
    <>
      <button className="back-button" onClick={onBack}><ArrowLeft size={16} />All customers</button>
      <section className="customer-hero">
        <div className="customer-identity">
          <Avatar name={customer.company} size="lg" />
          <div>
            <div className="title-line"><h1>{customer.company}</h1><Badge tone={statusTone[customer.status]}>{customer.status}</Badge></div>
            <p>{customer.industry} · {customer.city}, {customer.state} · Customer since 2024</p>
            <div className="customer-tags">{customer.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>
        </div>
        <div className="hero-actions">
          <button className="button secondary" onClick={() => { setTab("Communications"); setComposerMode("Email"); }}><Mail size={16} />Email</button>
          <button className="button secondary" onClick={() => { setTab("Communications"); setComposerMode("SMS"); }}><MessageCircleMore size={16} />Text</button>
          <button className="button secondary" onClick={() => { setTab("Communications"); setComposerMode("Call"); }}><Phone size={16} />Log call</button>
          <button className="button primary" onClick={() => notify("Action menu ready")}><Plus size={16} />Add action</button>
        </div>
        <div className="customer-facts">
          <div><span>Primary contact</span><strong>{customer.contact}</strong><small>{customer.email}</small></div>
          <div><span>Assigned team</span><strong>{customer.assignedAgent}</strong><small>CSR · {customer.csr}</small></div>
          <div><span>Active premium</span><strong>{currency(customer.estimatedPremium)}</strong><small>{customer.policies.length} active policies</small></div>
          <div><span>Next renewal</span><strong>{shortDate(customer.renewalDate)}</strong><small className={daysUntil(customer.renewalDate) < 60 ? "text-rose" : ""}>{daysUntil(customer.renewalDate)} days remaining</small></div>
          <div><span>Relationship health</span><strong className="health-inline">{customer.healthScore}<i style={{ width: `${customer.healthScore}%` }} /></strong><small>{customer.healthScore > 75 ? "Strong" : "Needs attention"}</small></div>
        </div>
      </section>

      <div className="workspace-tabs">
        {workspaceTabs.map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}{item === "Tasks" && customerTasks.filter((task) => !task.completed).length > 0 ? <em>{customerTasks.filter((task) => !task.completed).length}</em> : null}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <section className="workspace-layout">
          <div className="workspace-main">
            <article className="panel summary-panel">
              <div className="panel-header">
                <div className="ai-heading"><span><Sparkles size={18} /></span><div><span className="eyebrow">Strategic AI</span><h2>Account briefing</h2></div></div>
                <button className="text-button"><RefreshCw size={14} />Regenerate</button>
              </div>
              <p className="lead-copy">
                {customer.company} is a {customer.healthScore >= 75 ? "healthy" : "developing"} {customer.industry.toLowerCase()} account with {currency(customer.estimatedPremium)} in estimated premium.
                {customer.status === "Renewal" ? " Renewal preparation is active and the newly disclosed vehicle should be added before carrier marketing." : " The relationship is active with clear next steps for the assigned team."}
              </p>
              <div className="insight-grid">
                <div><span className="insight-icon rose"><AlertTriangle size={17} /></span><p><strong>Needs attention</strong>{customer.status === "Renewal" ? "Updated loss runs and vehicle schedule are still needed." : "Follow-up activity is due on this account."}</p></div>
                <div><span className="insight-icon violet"><Target size={17} /></span><p><strong>Coverage opportunity</strong>Cyber liability is not currently shown in the active policy set.</p></div>
                <div><span className="insight-icon mint"><WandSparkles size={17} /></span><p><strong>Next best action</strong>Schedule a 20-minute coverage review with {customer.contact.split(" ")[0]}.</p></div>
              </div>
            </article>
            <article className="panel">
              <div className="panel-header"><div><span className="eyebrow">Coverage</span><h2>Policies</h2></div><button className="button secondary small" onClick={() => setTab("Policies")}><Plus size={15} />Add policy</button></div>
              {customer.policies.length ? (
                <div className="policy-list">
                  {customer.policies.map((policy) => (
                    <button key={policy.id} onClick={() => setTab("Policies")}>
                      <span className="policy-icon"><ShieldCheck size={20} /></span>
                      <span><Badge tone="mint">{policy.status}</Badge><strong>{policy.type}</strong><small>{policy.carrier} · {policy.policyNumber}</small></span>
                      <span><strong>{currency(policy.premium)}</strong><small>Annual premium</small></span>
                      <span><strong>{shortDate(policy.expiration)}</strong><small>{daysUntil(policy.expiration)} days to renewal</small></span>
                      <ChevronRight size={17} />
                    </button>
                  ))}
                </div>
              ) : <EmptyState icon={ShieldCheck} title="No active policies" body="Add a policy or convert a winning quote to bound coverage." />}
            </article>
            <article className="panel">
              <div className="panel-header"><div><span className="eyebrow">Relationship</span><h2>Recent activity</h2></div><button className="text-button" onClick={() => setTab("Timeline")}>Full timeline <ArrowRight size={14} /></button></div>
              <TimelineList events={timeline.filter((event) => event.customerId === customer.id).slice(0, 4)} />
            </article>
          </div>
          <aside className="workspace-side">
            <article className="panel compact-panel">
              <div className="panel-header"><div><span className="eyebrow">Open work</span><h2>Tasks</h2></div><button className="icon-button" onClick={() => setTab("Tasks")}><Plus size={17} /></button></div>
              <div className="task-list">
                {customerTasks.map((task) => (
                  <div className="task-row" key={task.id}>
                    <button className={`task-check ${task.completed ? "done" : ""}`} onClick={() => onToggleTask(task.id)}><Check size={13} /></button>
                    <span className="task-copy"><strong>{task.title}</strong><small className={task.due <= "2026-07-03" ? "overdue" : ""}>{shortDate(task.due)} · {task.priority}</small></span>
                  </div>
                ))}
                {!customerTasks.length && <EmptyState icon={ListChecks} title="No open tasks" body="This account is all caught up." />}
              </div>
            </article>
            <article className="panel compact-panel contact-card">
              <div className="panel-header"><div><span className="eyebrow">Primary contact</span><h2>{customer.contact}</h2></div><button className="icon-button"><MoreHorizontal size={17} /></button></div>
              <a href={`mailto:${customer.email}`}><Mail size={16} />{customer.email}</a>
              <a href={`tel:${customer.phone}`}><Phone size={16} />{customer.phone}</a>
              <p><Building2 size={16} />{customer.address}<br />{customer.city}, {customer.state}</p>
            </article>
          </aside>
        </section>
      )}

      {tab === "Communications" && (
        <section className="communications-workspace panel">
          <div className="thread-column">
            <div className="panel-header"><div><span className="eyebrow">Unified thread</span><h2>Communications</h2></div><button className="button secondary small"><Search size={15} />Search</button></div>
            <div className="thread">
              {customerComms.map((message) => (
                <div className={`thread-item ${message.direction}`} key={message.id}>
                  <Avatar name={message.author} size="sm" />
                  <div><span><strong>{message.author}</strong><Badge tone={message.channel === "Email" ? "sky" : message.channel === "SMS" ? "violet" : message.channel === "Note" ? "amber" : "mint"}>{message.channel}</Badge><small>{shortDate(message.timestamp)} · {new Date(message.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></span><p>{message.body}</p></div>
                </div>
              ))}
              {!customerComms.length && <EmptyState icon={MessageCircleMore} title="Start the conversation" body="Emails, texts, calls, meetings, and notes will appear here." />}
            </div>
            <div className="composer">
              <div className="composer-tabs">{(["Email", "SMS", "Note", "Call"] as Communication["channel"][]).map((mode) => <button key={mode} className={composerMode === mode ? "active" : ""} onClick={() => setComposerMode(mode)}>{mode}</button>)}</div>
              <textarea value={composer} onChange={(e) => setComposer(e.target.value)} placeholder={composerMode === "Note" ? "Add an internal note…" : composerMode === "Call" ? "Log call outcome and notes…" : `Write a ${composerMode.toLowerCase()} to ${customer.contact.split(" ")[0]}…`} />
              <div><span><button className="icon-button"><Paperclip size={17} /></button><button className="ai-compose"><Sparkles size={15} />Help me write</button></span><button className="button primary small" onClick={() => void sendMessage()}>{composerMode === "Note" || composerMode === "Call" ? "Save" : "Send"} <Send size={15} /></button></div>
            </div>
          </div>
          <aside className="thread-context">
            <span className="eyebrow">Context</span>
            <h3>{customer.contact}</h3>
            <p>{customer.email}<br />{customer.phone}</p>
            <hr />
            <span className="eyebrow">Open tasks</span>
            {customerTasks.filter((task) => !task.completed).map((task) => <div className="mini-task" key={task.id}><Clock3 size={15} /><span><strong>{task.title}</strong><small>{shortDate(task.due)}</small></span></div>)}
          </aside>
        </section>
      )}

      {tab === "Policies" && (
        <section className="tab-panel">
          <div className="section-heading"><div><h2>Policies</h2><p>Active and historical coverage for this customer.</p></div><button className="button primary"><Plus size={16} />Add policy</button></div>
          <div className="policy-card-grid">
            {customer.policies.map((policy) => (
              <article className="policy-card" key={policy.id}>
                <div><span className="policy-icon"><ShieldCheck size={21} /></span><Badge tone="mint">{policy.status}</Badge><button className="icon-button"><MoreHorizontal size={17} /></button></div>
                <h3>{policy.type}</h3><p>{policy.carrier} · {policy.policyNumber}</p>
                <dl><div><dt>Annual premium</dt><dd>{currency(policy.premium)}</dd></div><div><dt>Deductible</dt><dd>{currency(policy.deductible)}</dd></div><div><dt>Effective</dt><dd>{shortDate(policy.effective)}</dd></div><div><dt>Expires</dt><dd>{shortDate(policy.expiration)}</dd></div></dl>
                <div className="renewal-strip"><CalendarClock size={16} /><span><strong>Renewal in {daysUntil(policy.expiration)} days</strong><small>Workflow is active</small></span><ChevronRight size={16} /></div>
              </article>
            ))}
          </div>
          {!customer.policies.length && <div className="panel"><EmptyState icon={ShieldCheck} title="No policies yet" body="Add the current policy or create one from a bound quote." /></div>}
        </section>
      )}

      {tab === "Applications" && <GenericWorkspace title="Applications" description="Track forms from draft through signature, submission, quote, and bind." icon={FileCheck2} action="Create application" />}
      {tab === "Claims" && (
        <section className="tab-panel">
          <div className="section-heading"><div><h2>Claims</h2><p>Monitor claim progress, documents, and follow-up.</p></div><button className="button primary"><Plus size={16} />Create claim</button></div>
          {customerClaims.map((claim) => <article className="claim-card" key={claim.id}><span className="claim-icon"><HeartPulse size={20} /></span><div><Badge tone={claim.status === "Closed" ? "mint" : "amber"}>{claim.status}</Badge><h3>{claim.type}</h3><p>{claim.number} · {claim.carrier}</p></div><dl><div><dt>Date of loss</dt><dd>{shortDate(claim.dateOfLoss)}</dd></div><div><dt>Adjuster</dt><dd>{claim.adjuster}</dd></div><div><dt>Reserve</dt><dd>{currency(claim.reserve)}</dd></div></dl><ChevronRight size={18} /></article>)}
          {!customerClaims.length && <div className="panel"><EmptyState icon={HeartPulse} title="No claims on record" body="Create a claim and its servicing workflow here." /></div>}
        </section>
      )}
      {tab === "Documents" && <DocumentsTab notify={notify} />}
      {tab === "Tasks" && <TasksTab customer={customer} tasks={customerTasks} onToggleTask={onToggleTask} onAddTask={onAddTask} />}
      {tab === "Timeline" && <section className="tab-panel"><div className="section-heading"><div><h2>Complete timeline</h2><p>A permanent history of every meaningful customer action.</p></div><button className="button secondary"><Filter size={16} />Filter</button></div><article className="panel"><TimelineList events={timeline.filter((event) => event.customerId === customer.id)} /></article></section>}
      {tab === "AI" && <AIWorkspace customer={customer} />}
    </>
  );
}

function GenericWorkspace({ title, description, icon: Icon, action }: { title: string; description: string; icon: typeof FileText; action: string }) {
  return <section className="tab-panel"><div className="section-heading"><div><h2>{title}</h2><p>{description}</p></div><button className="button primary"><Plus size={16} />{action}</button></div><div className="panel"><EmptyState icon={Icon} title={`No ${title.toLowerCase()} yet`} body={`Create the first ${title.toLowerCase().replace(/s$/, "")} to begin tracking progress.`} /></div></section>;
}

function TimelineList({ events }: { events: typeof timeline }) {
  return (
    <div className="timeline-list">
      {events.map((event) => (
        <div key={event.id}><span className={`timeline-dot ${event.type.toLowerCase()}`}>{event.type === "Document" ? <FileText size={15} /> : event.type === "Claim" ? <HeartPulse size={15} /> : event.type === "Policy" ? <ShieldCheck size={15} /> : <Mail size={15} />}</span><div><strong>{event.title}</strong><p>{event.detail}</p><small>{shortDate(event.timestamp)} · {new Date(event.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></div></div>
      ))}
      {!events.length && <EmptyState icon={Activity} title="No activity yet" body="Customer events will be recorded here automatically." />}
    </div>
  );
}

function DocumentsTab({ notify }: { notify: (message: string) => void }) {
  const docs = [
    { name: "2026 Inventory Schedule.xlsx", category: "Exposure schedule", date: "Jul 2, 2026", size: "184 KB" },
    { name: "Travelers BOP Declarations.pdf", category: "Policy document", date: "Aug 18, 2025", size: "2.4 MB" },
    { name: "Commercial Auto Vehicle List.pdf", category: "Vehicle schedule", date: "Aug 12, 2025", size: "612 KB" },
  ];
  return (
    <section className="tab-panel">
      <div className="section-heading"><div><h2>Documents</h2><p>Secure files, versions, and customer requests.</p></div><div><button className="button secondary" onClick={() => notify("Document request drafted")}><Send size={16} />Request document</button><label className="button primary upload-button"><Upload size={16} />Upload<input type="file" onChange={(e) => e.target.files?.length && notify(`${e.target.files[0].name} uploaded`)} /></label></div></div>
      <article className="panel document-list">
        {docs.map((doc) => <button key={doc.name}><span className="file-icon"><FileText size={19} /></span><span><strong>{doc.name}</strong><small>{doc.category}</small></span><span><strong>{doc.date}</strong><small>{doc.size}</small></span><MoreHorizontal size={18} /></button>)}
      </article>
    </section>
  );
}

function TasksTab({
  customer,
  tasks,
  onToggleTask,
  onAddTask,
}: {
  customer: Customer;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (
    customerId: string,
    input: { title: string; due: string; priority: Priority; assignee: string },
  ) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  return (
    <section className="tab-panel">
      <div className="section-heading"><div><h2>Tasks</h2><p>Follow-up and service work assigned to the team.</p></div><button className="button primary" onClick={() => setShowForm(true)}><Plus size={16} />Add task</button></div>
      {showForm && <form className="inline-task-form" onSubmit={async (e) => { e.preventDefault(); await onAddTask(customer.id, { title, due: "2026-07-10", priority: "Medium", assignee: "Alex Morgan" }); setTitle(""); setShowForm(false); }}><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to happen?" required /><button className="button primary small">Add task</button><button type="button" className="icon-button" onClick={() => setShowForm(false)}><X size={17} /></button></form>}
      <article className="panel task-table">
        {tasks.map((task) => <div key={task.id} className={task.completed ? "completed" : ""}><button className={`task-check ${task.completed ? "done" : ""}`} onClick={() => onToggleTask(task.id)}><Check size={14} /></button><span><strong>{task.title}</strong><small>{task.assignee}</small></span><Badge tone={task.priority === "Urgent" ? "rose" : task.priority === "High" ? "amber" : "sky"}>{task.priority}</Badge><span><strong>{shortDate(task.due)}</strong><small>{task.due < "2026-07-03" ? "Overdue" : "Due date"}</small></span><button className="icon-button"><MoreHorizontal size={17} /></button></div>)}
        {!tasks.length && <EmptyState icon={ListChecks} title="No tasks yet" body="Add a follow-up task to keep this relationship moving." />}
      </article>
    </section>
  );
}

function AIWorkspace({ customer }: { customer: Customer }) {
  return (
    <section className="tab-panel">
      <div className="section-heading"><div><span className="eyebrow">Strategic AI</span><h2>Account intelligence</h2><p>Recommendations stay advisory until you choose to act.</p></div><button className="button primary"><RefreshCw size={16} />Regenerate</button></div>
      <div className="ai-workspace-grid">
        <article className="panel ai-block wide"><span className="ai-label"><Sparkles size={16} />Executive summary</span><p>{customer.company} represents {currency(customer.estimatedPremium)} in premium potential. Relationship strength is {customer.healthScore}/100, with the next renewal on {shortDate(customer.renewalDate)}. The highest-value near-term action is a structured coverage review with {customer.contact}.</p></article>
        <article className="panel ai-block"><span className="ai-label"><Target size={16} />Open opportunities</span><h3>Cyber liability</h3><p>No standalone cyber coverage found. Estimated premium opportunity: $3,800–$5,200.</p><button className="text-button">Create opportunity <ArrowRight size={14} /></button></article>
        <article className="panel ai-block"><span className="ai-label"><AlertTriangle size={16} />Missing information</span><h3>2 items</h3><p>Updated loss runs and current vehicle schedule need confirmation.</p><button className="text-button">Request documents <ArrowRight size={14} /></button></article>
        <article className="panel ai-block wide"><span className="ai-label"><WandSparkles size={16} />Recommended next action</span><div className="next-action"><span>01</span><div><h3>Book a 20-minute renewal exposure review</h3><p>Ask about the new vehicle, seasonal inventory peak, and Boulder pop-up location before approaching carriers.</p></div><button className="button primary small">Create task</button></div></article>
      </div>
    </section>
  );
}

function AnalyzerPage({ notify, onOpenCustomer }: { notify: (message: string) => void; onOpenCustomer: () => void }) {
  const [stage, setStage] = useState<"upload" | "processing" | "review">("upload");
  const run = () => {
    setStage("processing");
    window.setTimeout(() => setStage("review"), 1700);
  };
  return (
    <>
      <PageTitle eyebrow="Flagship workflow" title="AI Policy Analyzer" description="Turn an insurance document into structured account intelligence in minutes." actions={<button className="button secondary"><Archive size={16} />Analysis history</button>} />
      {stage === "upload" && (
        <section className="analyzer-start">
          <div className="analyzer-intro">
            <Badge tone="violet"><Sparkles size={13} />Powered by Strategic AI</Badge>
            <h2>Upload a policy. Find the opportunity inside it.</h2>
            <p>We’ll extract coverage, limits, premiums, dates, exposures, and claims—then surface gaps and a clear producer action plan.</p>
            <div className="analyzer-steps"><div><span>1</span><p><strong>Upload</strong>PDF, declarations, or scanned policy</p></div><div><span>2</span><p><strong>Review</strong>Confirm the fields we extracted</p></div><div><span>3</span><p><strong>Act</strong>Create or update the customer</p></div></div>
          </div>
          <label className="dropzone">
            <input type="file" accept=".pdf,image/*" onChange={(e) => e.target.files?.length && run()} />
            <span className="upload-orbit"><CloudUpload size={28} /></span>
            <h3>Drop a policy here</h3>
            <p>or click to choose a PDF or image</p>
            <button type="button" className="button primary" onClick={run}>Try with a sample policy</button>
            <small>Securely encrypted · Maximum file size 25 MB</small>
          </label>
          <div className="privacy-strip"><ShieldCheck size={19} /><div><strong>Your documents stay private</strong><span>Files are encrypted and only visible to your agency.</span></div><LockKeyhole size={17} /></div>
        </section>
      )}
      {stage === "processing" && (
        <section className="processing-card panel">
          <span className="processing-orbit"><FileSearch size={30} /><i /><i /></span>
          <Badge tone="violet">Analyzing sample policy</Badge>
          <h2>Reading coverage and exposures…</h2>
          <p>Strategic AI is extracting policy details and checking for actionable gaps.</p>
          <div className="processing-list"><span className="done"><Check size={15} />Document uploaded</span><span className="done"><Check size={15} />Text and tables extracted</span><span className="active"><RefreshCw size={15} />Comparing coverage</span><span>Building recommendations</span></div>
        </section>
      )}
      {stage === "review" && (
        <section className="analysis-result">
          <div className="result-head">
            <div><span className="success-mark"><Check size={20} /></span><span><Badge tone="mint">Analysis complete · 94% confidence</Badge><h2>Timberline Outdoor Supply</h2><p>Travelers Business Owners Policy · Expires Aug 18, 2026</p></span></div>
            <div><button className="button secondary" onClick={() => setStage("upload")}>Analyze another</button><button className="button primary" onClick={() => { notify("Customer record updated"); onOpenCustomer(); }}>Update customer <ArrowRight size={16} /></button></div>
          </div>
          <div className="result-grid">
            <article className="panel extracted-fields">
              <div className="panel-header"><div><span className="eyebrow">Extracted data</span><h2>Policy details</h2></div><button className="text-button">Edit fields</button></div>
              <dl>
                <div><dt>Named insured</dt><dd>Timberline Outdoor Supply LLC</dd></div>
                <div><dt>Carrier</dt><dd>Travelers</dd></div>
                <div><dt>Policy number</dt><dd>BOP-884201</dd></div>
                <div><dt>Policy period</dt><dd>Aug 18, 2025 – Aug 18, 2026</dd></div>
                <div><dt>Annual premium</dt><dd>$28,600</dd></div>
                <div><dt>Property limit</dt><dd>$1,250,000</dd></div>
                <div><dt>General liability</dt><dd>$1M / $2M</dd></div>
                <div><dt>Deductible</dt><dd>$2,500</dd></div>
              </dl>
            </article>
            <article className="panel findings-panel">
              <div className="panel-header"><div><span className="eyebrow">AI review</span><h2>Key findings</h2></div><Badge tone="rose">3 actions</Badge></div>
              <div className="finding high"><span><AlertTriangle size={17} /></span><div><Badge tone="rose">Coverage gap</Badge><h3>Cyber liability not found</h3><p>Retail operations include online sales and stored customer data. No cyber endorsement or standalone policy appears in the uploaded document.</p></div></div>
              <div className="finding medium"><span><Activity size={17} /></span><div><Badge tone="amber">Limit review</Badge><h3>Business income may be understated</h3><p>The 12-month limit is based on last year’s revenue and may not reflect the new Boulder location.</p></div></div>
              <div className="finding opportunity"><span><Target size={17} /></span><div><Badge tone="violet">Cross-sell</Badge><h3>Employment practices opportunity</h3><p>Headcount increased to 34 employees. Consider EPLI as the organization grows.</p></div></div>
            </article>
            <article className="panel action-plan">
              <span className="ai-label"><WandSparkles size={16} />Producer action plan</span>
              <h3>Estimated revenue opportunity</h3><strong>$2,180</strong><small>Annual commission potential</small>
              <ol><li><span>1</span>Confirm online sales revenue and data practices</li><li><span>2</span>Update business income worksheet</li><li><span>3</span>Present cyber and EPLI options</li></ol>
              <button className="button primary">Create opportunity</button>
            </article>
          </div>
        </section>
      )}
    </>
  );
}

function DiscoveryPage({ notify }: { notify: (message: string) => void }) {
  const [opportunities, setOpportunities] = useState(seedDiscovery);
  return (
    <>
      <PageTitle eyebrow="AI prospecting" title="Discovery" description="Qualified opportunities surfaced from your data and trusted external signals." actions={<><button className="button secondary"><RefreshCw size={16} />Refresh</button><button className="button primary"><Plus size={16} />Add opportunity</button></>} />
      <div className="discovery-stats">
        <div><span><Sparkles size={18} /></span><strong>{opportunities.length}</strong><small>New opportunities</small></div>
        <div><span><CircleDollarSign size={18} /></span><strong>{currency(opportunities.reduce((sum, opp) => sum + opp.premium, 0), true)}</strong><small>Estimated premium</small></div>
        <div><span><Target size={18} /></span><strong>88.7</strong><small>Average AI score</small></div>
        <div><span><Activity size={18} /></span><strong>31%</strong><small>Acceptance rate</small></div>
      </div>
      <section className="discovery-layout">
        <aside className="panel discovery-filter">
          <div className="panel-header"><h2>Filters</h2><button className="text-button">Reset</button></div>
          <label>Opportunity type<select><option>All types</option><option>Policy expiring soon</option><option>Coverage gap</option></select></label>
          <label>Minimum AI score<input type="range" min="50" max="100" defaultValue="75" /></label>
          <label>Estimated premium<select><option>Any premium</option><option>$25K+</option><option>$50K+</option></select></label>
          <label>Source<select><option>All sources</option><option>Public business data</option><option>Imported lists</option></select></label>
          <hr />
          <span className="eyebrow">Saved searches</span>
          <button className="saved-search active"><Zap size={15} />High-value this week <em>3</em></button>
          <button className="saved-search"><CalendarClock size={15} />Expiring soon</button>
          <button className="saved-search"><ShieldCheck size={15} />Coverage gaps</button>
        </aside>
        <div className="opportunity-list">
          <div className="list-sort"><span>{opportunities.length} opportunities</span><button>Best match <ChevronDown size={14} /></button></div>
          {opportunities.map((opp) => (
            <article className="opportunity-card panel" key={opp.id}>
              <div className="score-ring"><strong>{opp.score}</strong><small>AI score</small></div>
              <div className="opp-main">
                <div><Badge tone="violet">{opp.type}</Badge><small>{opp.source}</small></div>
                <h2>{opp.company}</h2><p>{opp.contact} · Denver, CO</p>
                <div className="reason"><Sparkles size={16} /><span><strong>Why this matters</strong>{opp.reason}</span></div>
                <div className="opp-meta"><span><CircleDollarSign size={15} />{currency(opp.premium)} estimated premium</span><span><Zap size={15} />Commercial New Lead sequence</span></div>
              </div>
              <div className="opp-actions"><button className="button primary" onClick={() => { setOpportunities((current) => current.filter((item) => item.id !== opp.id)); notify(`${opp.company} accepted as an Opportunity`); }}>Accept opportunity</button><button className="button secondary">Assign</button><button className="icon-button"><MoreHorizontal size={18} /></button></div>
            </article>
          ))}
          {!opportunities.length && <div className="panel"><EmptyState icon={CheckCircle2} title="Opportunity queue cleared" body="Accepted opportunities are now in your customer pipeline." /></div>}
        </div>
      </section>
    </>
  );
}

function ClaimsPage({ customers, onOpenCustomer }: { customers: Customer[]; onOpenCustomer: (id: string) => void }) {
  const renewals = customers.filter((customer) => daysUntil(customer.renewalDate) <= 120);
  return (
    <>
      <PageTitle eyebrow="Service center" title="Claims & renewals" description="Proactive servicing work, organized before anything slips." actions={<button className="button primary"><Plus size={16} />Create claim</button>} />
      <div className="section-switch"><button className="active">Claims <em>2 open</em></button><button>Renewals <em>{renewals.length}</em></button></div>
      <section className="service-metrics">
        <article><span className="metric-icon rose"><HeartPulse size={18} /></span><div><strong>2</strong><small>Open claims</small></div></article>
        <article><span className="metric-icon amber"><Clock3 size={18} /></span><div><strong>24 days</strong><small>Average age</small></div></article>
        <article><span className="metric-icon blue"><Inbox size={18} /></span><div><strong>1</strong><small>Waiting on carrier</small></div></article>
        <article><span className="metric-icon mint"><CheckCircle2 size={18} /></span><div><strong>96%</strong><small>SLA on track</small></div></article>
      </section>
      <section className="panel">
        <div className="table-toolbar"><div className="table-search"><Search size={16} /><input placeholder="Search claim number or customer…" /></div><button className="button secondary small"><Filter size={15} />All statuses</button></div>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Claim</th><th>Customer</th><th>Status</th><th>Date of loss</th><th>Carrier</th><th>Adjuster</th><th>Last update</th><th /></tr></thead><tbody>
          {seedClaims.map((claim) => { const customer = customers.find((c) => c.id === claim.customerId)!; return <tr key={claim.id} onClick={() => onOpenCustomer(claim.customerId)}><td><strong>{claim.number}</strong><small>{claim.type}</small></td><td><div className="customer-cell"><Avatar name={customer.company} size="sm" /><span><strong>{customer.company}</strong><small>{customer.assignedAgent}</small></span></div></td><td><Badge tone={claim.status === "Closed" ? "mint" : claim.status.includes("Waiting") ? "amber" : "sky"}>{claim.status}</Badge></td><td>{shortDate(claim.dateOfLoss)}</td><td>{claim.carrier}</td><td>{claim.adjuster}</td><td><span className={claim.updatedAt < "2026-06-27" && claim.status !== "Closed" ? "date-urgent" : ""}>{timeAgo(`${claim.updatedAt}T12:00:00`)}</span></td><td><ChevronRight size={17} /></td></tr>; })}
        </tbody></table></div>
      </section>
      <div className="renewal-preview">
        <div className="section-heading"><div><span className="eyebrow">Coming due</span><h2>Renewal radar</h2></div><button className="text-button">View renewal workspace <ArrowRight size={15} /></button></div>
        <div className="renewal-cards">{renewals.map((customer) => <button key={customer.id} onClick={() => onOpenCustomer(customer.id)}><span className={daysUntil(customer.renewalDate) < 60 ? "urgent" : ""}>{daysUntil(customer.renewalDate)}<small>days</small></span><div><strong>{customer.company}</strong><small>{currency(customer.estimatedPremium)} · {customer.assignedAgent}</small></div><ChevronRight size={16} /></button>)}</div>
      </div>
    </>
  );
}

function CommunicationsPage({ customers, communications, onOpenCustomer }: { customers: Customer[]; communications: Communication[]; onOpenCustomer: (id: string) => void }) {
  const [selected, setSelected] = useState(communications[0]?.customerId ?? customers[0].id);
  const current = customers.find((customer) => customer.id === selected)!;
  return (
    <>
      <PageTitle eyebrow="Unified inbox" title="Communications" description="Email, SMS, calls, meetings, and notes in one customer thread." actions={<button className="button primary"><Plus size={16} />New message</button>} />
      <section className="inbox-layout panel">
        <aside className="inbox-list">
          <div className="inbox-tools"><div className="table-search"><Search size={16} /><input placeholder="Search inbox…" /></div><button className="icon-button"><Filter size={16} /></button></div>
          <div className="inbox-tabs"><button className="active">All</button><button>Unread</button><button>Assigned to me</button></div>
          {communications.map((message) => {
            const customer = customers.find((c) => c.id === message.customerId)!;
            return <button className={`inbox-item ${selected === message.customerId ? "active" : ""}`} key={message.id} onClick={() => setSelected(message.customerId)}><Avatar name={message.author} /><span><strong>{customer.company}<small>{timeAgo(message.timestamp)}</small></strong><em>{message.author} · {message.channel}</em><p>{message.body}</p></span>{message.unread && <i />}</button>;
          })}
        </aside>
        <div className="inbox-thread">
          <div className="inbox-thread-head"><div><Avatar name={current.company} /><span><strong>{current.company}</strong><small>{current.contact} · {current.email}</small></span></div><button className="button secondary small" onClick={() => onOpenCustomer(current.id)}>Open customer <ArrowRight size={15} /></button></div>
          <div className="thread">{communications.filter((message) => message.customerId === selected).map((message) => <div className={`thread-item ${message.direction}`} key={message.id}><Avatar name={message.author} size="sm" /><div><span><strong>{message.author}</strong><Badge tone="sky">{message.channel}</Badge><small>{timeAgo(message.timestamp)}</small></span><p>{message.body}</p></div></div>)}</div>
          <div className="composer slim"><div className="composer-tabs"><button className="active">Email</button><button>SMS</button><button>Note</button></div><textarea placeholder={`Reply to ${current.contact}…`} /><div><button className="ai-compose"><Sparkles size={15} />Help me write</button><button className="button primary small">Send <Send size={15} /></button></div></div>
        </div>
      </section>
    </>
  );
}

function AutomationsPage({ notify }: { notify: (message: string) => void }) {
  const sequences = [
    { name: "Commercial New Lead", status: "Active", enrolled: 42, reply: "38%", bind: "14%", icon: BriefcaseBusiness },
    { name: "Renewal Campaign", status: "Active", enrolled: 31, reply: "61%", bind: "—", icon: RefreshCw },
    { name: "Missing Documents", status: "Active", enrolled: 18, reply: "72%", bind: "—", icon: FileText },
    { name: "Quoted — Waiting Decision", status: "Paused", enrolled: 9, reply: "44%", bind: "22%", icon: CircleDollarSign },
    { name: "Claims Follow-up", status: "Active", enrolled: 12, reply: "58%", bind: "—", icon: HeartPulse },
    { name: "Referral Request", status: "Draft", enrolled: 0, reply: "—", bind: "—", icon: Users },
  ];
  return (
    <>
      <PageTitle eyebrow="Automation" title="Sequences" description="Consistent follow-through that adapts to customer actions." actions={<button className="button primary" onClick={() => notify("New sequence draft created")}><Plus size={16} />New sequence</button>} />
      <section className="sequence-summary">
        <article><strong>112</strong><span>Active enrollments</span><Badge tone="mint">+18 this week</Badge></article>
        <article><strong>52%</strong><span>Average reply rate</span><Badge tone="sky">+4.2%</Badge></article>
        <article><strong>14</strong><span>Appointments booked</span><Badge tone="violet">This month</Badge></article>
        <article><strong>{currency(186000, true)}</strong><span>Revenue influenced</span><Badge tone="mint">Last 90 days</Badge></article>
      </section>
      <div className="sequence-toolbar"><div className="table-search"><Search size={16} /><input placeholder="Search sequences…" /></div><div><button className="filter-button">All statuses <ChevronDown size={14} /></button><button className="filter-button">Updated recently <ChevronDown size={14} /></button></div></div>
      <section className="sequence-grid">
        {sequences.map(({ name, status, enrolled, reply, bind, icon: Icon }) => <article className="sequence-card panel" key={name}><div><span className="sequence-icon"><Icon size={19} /></span><Badge tone={status === "Active" ? "mint" : status === "Paused" ? "amber" : "slate"}>{status}</Badge><button className="icon-button"><MoreHorizontal size={17} /></button></div><h2>{name}</h2><p>Email → Wait 2 days → SMS → Task → Exit on reply</p><div className="mini-flow"><span><Mail size={14} /></span><i /><span><Clock3 size={14} /></span><i /><span><MessageCircleMore size={14} /></span><i /><span><ListChecks size={14} /></span></div><dl><div><dt>Enrolled</dt><dd>{enrolled}</dd></div><div><dt>Reply rate</dt><dd>{reply}</dd></div><div><dt>Bind rate</dt><dd>{bind}</dd></div></dl><button className="card-action">Open sequence <ArrowRight size={15} /></button></article>)}
      </section>
    </>
  );
}

const reportCards = [
  ["Agency Snapshot", "Owner-level view of customers, premium, work, and risk.", LayoutDashboard],
  ["Pipeline", "Lifecycle conversion, stalled accounts, and next actions.", Target],
  ["Revenue & Premium", "Production and commission by producer, carrier, and month.", CircleDollarSign],
  ["Renewals", "Upcoming expirations, urgency, and missing information.", RefreshCw],
  ["Claims", "Claim volume, age, carrier response, and workload.", HeartPulse],
  ["Producer Performance", "Sales activity, conversion, and premium leaderboard.", Users],
  ["CSR Workload", "Open service work, overdue tasks, and capacity.", ListChecks],
  ["Carrier Performance", "Submissions, quote speed, binds, and premium.", Building2],
  ["AI Opportunities", "Discovery and Analyzer opportunities through conversion.", Sparkles],
  ["Communications", "Team activity, unread volume, and response times.", MessageCircleMore],
  ["Tasks & SLA", "Operational follow-through and service standards.", ClipboardCheck],
  ["Document Requests", "Outstanding, overdue, and received documents.", FileCheck2],
] as const;

function ReportsPage({ customers, onOpenCustomer }: { customers: Customer[]; onOpenCustomer: (id: string) => void }) {
  const [selected, setSelected] = useState("Agency Snapshot");
  const total = customers.reduce((sum, customer) => sum + customer.estimatedPremium, 0);
  const pieData = [
    { name: "Current", value: customers.filter((c) => c.status === "Current").length, color: "#1f776d" },
    { name: "Renewal", value: customers.filter((c) => c.status === "Renewal").length, color: "#d97757" },
    { name: "Pipeline", value: customers.filter((c) => !["Current", "Renewal"].includes(c.status)).length, color: "#8b72c8" },
  ];
  if (selected !== "Agency Snapshot") {
    return (
      <>
        <button className="back-button" onClick={() => setSelected("Agency Snapshot")}><ArrowLeft size={16} />All reports</button>
        <PageTitle eyebrow="Performance report" title={selected} description={reportCards.find((r) => r[0] === selected)?.[1]} actions={<><button className="button secondary"><Filter size={16} />Last 90 days</button><button className="button primary"><Upload size={16} />Export CSV</button></>} />
        <section className="report-placeholder panel">
          <span className="report-big-icon">{(() => { const Icon = reportCards.find((r) => r[0] === selected)?.[2] ?? BarChart3; return <Icon size={26} />; })()}</span>
          <Badge tone="mint">Live report surface</Badge>
          <h2>{selected} is connected to the shared agency model</h2>
          <p>This implementation provides the full report route and a consistent filtered layout. As production data grows, this surface is ready for the package-specific aggregation endpoint.</p>
          <div className="placeholder-metrics"><div><strong>{customers.length}</strong><span>Records in scope</span></div><div><strong>{currency(total, true)}</strong><span>Premium represented</span></div><div><strong>Jul 3</strong><span>Data refreshed</span></div></div>
          <button className="button secondary" onClick={() => setSelected("Agency Snapshot")}>Return to snapshot</button>
        </section>
      </>
    );
  }
  return (
    <>
      <PageTitle eyebrow="Management intelligence" title="Reports" description="A clear view of agency performance without the BI bloat." actions={<><button className="button secondary"><CalendarClock size={16} />YTD</button><button className="button primary"><Upload size={16} />Export snapshot</button></>} />
      <section className="report-feature panel">
        <div className="report-feature-head"><div><span className="eyebrow">Agency snapshot</span><h2>Northstar is moving in the right direction.</h2><p>Premium and pipeline are up. Two overdue actions need attention before the holiday weekend.</p></div><Badge tone="mint">Updated just now</Badge></div>
        <div className="report-metrics"><div><span>Total premium</span><strong>{currency(total)}</strong><small className="positive">↑ 12.8% vs prior period</small></div><div><span>Estimated commission</span><strong>{currency(total * 0.12)}</strong><small className="positive">↑ 8.3% vs prior period</small></div><div><span>Bound this month</span><strong>{currency(143000)}</strong><small>6 policies</small></div><div><span>Overdue tasks</span><strong>2</strong><small className="negative">Needs attention</small></div></div>
        <div className="report-charts">
          <div><h3>Book by lifecycle</h3><div className="pie-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={4}>{pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><span><strong>{customers.length}</strong><small>accounts</small></span></div><div className="chart-legend">{pieData.map((entry) => <span key={entry.name}><i style={{ background: entry.color }} />{entry.name}<strong>{entry.value}</strong></span>)}</div></div>
          <div><h3>Renewal calendar</h3><div className="renewal-bars"><span><em>Jul</em><i style={{ width: "28%" }} /><strong>$48K</strong></span><span><em>Aug</em><i style={{ width: "62%" }} /><strong>$106K</strong></span><span><em>Sep</em><i style={{ width: "46%" }} /><strong>$79K</strong></span><span><em>Oct</em><i style={{ width: "78%" }} /><strong>$134K</strong></span></div></div>
          <div><h3>Attention required</h3><button className="attention-item" onClick={() => onOpenCustomer("cus-001")}><span className="rose"><AlertTriangle size={16} /></span><div><strong>1 renewal at risk</strong><small>$48,200 premium</small></div><ChevronRight size={16} /></button><button className="attention-item"><span className="amber"><Clock3 size={16} /></span><div><strong>2 overdue tasks</strong><small>Oldest is 2 days late</small></div><ChevronRight size={16} /></button><button className="attention-item"><span className="violet"><Sparkles size={16} /></span><div><strong>3 AI opportunities</strong><small>$229,800 potential</small></div><ChevronRight size={16} /></button></div>
        </div>
      </section>
      <div className="section-heading report-library-title"><div><h2>Report library</h2><p>Open a report for detail, filters, and export.</p></div><div className="table-search"><Search size={16} /><input placeholder="Find a report…" /></div></div>
      <section className="report-card-grid">
        {reportCards.map(([name, description, Icon]) => <button className="report-card" key={name} onClick={() => setSelected(name)}><span><Icon size={20} /></span><div><h3>{name}</h3><p>{description}</p></div><ArrowRight size={16} /></button>)}
      </section>
    </>
  );
}

function AdminPage({ notify }: { notify: (message: string) => void }) {
  const sections = [
    { title: "Agency settings", body: "Business information, timezone, renewal windows, and defaults.", icon: Building2 },
    { title: "Users & roles", body: "Team access, role permissions, and assignment rules.", icon: Users },
    { title: "Carriers", body: "Carrier directory, products, appetite, and submission contacts.", icon: ShieldCheck },
    { title: "Tags & custom fields", body: "Structure agency-specific data without changing the core model.", icon: Settings2 },
    { title: "Branding", body: "Logo, colors, portal identity, and email presentation.", icon: WandSparkles },
    { title: "Integrations", body: "Email, SMS, AI provider, e-sign, and billing connections.", icon: Zap },
    { title: "Security & audit", body: "MFA, session policy, audit trail, and data controls.", icon: LockKeyhole },
    { title: "Website", body: "Domain, lead capture, pages, search visibility, and publishing.", icon: Globe2 },
  ];
  return (
    <>
      <PageTitle eyebrow="Configuration" title="Admin" description="Manage how Northstar Agency works, looks, and stays secure." />
      <section className="settings-grid">
        {sections.map(({ title, body, icon: Icon }) => <button className="settings-card" key={title} onClick={() => notify(`${title} settings opened`)}><span><Icon size={20} /></span><div><h2>{title}</h2><p>{body}</p></div><ChevronRight size={17} /></button>)}
      </section>
      <section className="panel team-section">
        <div className="panel-header"><div><span className="eyebrow">Team</span><h2>Users & roles</h2></div><button className="button primary small"><Plus size={15} />Invite user</button></div>
        <div className="team-list">{[
          ["Alex Morgan", "alex@northstaragency.com", "Owner", "Active"],
          ["Sam Patel", "sam@northstaragency.com", "Producer", "Active"],
          ["Jordan Lee", "jordan@northstaragency.com", "CSR", "Active"],
          ["Taylor Reed", "taylor@northstaragency.com", "CSR", "Active"],
        ].map(([name, email, role, status]) => <div key={name}><Avatar name={name} /><span><strong>{name}</strong><small>{email}</small></span><Badge tone="sky">{role}</Badge><Badge tone="mint">{status}</Badge><button className="icon-button"><MoreHorizontal size={18} /></button></div>)}</div>
      </section>
    </>
  );
}

export default App;
