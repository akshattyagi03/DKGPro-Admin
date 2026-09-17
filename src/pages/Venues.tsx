import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MapPin, Building2, MoreHorizontal } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VenueModal, type VenueSavePayload } from '@/components/modals/FormModals';
import { createVenue, getAdminVenues, type ApiVenueDoc } from '@/api/admins';
import { getSuperAdminVenues, superAdminUpdateVenue, superAdminDeleteVenue } from '@/api/superadmins';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

function rowFromApi(v: ApiVenueDoc) {
  return {
    id: String(v._id),
    name: v.name,
    address: v.location?.address?.trim() || '—',
    startingPrice: typeof v.startingPrice === 'number' ? v.startingPrice : 0,
    imageCount: Array.isArray(v.images) ? v.images.length : 0,
    tags: [...(v.typesOfVenues ?? []), ...(v.facilities ?? [])].slice(0, 4),
    createdAt: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—',
  };
}

export default function Venues() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<ApiVenueDoc | null>(null);
  const [deletingVenue, setDeletingVenue] = useState<ApiVenueDoc | null>(null);

  useEffect(() => {
    if (isSuperAdmin) return;
    if (location.pathname === '/venues/add') {
      setModalOpen(true);
      navigate('/venues', { replace: true });
    }
  }, [location.pathname, navigate, isSuperAdmin]);

  const { data: rawVenues = [], isLoading } = useQuery({
    queryKey: isSuperAdmin ? ['superadmin', 'venues'] : ['admin', 'venues'],
    queryFn: async () => {
      if (isSuperAdmin) {
        const r = await getSuperAdminVenues();
        return r.venues as ApiVenueDoc[];
      }
      return (await getAdminVenues()).venues;
    },
  });

  const rows = rawVenues.map(rowFromApi);

  const createMut = useMutation({
    mutationFn: createVenue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'venues'] });
      toast({ title: 'Venue created' });
      setModalOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to create venue';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const superUpdateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VenueSavePayload }) =>
      superAdminUpdateVenue(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'venues'] });
      toast({ title: 'Venue updated' });
      setEditingVenue(null);
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : 'Update failed',
        variant: 'destructive',
      });
    },
  });

  const superDeleteMut = useMutation({
    mutationFn: (id: string) => superAdminDeleteVenue(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'venues'] });
      toast({ title: 'Venue deleted' });
      setDeletingVenue(null);
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : 'Delete failed',
        variant: 'destructive',
      });
    },
  });

  const filtered = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data: VenueSavePayload) => {
    if (isSuperAdmin && editingVenue) {
      superUpdateMut.mutate({ id: String(editingVenue._id), data });
      return;
    }

    const typesOfVenues = (data.typesOfVenues ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const facilities = (data.facilities ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const accessibilityFeatures = (data.accessibilityFeatures ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const restrictions = (data.restrictions ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const weeksRaw =
      data.advanceBookingWeeks != null && String(data.advanceBookingWeeks).trim() !== ''
        ? Number(data.advanceBookingWeeks)
        : undefined;
    const advanceBookingWeeks =
      weeksRaw != null && Number.isFinite(weeksRaw) && weeksRaw >= 0 ? weeksRaw : undefined;
    const inHouseDecor = Boolean(data.inHouseDecor);
    const otherInformation =
      inHouseDecor || advanceBookingWeeks != null
        ? {
            ...(inHouseDecor ? { inHouseDecor: true } : {}),
            ...(advanceBookingWeeks != null ? { advanceBookingWeeks } : {}),
          }
        : undefined;
    const startingPrice = Number(data.startingPrice);
    if (!data.name?.trim() || !data.description?.trim() || !data.address?.trim()) {
      toast({ title: 'Name, address, and description are required', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(startingPrice) || startingPrice < 0) {
      toast({ title: 'Valid starting price is required', variant: 'destructive' });
      return;
    }
    if (!data.imageFiles?.length) {
      toast({ title: 'At least one image is required', variant: 'destructive' });
      return;
    }
    const cMin = data.capacityMin != null && String(data.capacityMin).trim() !== '' ? Number(data.capacityMin) : undefined;
    const cMax = data.capacityMax != null && String(data.capacityMax).trim() !== '' ? Number(data.capacityMax) : undefined;
    const capacity =
      cMin != null && cMax != null && Number.isFinite(cMin) && Number.isFinite(cMax)
        ? { min: cMin, max: cMax }
        : undefined;
    createMut.mutate({
      name: data.name.trim(),
      description: data.description.trim(),
      startingPrice,
      location: {
        address: data.address.trim(),
        ...(data.city?.trim() ? { city: data.city.trim() } : {}),
        ...(data.mapsUrl?.trim() ? { mapsUrl: data.mapsUrl.trim() } : {}),
        lat:
          data.lat != null && String(data.lat).trim() !== ''
            ? Number(data.lat)
            : undefined,
        lng:
          data.lng != null && String(data.lng).trim() !== ''
            ? Number(data.lng)
            : undefined,
      },
      typesOfVenues,
      facilities,
      accessibilityFeatures,
      restrictions,
      ...(otherInformation != null ? { otherInformation } : {}),
      capacity,
      imageFiles: data.imageFiles,
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Venues"
        description={
          isSuperAdmin
            ? 'Edit or delete venues.'
            : 'Manage venues and upload venue images.'
        }
      >
        {!isSuperAdmin ? (
          <Button onClick={() => setModalOpen(true)} disabled={createMut.isPending}>
            <Plus className="w-4 h-4" />
            Add Venue
          </Button>
        ) : null}
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTableWrapper>
        {isLoading ? (
          <div className="p-8 text-muted-foreground text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-8 h-8 text-muted-foreground" />}
            title="No venues found"
            description="Create a venue with photos and pricing."
            action={
              !isSuperAdmin ? (
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Add Venue
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>From price</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Created</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const raw = rawVenues.find((v) => String(v._id) === row.id);
                return (
                  <TableRow key={row.id} className="animate-fade-in">
                    <TableCell>
                      <div>
                        <p className="font-medium">{row.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1.5 text-sm text-muted-foreground max-w-xs">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{row.address}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">₹{row.startingPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{row.imageCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {row.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{row.createdAt}</TableCell>
                    {isSuperAdmin && raw ? (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Actions">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingVenue(raw)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingVenue(raw)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>

      {!isSuperAdmin ? (
        <VenueModal open={modalOpen} onOpenChange={setModalOpen} onSave={handleSave} />
      ) : null}

      {isSuperAdmin ? (
        <VenueModal
          open={!!editingVenue}
          onOpenChange={(o) => !o && setEditingVenue(null)}
          onSave={handleSave}
          initialVenue={editingVenue}
          mode={editingVenue ? 'superEdit' : 'create'}
        />
      ) : null}

      <AlertDialog open={!!deletingVenue} onOpenChange={(o) => !o && setDeletingVenue(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete venue?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &quot;{deletingVenue?.name}&quot; from the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingVenue && superDeleteMut.mutate(String(deletingVenue._id))}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
