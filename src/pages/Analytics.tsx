import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, StatCard, DataTableWrapper } from '@/components/shared/PageComponents';
import { Button } from '@/components/ui/button';
import { getAdminAnalytics, getAdminProducts } from '@/api/admins';
import { formatInr, ordersByStatusForCharts } from '@/utils/analyticsDisplay';
import { ApiError } from '@/lib/api';
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const CHART_COLORS = ['hsl(239, 84%, 67%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(0, 84%, 60%)'];

function growthStatProps(growth: number) {
  if (growth === 0) return { trend: 'neutral' as const, change: undefined };
  if (growth > 0) return { trend: 'up' as const, change: growth };
  return { trend: 'down' as const, change: Math.abs(growth) };
}

export default function Analytics() {
  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: getAdminAnalytics,
  });

  const { data: productCount = 0 } = useQuery({
    queryKey: ['admin', 'products', 'count'],
    queryFn: async () => (await getAdminProducts()).products.length,
  });

  const salesTrend = analytics?.salesTrend ?? [];
  const ordersByStatus = analytics ? ordersByStatusForCharts(analytics.ordersByStatus) : [];
  const userGrowth = analytics?.userGrowth ?? [];
  const topProducts = analytics?.topProducts ?? [];

  const stats = analytics
    ? [
        {
          title: 'Total Revenue',
          value: formatInr(analytics.totalRevenue),
          icon: <DollarSign className="w-6 h-6" />,
          ...growthStatProps(analytics.revenueGrowth),
        },
        {
          title: 'Total Orders',
          value: analytics.totalOrders.toLocaleString('en-IN'),
          icon: <ShoppingCart className="w-6 h-6" />,
          ...growthStatProps(analytics.ordersGrowth),
        },
        {
          title: 'Your products',
          value: productCount.toLocaleString('en-IN'),
          trend: 'neutral' as const,
          icon: <Package className="w-6 h-6" />,
        },
        {
          title: 'Total users (platform)',
          value: analytics.totalUsers.toLocaleString('en-IN'),
          trend: 'neutral' as const,
          icon: <Users className="w-6 h-6" />,
        },
      ]
    : [];

  const revGrowth = analytics?.revenueGrowth ?? 0;
  const ordGrowth = analytics?.ordersGrowth ?? 0;

  return (
    <DashboardLayout>
      <PageHeader
        title="Analytics"
        description="Revenue and orders for products you sell."
      />

      {isError ? (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          {error instanceof ApiError ? error.message : 'Failed to load analytics.'}{' '}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      ) : analytics ? (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DataTableWrapper className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Revenue trend</h3>
                  <p className="text-sm text-muted-foreground">Last 6 months (full order totals)</p>
                </div>
                {revGrowth !== 0 ? (
                  <div
                    className={`flex items-center gap-2 text-sm font-medium ${
                      revGrowth > 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {revGrowth > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {revGrowth > 0 ? '+' : ''}
                    {revGrowth}%
                  </div>
                ) : null}
              </div>
              <div className="h-[300px]">
                {salesTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No revenue data in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrend}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                      <YAxis
                        className="text-muted-foreground"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatInr(value), 'Revenue']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(239, 84%, 67%)"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </DataTableWrapper>

            <DataTableWrapper className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Monthly revenue (bars)</h3>
                  <p className="text-sm text-muted-foreground">Same period as revenue trend</p>
                </div>
                {ordGrowth !== 0 ? (
                  <div
                    className={`flex items-center gap-2 text-sm font-medium ${
                      ordGrowth > 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {ordGrowth > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {ordGrowth > 0 ? '+' : ''}
                    {ordGrowth}%
                  </div>
                ) : null}
              </div>
              <div className="h-[300px]">
                {salesTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                      <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatInr(value), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </DataTableWrapper>

            <DataTableWrapper className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold">Orders by status</h3>
                <p className="text-sm text-muted-foreground">Your qualifying orders</p>
              </div>
              <div className="flex h-[300px] items-center">
                {ordersByStatus.length === 0 ? (
                  <p className="w-full text-center text-sm text-muted-foreground">No orders yet.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="50%" height="100%">
                      <PieChart>
                        <Pie
                          data={ordersByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="status"
                        >
                          {ordersByStatus.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {ordersByStatus.map((item, index) => (
                        <div key={item.status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="text-sm">{item.status}</span>
                          </div>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </DataTableWrapper>

            <DataTableWrapper className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">User growth</h3>
                  <p className="text-sm text-muted-foreground">New registrations (last 6 months)</p>
                </div>
              </div>
              <div className="h-[300px]">
                {userGrowth.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No user signups in this window.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                      <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="hsl(199, 89%, 48%)"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(199, 89%, 48%)', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </DataTableWrapper>
          </div>

          <DataTableWrapper className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Top products (your catalog)</h3>
              <p className="text-sm text-muted-foreground">By revenue on line items in qualifying orders</p>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                {topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:border-primary/50"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                    <p className="mb-1 line-clamp-2 text-sm font-medium">{product.name}</p>
                    <p className="text-2xl font-bold text-success">{formatInr(product.revenue)}</p>
                    <p className="text-sm text-muted-foreground">{product.sales} units</p>
                  </div>
                ))}
              </div>
            )}
          </DataTableWrapper>
        </>
      ) : null}
    </DashboardLayout>
  );
}
