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
import { SubCategoryModal } from '@/components/modals/FormModals';
import { SubCategory } from '@/types';
import { Layers } from 'lucide-react';
import { addSubCategory, getCategories } from '@/api/admins';
import {
  deleteSuperAdminSubCategory,
  getSuperAdminCategoryTree,
  updateSuperAdminSubCategory,
} from '@/api/superadmins';
import { useAuth } from '@/contexts/AuthContext';
import { categorySelectOptions, flattenSubsAndThirds } from '@/utils/categoryTree';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

export default function SubCategories() {
  const { isVendorAdmin, isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubCategory | null>(null);
  const [deleting, setDeleting] = useState<SubCategory | null>(null);

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

  const { mainOptions } = categorySelectOptions(rawCategories);
  const { subCategories } = flattenSubsAndThirds(rawCategories);

  const filteredSubCategories = subCategories.filter(
    (sub) =>
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      (sub.categoryName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const addMutation = useMutation({
    mutationFn: (body: {
      name: string;
      mainCategory: string;
      bannerImage?: File | null;
    }) => addSubCategory(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast({ title: 'Sub-category created' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to create sub-category';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const updateSuperMut = useMutation({
    mutationFn: async (args: {
      id: string;
      name: string;
      mainCategory: string;
      bannerImage?: File | null;
    }) => {
      return updateSuperAdminSubCategory(
        args.id,
        { name: args.name, mainCategory: args.mainCategory },
        args.bannerImage ?? undefined
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'category-tree'] });
      toast({ title: 'Sub-category updated' });
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
    mutationFn: (id: string) => deleteSuperAdminSubCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'category-tree'] });
      toast({ title: 'Sub-category deleted' });
      setDeleting(null);
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : 'Delete failed',
        variant: 'destructive',
      });
    },
  });

  const handleSave = (data: Partial<SubCategory> & { bannerImage?: File | null }) => {
    const mainName =
      mainOptions.find((m) => m.id === data.categoryId)?.name ?? data.categoryName;
    if (!mainName || !data.name) {
      toast({ title: 'Select a parent category', variant: 'destructive' });
      return;
    }
    if (isSuperAdmin && editing) {
      const mainId =
        mainOptions.find((m) => m.id === data.categoryId)?.id ?? editing.categoryId;
      updateSuperMut.mutate({
        id: editing.id,
        name: data.name,
        mainCategory: mainId,
        bannerImage: data.bannerImage,
      });
      return;
    }
    addMutation.mutate({
      name: data.name,
      mainCategory: mainName,
      bannerImage: data.bannerImage,
    });
    setModalOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Sub-Categories"
        description={
          isSuperAdmin
            ? 'Edit or delete sub-categories.'
            : 'Add sub-categories under a main category.'
        }
      >
        {isVendorAdmin && (
          <Button onClick={() => setModalOpen(true)} disabled={addMutation.isPending}>
            <Plus className="w-4 h-4" />
            Add Sub-Category
          </Button>
        )}
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search sub-categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTableWrapper>
        {isLoading ? (
          <div className="p-8 text-muted-foreground text-sm">Loading…</div>
        ) : filteredSubCategories.length === 0 ? (
          <EmptyState
            icon={<Layers className="w-8 h-8 text-muted-foreground" />}
            title="No sub-categories found"
            description="Add sub-categories under a main category."
            action={
              isVendorAdmin ? (
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Add Sub-Category
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Parent Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Updated</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubCategories.map((subCategory) => (
                <TableRow key={subCategory.id} className="animate-fade-in">
                  <TableCell className="font-medium">{subCategory.name}</TableCell>
                  <TableCell>{subCategory.categoryName}</TableCell>
                  <TableCell className="text-muted-foreground">{subCategory.slug}</TableCell>
                  <TableCell>{new Date(subCategory.updatedAt).toLocaleDateString()}</TableCell>
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
                              setEditing(subCategory);
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleting(subCategory)}
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

      <SubCategoryModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setEditing(null);
        }}
        subCategory={editing}
        onSave={handleSave}
        mainCategories={mainOptions}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sub-category?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &quot;{deleting?.name}&quot;. Third-level categories that depend on it may
              be affected.
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
