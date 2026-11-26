export interface CategoryInterface {
  id: string;
  category_name: string;
  slug: string;
  category_thumbnail?: string | null;
  is_promoted?: boolean | null;
}
