import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Briefcase, Mail, Phone, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, DataTableWrapper, EmptyState } from '@/components/shared/PageComponents';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getAdminCorporateBookings,
  updateAdminCorporateBookingStatus,
} from '@/api/admins';
import {
  getSuperAdminCorporateBookings,
  updateSuperAdminCorporateBookingStatus,
  type ApiCorporateBooking,
  type CorporateBookingStatus,
} from '@/api/superadmins';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

function parseCompany(message?: string): string {
  if (!message) return '—';
  const line = message.split('\n').find((l) => l.startsWith('Company:'));
  return line ? line.replace(/^Company:\s*/, '').trim() : '—';
}

function parseEventDetails(message?: string): string {
  if (!message) return '';
  const lines = message.split('\n').filter((l) => !l.startsWith('Company:'));
  return lines.join('\n').trim();
}

export default function CorporateBookings() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<ApiCorporateBooking | null>(null);

  const bookingsQueryKey = isSuperAdmin
    ? (['superadmin', 'corporate-bookings'] as const)
    : (['admin', 'corporate-bookings'] as const);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: bookingsQueryKey,
    queryFn: isSuperAdmin ? getSuperAdminCorporateBookings : getAdminCorporateBookings,
  });

  const updateStatusMut = useMutation({
    mutationFn: ({
      contactId,
      status,
    }: {
      contactId: string;
      status: CorporateBookingStatus;
    }) =>
      isSuperAdmin
        ? updateSuperAdminCorporateBookingStatus(contactId, status)
        : updateAdminCorporateBookingStatus(contactId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'corporate-bookings'] });
      qc.invalidateQueries({ queryKey: ['admin', 'corporate-bookings'] });
      toast({ title: 'Booking status updated' });
    },
    onError: (err) => {
      toast({
        title: 'Update failed',
        description: err instanceof ApiError ? err.message : 'Try again',
        variant: 'destructive',
      });
    },
  });

  const bookings = useMemo(() => {
    const list = data?.bookings ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        (b.message ?? '').toLowerCase().includes(q)
      );
    });
  }, [data?.bookings, search, statusFilter]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Corporate bookings"
        description="Event booking requests submitted from the corporate events page."
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTableWrapper>
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground">Loading bookings…</p>
        ) : isError ? (
          <EmptyState
            icon={<Briefcase className="w-10 h-10" />}
            title="Could not load bookings"
            description={error instanceof ApiError ? error.message : 'Please try again'}
            action={
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => refetch()}
              >
                Retry
              </button>
            }
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-10 h-10" />}
            title="No corporate bookings yet"
            description="Submissions from the corporate events booking form will appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow
                  key={b._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelected(b)}
                >
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>
                    <a
                      href={`mailto:${b.email}`}
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {b.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`tel:${b.phone}`}
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {b.phone}
                    </a>
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate">
                    {parseCompany(b.message)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={b.status}
                      onValueChange={(v) =>
                        updateStatusMut.mutate({
                          contactId: b._id,
                          status: v as CorporateBookingStatus,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-[130px] capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {format(new Date(b.createdAt), 'dd MMM yyyy, HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${selected.email}`} className="text-primary hover:underline">
                    {selected.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${selected.phone}`} className="text-primary hover:underline">
                    {selected.phone}
                  </a>
                </div>
                <div>
                  <p className="font-medium text-foreground">Company</p>
                  <p className="text-muted-foreground">{parseCompany(selected.message)}</p>
                </div>
                {parseEventDetails(selected.message) ? (
                  <div>
                    <p className="font-medium text-foreground">Event details</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {parseEventDetails(selected.message)}
                    </p>
                  </div>
                ) : null}
                <div>
                  <p className="font-medium text-foreground">Submitted</p>
                  <p className="text-muted-foreground">
                    {format(new Date(selected.createdAt), 'PPpp')}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
