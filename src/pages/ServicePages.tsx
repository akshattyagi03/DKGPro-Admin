import { useEffect, useMemo, useState, type ElementType } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Pencil, Plus, Sparkles, Trash2, Utensils, Gamepad2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, EmptyState } from '@/components/shared/PageComponents';
import { CategoryBannerSingleField } from '@/components/modals/CategoryBannerSingleField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  addAdminServicePageItem,
  deleteAdminServicePageItem,
  getAdminServicePages,
  updateAdminServicePage,
  updateAdminServicePageItem,
  type ApiServicePage,
  type ApiServicePageItem,
  type ServicePageKey,
} from '@/api/admins';
import {
  addSuperAdminServicePageItem,
  deleteSuperAdminServicePageItem,
  getSuperAdminServicePages,
  updateSuperAdminServicePage,
  updateSuperAdminServicePageItem,
} from '@/api/superadmins';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

const TAB_META: {
  key: ServicePageKey;
  label: string;
  icon: ElementType;
}[] = [
  { key: 'photography', label: 'Photography', icon: Camera },
  { key: 'catering', label: 'Catering', icon: Utensils },
  { key: 'games', label: 'Games & Activities', icon: Gamepad2 },
  { key: 'effects', label: 'Special Effects', icon: Sparkles },
];

