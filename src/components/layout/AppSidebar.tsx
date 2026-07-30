import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Users,
  ShoppingCart,
  FileText,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Settings,
  Layers,
  Plus,
  List,
  Building2,
  ImageIcon,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: { label: string; href: string; icon?: React.ElementType }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  {
    label: 'Category',
    icon: FolderTree,
    children: [
      { label: 'Category List', href: '/categories', icon: List },
      { label: 'Sub-Category List', href: '/sub-categories', icon: List },
      { label: 'Third Sub-Category List', href: '/third-sub-categories', icon: List },
      { label: 'Additional Category List', href: '/additional-categories', icon: List },
      { label: 'Add Category', href: '/categories/add', icon: Plus },
      { label: 'Add Sub-Category', href: '/sub-categories/add', icon: Plus },
      { label: 'Add Third Sub-Category', href: '/third-sub-categories/add', icon: Plus },
      { label: 'Add Additional Category', href: '/additional-categories/add', icon: Plus },
    ],
  },
  { label: 'Hero banners', icon: ImageIcon, href: '/hero-banners' },
  { label: 'Service pages', icon: Sparkles, href: '/service-pages' },
  {
    label: 'Product',
    icon: Package,
    children: [
      { label: 'Product List', href: '/products', icon: List },
      { label: 'Add Product', href: '/products/add', icon: Plus },
    ],
  },
  {
    label: 'Blog',
    icon: FileText,
    children: [
      { label: 'Blog List', href: '/blogs', icon: List },
      { label: 'Add Blog', href: '/blogs/add', icon: Plus },
    ],
  },
  {
    label: 'Venue',
    icon: Building2,
    children: [
      { label: 'Venue List', href: '/venues', icon: List },
      { label: 'Add Venue', href: '/venues/add', icon: Plus },
    ],
  },
  { label: 'Users', icon: Users, href: '/users' },
  { label: 'Orders', icon: ShoppingCart, href: '/orders' },
  { label: 'Corporate bookings', icon: Briefcase, href: '/corporate-bookings' },
  { label: 'Billing System', icon: FileText, href: '/billing' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Category', 'Product', 'Venue']);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, superAdminUser, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const visibleNavItems = useMemo(() => {
    if (!isSuperAdmin) return navItems;
    return [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      {
        label: 'Category',
        icon: FolderTree,
        children: [
          { label: 'Category List', href: '/categories', icon: List },
          { label: 'Sub-Category List', href: '/sub-categories', icon: List },
          { label: 'Third Sub-Category List', href: '/third-sub-categories', icon: List },
          { label: 'Additional Category List', href: '/additional-categories', icon: List },
        ],
      },
      { label: 'Hero banners', icon: ImageIcon, href: '/hero-banners' },
      { label: 'Service pages', icon: Sparkles, href: '/service-pages' },
      {
        label: 'Product',
        icon: Package,
        children: [{ label: 'Product List', href: '/products', icon: List }],
      },
      {
        label: 'Venue',
        icon: Building2,
        children: [{ label: 'Venue List', href: '/venues', icon: List }],
      },
      {
        label: 'Blog',
        icon: FileText,
        children: [{ label: 'Blog List', href: '/blogs', icon: List }],
      },
      { label: 'Users', icon: Users, href: '/users' },
      { label: 'Orders', icon: ShoppingCart, href: '/orders' },
      { label: 'Corporate bookings', icon: Briefcase, href: '/corporate-bookings' },
    ] as NavItem[];
  }, [isSuperAdmin]);

  const displayName = isSuperAdmin ? superAdminUser?.fullName : user?.name;
  const displayRole = isSuperAdmin ? 'Super admin' : user?.role?.replace('-', ' ');
  const avatarLetter = (displayName || 'U').charAt(0);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (children: { href: string }[]) =>
    children.some((child) => location.pathname === child.href);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Layers className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-sidebar-foreground">E-Commerce</span>
            <span className="text-xs text-sidebar-muted">Admin Panel</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.label);
          const parentActive = hasChildren && isParentActive(item.children!);

          if (hasChildren) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className={cn(
                    'flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    parentActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>
                {!collapsed && isExpanded && (
                  <div className="mt-1 ml-4 space-y-1 border-l border-sidebar-border pl-4">
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          to={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                            isActive(child.href)
                              ? 'bg-sidebar-primary/20 text-sidebar-primary-foreground font-medium'
                              : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
                          )}
                        >
                          {ChildIcon && <ChildIcon className="w-4 h-4" />}
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href!}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive(item.href!)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent',
            collapsed && 'justify-center'
          )}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
            {avatarLetter}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-sidebar-muted capitalize">
                {displayRole}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
          className={cn(
            'w-full mt-2 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed && 'px-0'
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card shadow-card"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen bg-sidebar transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <NavContent />

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3 rotate-90" />
          )}
        </button>
      </aside>
    </>
  );
}
