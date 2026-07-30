import { useMemo, useState } from 'react';
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
import { AdditionalCategoryModal } from '@/components/modals/FormModals';
import { GitBranch } from 'lucide-react';
import { createAdditionalCategory, getCategoryTree } from '@/api/admins';
import {
  deleteSuperAdminAdditionalCategory,
  getSuperAdminCategoryTree,
  updateSuperAdminAdditionalCategory,
} from '@/api/superadmins';
import { useAuth } from '@/contexts/AuthContext';
import {
  flattenAdditionalCategoriesFromTree,
  thirdCategoryBreadcrumbOptions,
} from '@/utils/categoryTree';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';
import type { AdditionalCategory } from '@/types';

export default function AdditionalCategories() {
  const { isVendorAdmin, isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdditionalCategory | null>(null);
  const [deleting, setDeleting] = useState<AdditionalCategory | null>(null);

  const { data: vendorTree = [], isLoading: loadingVendor } = useQuery({
    queryKey: ['admin', 'category-tree'],
    queryFn: async () => (await getCategoryTree()).categoryTree,
    enabled: isVendorAdmin,
  });

  const { data: superTree = [], isLoading: loadingSuper } = useQuery({
    queryKey: ['superadmin', 'category-tree'],
    queryFn: async () => (await getSuperAdminCategoryTree()).categoryTree,
    enabled: isSuperAdmin,
  });

  const tree = isSuperAdmin ? superTree : vendorTree;
  const isLoading = isVendorAdmin ? loadingVendor : isSuperAdmin ? loadingSuper : false;

  const rows = useMemo(() => flattenAdditionalCategoriesFromTree(tree), [tree]);
  const thirdOptions = useMemo(() => thirdCategoryBreadcrumbOptions(tree), [tree]);
  const additionalParentNames = useMemo(
    () => Array.from(new Set(rows.map((r) => r.name))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filtered = rows.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.mainCategoryName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (item.subCategoryName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (item.thirdCategoryName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      item.parentName.toLowerCase().includes(search.toLowerCase())
  );

  const addMutation = useMutation({
    mutationFn: createAdditionalCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'category-tree'] });
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast({ title: 'Additional category created' });
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to create additional category';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const updateSuperMut = useMutation({
    mutationFn: async (args: {
      id: string;
      name: string;
      parentCategory: string;
      parentModel: 'ThirdCategory' | 'AdditionalCategory';
      level: number;
      bannerImage?: File | null;
    }) =>
      updateSuperAdminAdditionalCategory(
        args.id,
        {
          name: args.name,
          parentCategory: args.parentCategory,
          parentModel: args.parentModel,
          level: args.level,
        },
        args.bannerImage ?? undefined
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'category-tree'] });
      toast({ title: 'Additional category updated' });
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
    mutationFn: (id: string) => deleteSuperAdminAdditionalCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'category-tree'] });
      toast({ title: 'Additional category deleted' });
      setDeleting(null);
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : 'Delete failed',
        variant: 'destructive',
      });
    },
  });

  const handleSave = (data: {
    name: string;
    parentName: string;
    parentModel: 'ThirdCategory' | 'AdditionalCategory';
    bannerImage?: File | null;
  }) => {
    if (isSuperAdmin && editing) {
      const parentId = editing.parentCategoryId;
      if (!parentId) {
        toast({
          title: 'Missing parent id in tree — refresh and try again',
          variant: 'destructive',
        });
        return;
      }
      updateSuperMut.mutate({
        id: editing.id,
        name: data.name.trim(),
        parentCategory: parentId,
        parentModel: editing.parentModel,
        level: editing.level,
        bannerImage: data.bannerImage,
      });
      return;
    }
    addMutation.mutate(data);
    setModalOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Additional Categories"
        description={
          isSuperAdmin
            ? 'Edit name, banner, or delete additional categories.'
            : 'Add additional categories under a third or additional category.'
        }
      >
        {isVendorAdmin && (
          <Button
            onClick={() => setModalOpen(true)}
            disabled={addMutation.isPending || thirdOptions.length === 0}
          >
            <Plus className="w-4 h-4" />
            Add Additional Category
          </Button>
        )}
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search additional categories..."
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
            title={rows.length === 0 ? 'No additional categories yet' : 'No additional categories found'}
            description={
              thirdOptions.length === 0
                ? 'Add third sub-categories first, then create additional categories under them.'
                : 'Add categories under a third sub-category or nest under another additional category.'
            }
            action={
              isVendorAdmin ? (
                <Button
                  onClick={() => setModalOpen(true)}
                  disabled={thirdOptions.length === 0}
                >
                  <Plus className="w-4 h-4" />
                  Add Additional Category
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
                <TableHead>Third</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Updated</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="animate-fade-in">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.mainCategoryName}</TableCell>
                  <TableCell>{item.subCategoryName}</TableCell>
                  <TableCell>{item.thirdCategoryName}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-xs block">
                      {item.parentModel}
                    </span>
                    {item.parentName}
                  </TableCell>
                  <TableCell>{item.level}</TableCell>
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

      <AdditionalCategoryModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setEditing(null);
        }}
        additionalCategory={editing}
        onSave={handleSave}
        thirdOptions={thirdOptions}
        additionalParentNames={additionalParentNames}
        lockParent={Boolean(isSuperAdmin && editing)}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete additional category?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &quot;{deleting?.name}&quot; and nested children may be affected.
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
