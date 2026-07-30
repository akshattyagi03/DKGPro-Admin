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
import { CategoryModal } from '@/components/modals/FormModals';
import { Category } from '@/types';
import { FolderTree } from 'lucide-react';
import { addMainCategory, getCategories } from '@/api/admins';
import {
  deleteSuperAdminMainCategory,
  getSuperAdminCategoryTree,
  updateSuperAdminMainCategory,
} from '@/api/superadmins';
import { useAuth } from '@/contexts/AuthContext';
import { mainCategoriesToRows } from '@/utils/categoryTree';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

export default function Categories() {
  const { isVendorAdmin, isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

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

  const categories: Category[] = mainCategoriesToRows(rawCategories);

  const addMutation = useMutation({
    mutationFn: (body: { name: string }) => addMainCategory(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast({ title: 'Category created' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to create category';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const updateSuperMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateSuperAdminMainCategory(id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'category-tree'] });
      toast({ title: 'Category updated' });
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
    mutationFn: (id: string) => deleteSuperAdminMainCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'category-tree'] });
      toast({ title: 'Category deleted' });
      setDeleting(null);
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : 'Delete failed',
        variant: 'destructive',
      });
    },
  });

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data: Partial<Category>) => {
    if (!data.name?.trim()) return;
    if (isSuperAdmin && editing) {
      updateSuperMut.mutate({ id: editing.id, name: data.name.trim() });
      return;
    }
    addMutation.mutate({ name: data.name.trim() });
    setModalOpen(false);
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Categories"
        description={
          isSuperAdmin
            ? 'Rename or delete main categories.'
            : 'Manage main categories for your catalog.'
        }
      >
        {isVendorAdmin && (
          <Button onClick={() => openAdd()} disabled={addMutation.isPending}>
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        )}
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTableWrapper>
        {isLoading ? (
          <div className="p-8 text-muted-foreground text-sm">Loading…</div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            icon={<FolderTree className="w-8 h-8 text-muted-foreground" />}
            title="No categories found"
            description={
              isVendorAdmin
                ? 'Create a main category to use it when adding products.'
                : 'No main categories in the catalog.'
            }
            action={
              isVendorAdmin ? (
                <Button onClick={() => openAdd()}>
                  <Plus className="w-4 h-4" />
                  Add Category
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id} className="animate-fade-in">
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {category.description || '-'}
                  </TableCell>
                  <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(category.updatedAt).toLocaleDateString()}</TableCell>
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
                              setEditing(category);
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleting(category)}
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

      <CategoryModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setEditing(null);
        }}
        category={editing}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete main category?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &quot;{deleting?.name}&quot; from the catalog. Sub-categories may be
              affected depending on backend constraints.
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
