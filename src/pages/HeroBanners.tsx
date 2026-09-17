import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/PageComponents';
import { CategoryBannerSingleField } from '@/components/modals/CategoryBannerSingleField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { addHeroBanner, getCategories, getCategoryTree } from '@/api/admins';
import { getSuperAdminCategoryTree, superAdminAddHeroBanner } from '@/api/superadmins';
import { useAuth } from '@/contexts/AuthContext';
import { categorySelectOptions, thirdCategoryBreadcrumbOptions } from '@/utils/categoryTree';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

type TargetKind = 'sub' | 'third';
type Placement =
  | 'hero'
  | 'festival'
  | 'festival_hub'
  | 'wedding'
  | 'wedding_extra'
  | 'romantic_couple'
  | 'kids'
  | 'occasion'
  | 'birthday_level_up'
  | 'birthday_extra_special'
  | 'corporate_hero'
  | 'corporate_gallery'
  | 'corporate_gifting';

export default function HeroBanners() {
  const { isVendorAdmin, isSuperAdmin } = useAuth();
  const canUpload = isVendorAdmin || isSuperAdmin;
  const qc = useQueryClient();
  const [kind, setKind] = useState<TargetKind>('sub');
  const [subName, setSubName] = useState<string>('');
  const [thirdName, setThirdName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [placement, setPlacement] = useState<Placement>('hero');
  const [sortOrder, setSortOrder] = useState<string>('0');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const { data: vendorCategories = [], isLoading: loadingVendorCats } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await getCategories()).categories,
    enabled: isVendorAdmin,
  });

  const { data: vendorTree = [], isLoading: loadingVendorTree } = useQuery({
    queryKey: ['admin', 'category-tree'],
    queryFn: async () => (await getCategoryTree()).categoryTree,
    enabled: isVendorAdmin,
  });

  const { data: superTree = [], isLoading: loadingSuperTree } = useQuery({
    queryKey: ['superadmin', 'category-tree'],
    queryFn: async () => (await getSuperAdminCategoryTree()).categoryTree,
    enabled: isSuperAdmin,
  });

  const rawCategories = isSuperAdmin ? superTree : vendorCategories;
  const categoryTree = isSuperAdmin ? superTree : vendorTree;
  const isLoading = canUpload
    ? isSuperAdmin
      ? loadingSuperTree
      : loadingVendorCats || loadingVendorTree
    : false;

  const { mainOptions, subOptions, thirdOptions } = categorySelectOptions(rawCategories);

  const subSelectItems = useMemo(() => {
    return subOptions.map((s) => {
      const mainLabel = mainOptions.find((m) => m.id === s.categoryId)?.name ?? '—';
      return {
        value: s.name,
        label: `${mainLabel} › ${s.name}`,
      };
    });
  }, [subOptions, mainOptions]);

  const thirdSelectItems = useMemo(
    () => thirdCategoryBreadcrumbOptions(categoryTree),
    [categoryTree]
  );

  const mutation = useMutation({
    mutationFn: (payload: {
      image: File;
      subCategory?: string;
      thirdCategory?: string;
      placement?: Placement;
      sortOrder?: number;
      title?: string;
      description?: string;
    }) =>
      isSuperAdmin ? superAdminAddHeroBanner(payload) : addHeroBanner(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      qc.invalidateQueries({ queryKey: ['superadmin', 'category-tree'] });
      toast({ title: data.message ?? 'Hero banner added' });
      setFile(null);
      setSubName('');
      setThirdName('');
      setTitle('');
      setDescription('');
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to upload banner';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: 'Choose a banner image', variant: 'destructive' });
      return;
    }
    const sortNum = parseInt(sortOrder, 10);
    const common = {
      placement,
      sortOrder: Number.isFinite(sortNum) ? sortNum : 0,
      ...(title.trim() ? { title: title.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
    };
    if (kind === 'sub') {
      if (!subName) {
        toast({ title: 'Select a sub-category', variant: 'destructive' });
        return;
      }
      mutation.mutate({ image: file, subCategory: subName, ...common });
      return;
    }
    if (!thirdName) {
      toast({ title: 'Select a third sub-category', variant: 'destructive' });
      return;
    }
    mutation.mutate({ image: file, thirdCategory: thirdName, ...common });
  };

  const thirdNamesFromFlat = thirdOptions.map((t) => t.name);
  const hasThirdTargets = thirdSelectItems.length > 0 || thirdNamesFromFlat.length > 0;

  return (
    <DashboardLayout>
      <PageHeader
        title="Home banners"
        description={
          isSuperAdmin
            ? 'Super admin: same CMS banners as vendors — including home Wedding Special, Baby Milestone & Celebrations, Make Your Wedding Extra Special, and Romantic Couple Experience. Link each image to a sub- or third-category by exact name.'
            : 'Upload images for the top hero carousel, home festival strip, /festival hub, /wedding hub, Kids / Occasion, or home sections (Wedding Special, Baby Milestone & Celebrations). Each banner links to one sub- or third-category (exact name).'
        }
      />

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Upload banner</CardTitle>
          </div>
          <CardDescription>
            Attach the hero image and choose whether it applies to a sub-category or a third
            sub-category. The backend resolves categories by exact name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading categories…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="banner-placement">Show on page</Label>
                  <Select value={placement} onValueChange={(v) => setPlacement(v as Placement)}>
                    <SelectTrigger id="banner-placement">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Top hero carousel</SelectItem>
                      <SelectItem value="festival">
                        Make Every Festival Special (home page only)
                      </SelectItem>
                      <SelectItem value="festival_hub">Festival hub (/festival page only)</SelectItem>
                      <SelectItem value="wedding">Wedding hub — main grid (/wedding)</SelectItem>
                      <SelectItem value="wedding_extra">
                        Make Your Wedding Extra Special (home)
                      </SelectItem>
                      <SelectItem value="romantic_couple">
                        Romantic Couple Experience (/wedding)
                      </SelectItem>
                      <SelectItem value="kids">Kids Decorations</SelectItem>
                      <SelectItem value="occasion">Make Every Occasion Extra Special</SelectItem>
                      <SelectItem value="birthday_level_up">
                        Baby Milestone &amp; Celebrations (home)
                      </SelectItem>
                      <SelectItem value="birthday_extra_special">
                        Wedding Special (home)
                      </SelectItem>
                      <SelectItem value="corporate_hero">
                        Corporate events — hero (/corporate-events)
                      </SelectItem>
                      <SelectItem value="corporate_gallery">
                        Corporate events — gallery (/corporate-events)
                      </SelectItem>
                      <SelectItem value="corporate_gifting">
                        Corporate events — gifting carousel (/corporate-events)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {placement === 'festival' && (
                    <p className="text-xs text-muted-foreground">
                      Shown only on the guest <strong>home</strong> page in the &quot;Make Every Festival
                      Special&quot; section — not on <code className="text-xs">/festival</code>.
                    </p>
                  )}
                  {placement === 'festival_hub' && (
                    <p className="text-xs text-muted-foreground">
                      Shown only on the guest <strong>/festival</strong> hub. Upload one banner per occasion (e.g.
                      Rakhi, Christmas) and link each to the matching <strong>third sub-category</strong>.
                    </p>
                  )}
                  {placement === 'wedding' && (
                    <p className="text-xs text-muted-foreground">
                      Shown only on the guest <strong>Wedding</strong> page. Upload one banner per row (e.g. Haldi,
                      Mehandi) and link each to the matching <strong>third sub-category</strong>.
                    </p>
                  )}
                  {placement === 'wedding_extra' && (
                    <p className="text-xs text-muted-foreground">
                      Shown in the &quot;Make Your Wedding Extra Special&quot; block on the guest{' '}
                      <strong>home</strong> page. Use up to four linked banners for Engagement, Mehendi, Haldi,
                      and Wedding. Optional title is the card label.
                    </p>
                  )}
                  {placement === 'romantic_couple' && (
                    <p className="text-xs text-muted-foreground">
                      Shown in the &quot;Romantic Couple Experience&quot; section on <strong>/wedding</strong>. Link
                      each upload to a third sub-category; the layout uses up to four images.
                    </p>
                  )}
                  {placement === 'birthday_level_up' && (
                    <p className="text-xs text-muted-foreground">
                      Shown on the guest <strong>home</strong> page in &quot;Baby Milestone &amp; Celebrations&quot;.
                      Lowest <strong>sort order</strong> = one full-width banner on top; each additional upload
                      appears below as a card (Baby shower, Welcome baby, Name ceremony, Annprashan, Mundan
                      ceremony). Optional title is the card label.
                    </p>
                  )}
                  {placement === 'birthday_extra_special' && (
                    <p className="text-xs text-muted-foreground">
                      Shown on the guest <strong>home</strong> page in the &quot;Wedding Special&quot; horizontal
                      cards (Flower decoration, Special Effects SFX, Catering service, Photography). Optional
                      title is the card label; sort order controls card sequence.
                    </p>
                  )}
                  {placement === 'corporate_hero' && (
                    <p className="text-xs text-muted-foreground">
                      Top hero on <strong>/corporate-events</strong>. Optional title overrides the default heading.
                    </p>
                  )}
                  {placement === 'corporate_gallery' && (
                    <p className="text-xs text-muted-foreground">
                      Images in the &quot;Our Gallery&quot; section on <strong>/corporate-events</strong>.
                    </p>
                  )}
                  {placement === 'corporate_gifting' && (
                    <p className="text-xs text-muted-foreground">
                      Carousel in the corporate gifting block on <strong>/corporate-events</strong>.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-sort">Sort order</Label>
                  <Input
                    id="banner-sort"
                    type="number"
                    min={0}
                    step={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Lower numbers appear first within the same section.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner-title">Optional title (shown on guest home / wedding / festival)</Label>
                <Input
                  id="banner-title"
                  type="text"
                  placeholder="e.g. Engagement ceremony, Diwali Decorations, or Baby shower"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Guest uses this as the card or banner label. Leave blank to keep the linked category name.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner-description">Optional description (Baby Milestone cards)</Label>
                <Input
                  id="banner-description"
                  type="text"
                  placeholder="e.g. Balloon walls and fairy lights for a shower at your location"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Shown as the card body on Baby Milestone &amp; Celebrations. Leave blank to use a matching
                  product description, or a default line for that title.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Link banner to</Label>
                <RadioGroup
                  value={kind}
                  onValueChange={(v) => {
                    setKind(v as TargetKind);
                    setSubName('');
                    setThirdName('');
                  }}
                  className="flex flex-col gap-2 sm:flex-row sm:gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sub" id="hero-kind-sub" />
                    <Label htmlFor="hero-kind-sub" className="font-normal cursor-pointer">
                      Sub-category
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="third" id="hero-kind-third" />
                    <Label htmlFor="hero-kind-third" className="font-normal cursor-pointer">
                      Third sub-category
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {kind === 'sub' ? (
                <div className="space-y-2">
                  <Label htmlFor="hero-sub">Sub-category</Label>
                  <Select value={subName} onValueChange={setSubName}>
                    <SelectTrigger id="hero-sub">
                      <SelectValue placeholder="Select sub-category" />
                    </SelectTrigger>
                    <SelectContent>
                      {subSelectItems.map((row) => (
                        <SelectItem key={row.value} value={row.value}>
                          {row.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="hero-third">Third sub-category</Label>
                  <Select value={thirdName} onValueChange={setThirdName}>
                    <SelectTrigger id="hero-third">
                      <SelectValue placeholder="Select third sub-category" />
                    </SelectTrigger>
                    <SelectContent>
                      {thirdSelectItems.length > 0
                        ? thirdSelectItems.map((row) => (
                            <SelectItem key={row.thirdName} value={row.thirdName}>
                              {row.label}
                            </SelectItem>
                          ))
                        : thirdNamesFromFlat.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  {!hasThirdTargets && (
                    <p className="text-xs text-muted-foreground">
                      Add third sub-categories under Categories first.
                    </p>
                  )}
                </div>
              )}

              <CategoryBannerSingleField
                file={file}
                onChange={setFile}
                id="hero-banner-image"
                label="Banner image"
                description="Required — stored for the hero section. Field name: image."
                emptySubtext="Wide ratio works best. PNG, JPG, or WebP."
              />

              <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
                {mutation.isPending ? 'Uploading…' : 'Upload hero banner'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
