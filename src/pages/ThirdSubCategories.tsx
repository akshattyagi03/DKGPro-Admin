import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, DataTableWrapper, EmptyState } from '@/components/shared/PageComponents';
import { Button } from '@/components/ui/button';
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
import { ThirdSubCategoryModal } from '@/components/modals/FormModals';
import { ThirdSubCategory } from '@/types';
import { GitBranch } from 'lucide-react';
import { addThirdCategory, getCategories } from '@/api/admins';
import {
  deleteSuperAdminThirdCategory,
  getSuperAdminCategoryTree,
  updateSuperAdminThirdCategory,
} from '@/api/superadmins';
import { useAuth } from '@/contexts/AuthContext';
import { categorySelectOptions, flattenSubsAndThirds } from '@/utils/categoryTree';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

export default function ThirdSubCategories() {
  const { isVendorAdmin, isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ThirdSubCategory | null>(null);
  const [deleting, setDeleting] = useState<ThirdSubCategory | null>(null);

  const { data: vendorCategories = [], isLoading: loadingVendor } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await getCategories()).categories,
    enabled: isVendorAdmin,
  });

  const { data: superTree = [], isLoading: loadingSuper } = useQuery({
    queryKey: ['superadmin', 'category-tree'],
    queryFn: async () => (await getSuperAdminCategoryTree()).categoryTree,
    enabled: isSuperAdmin,
  });

  const rawCategories = isSuperAdmin ? superTree : vendorCategories;
  const isLoading = isVendorAdmin ? loadingVendor : isSuperAdmin ? loadingSuper : false;

  const { mainOptions, subOptions } = categorySelectOptions(rawCategories);
  const { thirdSubCategories } = flattenSubsAndThirds(rawCategories);

  const filtered = thirdSubCategories.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.categoryName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (item.subCategoryName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const addMutation = useMutation({
    mutationFn: (body: {
      name: string;
      subCategory: string;
      bannerImage?: File | null;
    }) => addThirdCategory(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast({ title: 'Third sub-category created' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to create third sub-category';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const updateSuperMut = useMutation({
    mutationFn: async (args: {
      id: string;
      name: string;
      subCategory: string;
      bannerImage?: File | null;
    }) =>
      updateSuperAdminThirdCategory(
        args.id,
        { name: args.name, subCategory: args.subCategory },
        args.bannerImage ?? undefined
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'category-tree'] });
      toast({ title: 'Third sub-category updated' });
      setEditing(null);
      setModalOpen(false);
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : 'Update failed',
        variant: 'destructive',
      });
    },
  });

  const deleteSuperMut = useMutation({
    mutationFn: (id: string) => deleteSuperAdminThirdCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'category-tree'] });
      toast({ title: 'Third sub-category deleted' });
      setDeleting(null);
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : 'Delete failed',
        variant: 'destructive',
      });
    },
  });

  const handleSave = (data: Partial<ThirdSubCategory> & { bannerImage?: File | null }) => {
    const subName =
      subOptions.find((s) => s.id === data.subCategoryId)?.name ?? data.subCategoryName;
    if (!subName || !data.name) {
      toast({ title: 'Select sub-category and name', variant: 'destructive' });
      return;
    }
    if (isSuperAdmin && editing) {
      const subId =
        subOptions.find((s) => s.id === data.subCategoryId)?.id ?? editing.subCategoryId;
      updateSuperMut.mutate({
        id: editing.id,
        name: data.name,
        subCategory: subId,
        bannerImage: data.bannerImage,
      });
      return;
    }
    addMutation.mutate({
      name: data.name,
      subCategory: subName,
      bannerImage: data.bannerImage,
    });
    setModalOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Third Sub-Categories"
        description={
          isSuperAdmin
            ? 'Edit or delete third-level categories.'
            : 'Add third-level categories under a sub-category.'
        }
      >
        {isVendorAdmin && (
          <Button onClick={() => setModalOpen(true)} disabled={addMutation.isPending}>
            <Plus className="w-4 h-4" />
            Add Third Sub-Category
          </Button>
        )}
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search third sub-categories..."
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
            icon={<GitBranch className="w-8 h-8 text-muted-foreground" />}
            title="No third sub-categories found"
            description="Add third-level categories for product creation."
            action={
              isVendorAdmin ? (
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Add Third Sub-Category
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sub-Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Updated</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="animate-fade-in">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.categoryName}</TableCell>
                  <TableCell>{item.subCategoryName}</TableCell>
                  <TableCell className="text-muted-foreground">{item.slug}</TableCell>
                  <TableCell>{new Date(item.updatedAt).toLocaleDateString()}</TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(item);
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleting(item)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>

      <ThirdSubCategoryModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setEditing(null);
        }}
        thirdSubCategory={editing}
        onSave={handleSave}
        mainCategories={mainOptions}
        subCategories={subOptions}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete third sub-category?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &quot;{deleting?.name}&quot;. Products and banners linked to it may be
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && deleteSuperMut.mutate(deleting.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