export default function ServicePages() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [activeKey, setActiveKey] = useState<ServicePageKey>('photography');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [heroFile, setHeroFile] = useState<File | null>(null);

  const [itemModal, setItemModal] = useState<{
    open: boolean;
    edit: ApiServicePageItem | null;
  }>({ open: false, edit: null });
  const [itemTitle, setItemTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemSortOrder, setItemSortOrder] = useState('0');
  const [itemFile, setItemFile] = useState<File | null>(null);

  const queryKey = isSuperAdmin
    ? (['superadmin', 'service-pages'] as const)
    : (['admin', 'service-pages'] as const);

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: isSuperAdmin ? getSuperAdminServicePages : getAdminServicePages,
  });

  const pagesByKey = useMemo(() => {
    const map = new Map<ServicePageKey, ApiServicePage>();
    for (const p of data?.pages ?? []) map.set(p.serviceKey, p);
    return map;
  }, [data]);

  const page = pagesByKey.get(activeKey) ?? null;

  useEffect(() => {
    if (!page) return;
    setTitle(page.hero.title);
    setSubtitle(page.hero.subtitle);
    setHeroFile(null);
  }, [page?.serviceKey, page?.updatedAt, page?.hero.title, page?.hero.subtitle]);

  const invalidate = () => qc.invalidateQueries({ queryKey });

  const saveHeroMut = useMutation({
    mutationFn: () =>
      isSuperAdmin
        ? updateSuperAdminServicePage(activeKey, {
            title,
            subtitle,
            heroImage: heroFile,
          })
        : updateAdminServicePage(activeKey, {
            title,
            subtitle,
            heroImage: heroFile,
          }),
    onSuccess: () => {
      invalidate();
      setHeroFile(null);
      toast({ title: 'Service page saved' });
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : 'Failed to save page',
        variant: 'destructive',
      });
    },
  });

  const saveItemMut = useMutation({
    mutationFn: async () => {
      if (itemModal.edit) {
        const body = {
          title: itemTitle.trim(),
          description: itemDescription.trim(),
          sortOrder: Number(itemSortOrder) || 0,
          image: itemFile,
        };
        return isSuperAdmin
          ? updateSuperAdminServicePageItem(activeKey, itemModal.edit.id, body)
          : updateAdminServicePageItem(activeKey, itemModal.edit.id, body);
      }
      if (!itemFile) throw new Error('Item image is required');
      const body = {
        title: itemTitle.trim(),
        description: itemDescription.trim(),
        sortOrder: Number(itemSortOrder) || 0,
        image: itemFile,
      };
      return isSuperAdmin
        ? addSuperAdminServicePageItem(activeKey, body)
        : addAdminServicePageItem(activeKey, body);
    },
    onSuccess: () => {
      invalidate();
      setItemModal({ open: false, edit: null });
      toast({ title: itemModal.edit ? 'Item updated' : 'Item added' });
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed',
        variant: 'destructive',
      });
    },
  });

  const deleteItemMut = useMutation({
    mutationFn: (itemId: string) =>
      isSuperAdmin
        ? deleteSuperAdminServicePageItem(activeKey, itemId)
        : deleteAdminServicePageItem(activeKey, itemId),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Item deleted' });
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : 'Failed to delete',
        variant: 'destructive',
      });
    },
  });

  const openAddItem = () => {
    setItemTitle('');
    setItemDescription('');
    setItemSortOrder(String(page?.items.length ?? 0));
    setItemFile(null);
    setItemModal({ open: true, edit: null });
  };

  const openEditItem = (item: ApiServicePageItem) => {
    setItemTitle(item.title);
    setItemDescription(item.description || '');
    setItemSortOrder(String(item.sortOrder ?? 0));
    setItemFile(null);
    setItemModal({ open: true, edit: item });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Service pages"
        description="Manage Photography, Catering, Games & Activities, and Special Effects pages shown from product detail."
      />

      {isLoading ? (
        <p className="text-muted-foreground animate-pulse">Loading service pages…</p>
      ) : isError ? (
        <p className="text-destructive">
          {error instanceof ApiError ? error.message : 'Failed to load service pages'}
        </p>
      ) : (
        <Tabs value={activeKey} onValueChange={(v) => setActiveKey(v as ServicePageKey)}>
          <TabsList className="mb-6 flex h-auto flex-wrap gap-1">
            {TAB_META.map(({ key, label, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TAB_META.map(({ key, label }) => (
            <TabsContent key={key} value={key} className="space-y-6">
              {!page || page.serviceKey !== key ? null : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>{label} hero</CardTitle>
                      <CardDescription>
                        Title, subtitle, and hero image shown on the guest page.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`title-${key}`}>Title</Label>
                          <Input
                            id={`title-${key}`}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor={`subtitle-${key}`}>Subtitle</Label>
                          <Textarea
                            id={`subtitle-${key}`}
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                      <CategoryBannerSingleField
                        file={heroFile}
                        onChange={setHeroFile}
                        id={`hero-${key}`}
                        label="Hero image"
                        description="Shown at the top of the guest service page."
                        remotePreviewUrl={page.hero.image}
                        remotePreviewCaption="Current hero"
                      />
                      <Button
                        onClick={() => saveHeroMut.mutate()}
                        disabled={saveHeroMut.isPending}
                      >
                        {saveHeroMut.isPending ? 'Saving…' : 'Save hero'}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle>Packages / gallery</CardTitle>
                        <CardDescription>
                          Upload cards with images — shown in a grid on the guest page.
                        </CardDescription>
                      </div>
                      <Button type="button" size="sm" onClick={openAddItem}>
                        <Plus className="mr-1 h-4 w-4" />
                        Add item
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {page.items.length === 0 ? (
                        <EmptyState
                          icon={<Sparkles className="h-6 w-6 text-muted-foreground" />}
                          title="No items yet"
                          description="Add packages or gallery images for this service page."
                        />
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {page.items.map((item) => (
                            <div
                              key={item.id}
                              className="overflow-hidden rounded-xl border bg-card shadow-sm"
                            >
                              <div className="aspect-[4/3] bg-muted">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
                              </div>
                              <div className="space-y-2 p-3">
                                <p className="font-medium leading-snug">{item.title}</p>
                                {item.description ? (
                                  <p className="line-clamp-2 text-sm text-muted-foreground">
                                    {item.description}
                                  </p>
                                ) : null}
                                <div className="flex gap-2 pt-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditItem(item)}
                                  >
                                    <Pencil className="mr-1 h-3.5 w-3.5" />
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    disabled={deleteItemMut.isPending}
                                    onClick={() => {
                                      if (window.confirm(`Delete “${item.title}”?`)) {
                                        deleteItemMut.mutate(item.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Dialog
        open={itemModal.open}
        onOpenChange={(open) => {
          if (!open) setItemModal({ open: false, edit: null });
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{itemModal.edit ? 'Edit item' : 'Add item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="item-title">Title</Label>
              <Input
                id="item-title"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-sort">Sort order</Label>
              <Input
                id="item-sort"
                type="number"
                value={itemSortOrder}
                onChange={(e) => setItemSortOrder(e.target.value)}
              />
            </div>
            <CategoryBannerSingleField
              file={itemFile}
              onChange={setItemFile}
              id="item-image"
              label="Item image"
              description={
                itemModal.edit
                  ? 'Optional — leave empty to keep the current image.'
                  : 'Required for new items.'
              }
              remotePreviewUrl={itemModal.edit?.image ?? null}
              remotePreviewCaption="Current image"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setItemModal({ open: false, edit: null })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saveItemMut.isPending || !itemTitle.trim()}
              onClick={() => saveItemMut.mutate()}
            >
              {saveItemMut.isPending ? 'Saving…' : itemModal.edit ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
