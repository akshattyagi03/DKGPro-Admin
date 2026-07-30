import { useMemo, useState } from 'react';
import { Search, Shield, UserCog, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, DataTableWrapper, EmptyState } from '@/components/shared/PageComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/types';
import { Users as UsersIcon } from 'lucide-react';
import { getAllUsers, type ApiAllUsersDoc, type ApiAllUsersResponse } from '@/api/admins';
import {
  approveSuperAdminVendor,
  getSuperAdminPendingAdmins,
  rejectSuperAdminVendor,
} from '@/api/superadmins';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

const PAGE_SIZE = 20;

function apiDocToUser(doc: ApiAllUsersDoc, kind: 'superadmin' | 'admin' | 'user'): User {
  const id = doc._id;
  const name = doc.fullName?.trim() || '—';
  const email = doc.email?.trim() || '—';
  const createdAt = doc.createdAt
    ? new Date(doc.createdAt).toISOString()
    : new Date().toISOString();
  let role: UserRole;
  if (kind === 'superadmin') role = 'super-admin';
  else if (kind === 'admin') role = 'admin';
  else role = 'guest';
  let status: User['status'];
  if (kind === 'admin' && doc.isApproved === false) status = 'inactive';
  else status = 'active';
  return { id, name, email, role, createdAt, status };
}

function mergeAllUsers(data: ApiAllUsersResponse): User[] {
  const out: User[] = [];
  for (const d of data.superAdmins.data) {
    out.push(apiDocToUser(d, 'superadmin'));
  }
  for (const d of data.admins.data) {
    out.push(apiDocToUser(d, 'admin'));
  }
  for (const d of data.users.data) {
    out.push(apiDocToUser(d, 'user'));
  }
  return out;
}

function listPagination(data: ApiAllUsersResponse) {
  const { superAdmins, admins, users } = data;
  const totalPages = Math.max(
    superAdmins.pagination.totalPages,
    admins.pagination.totalPages,
    users.pagination.totalPages
  );
  const totalPeople =
    superAdmins.pagination.total + admins.pagination.total + users.pagination.total;
  const hasNext =
    superAdmins.pagination.hasNext || admins.pagination.hasNext || users.pagination.hasNext;
  const currentPage = users.pagination.currentPage;
  const hasPrev = users.pagination.hasPrev;
  return { totalPages, totalPeople, hasNext, currentPage, hasPrev };
}

function pendingRow(doc: Record<string, unknown>) {
  return {
    id: String(doc._id ?? doc.id ?? ''),
    name: String(doc.fullName ?? '—'),
    email: String(doc.email ?? '—'),
  };
}

export default function Users() {
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['superadmin', 'pending-admins'],
    queryFn: getSuperAdminPendingAdmins,
    enabled: isSuperAdmin,
  });

  const approveMut = useMutation({
    mutationFn: approveSuperAdminVendor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'pending-admins'] });
      toast({ title: 'Vendor approved' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Approval failed';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const rejectMut = useMutation({
    mutationFn: rejectSuperAdminVendor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'pending-admins'] });
      toast({ title: 'Request rejected' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Reject failed';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'all-users', page, PAGE_SIZE],
    queryFn: async () => {
      const res = await getAllUsers({ page, limit: PAGE_SIZE });
      return { merged: mergeAllUsers(res), meta: listPagination(res) };
    },
    enabled: !isSuperAdmin,
  });

  const users = data?.merged ?? [];
  const pageMeta = data?.meta;

  const pendingRows = useMemo(() => {
    const list = pendingData?.pendingAdmins ?? [];
    return list.map((d) => pendingRow(d as Record<string, unknown>));
  }, [pendingData]);

  const filteredPending = useMemo(() => {
    return pendingRows.filter((row) => {
      const q = search.toLowerCase();
      return row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q);
    });
  }, [pendingRows, search]);

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super-admin':
        return <Shield className="w-3 h-3" />;
      case 'admin':
        return <UserCog className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const errMessage = isError && error instanceof Error ? error.message : 'Failed to load users.';

  if (isSuperAdmin) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Vendor approvals"
          description="Pending vendor admin accounts — approve to allow sign-in, or reject the request."
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <DataTableWrapper>
          {pendingLoading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading pending requests…</p>
          ) : filteredPending.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="w-8 h-8 text-muted-foreground" />}
              title="No pending vendors"
              description="New vendor signups awaiting approval will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPending.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.email}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          disabled={approveMut.isPending || rejectMut.isPending}
                          onClick={() => approveMut.mutate(row.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={approveMut.isPending || rejectMut.isPending}
                          onClick={() => rejectMut.mutate(row.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DataTableWrapper>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title="Users" description="View platform users" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super-admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <DataTableWrapper>
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading users…</p>
        ) : isError ? (
          <p className="p-8 text-center text-destructive">{errMessage}</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-8 h-8 text-muted-foreground" />}
            title="No users found"
            description="No users match your search criteria on this page."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id} className="animate-fade-in">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === 'super-admin'
                          ? 'default'
                          : user.role === 'admin'
                            ? 'info'
                            : 'secondary'
                      }
                      className="capitalize gap-1"
                    >
                      {getRoleIcon(user.role)}
                      {user.role.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status as never} className="capitalize">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('en-IN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>

      {pageMeta && pageMeta.totalPages > 1 ? (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pageMeta.currentPage} of {pageMeta.totalPages} · {pageMeta.totalPeople} people total
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pageMeta.hasPrev || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pageMeta.hasNext || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
