 export default interface ProjectDataInterface{
    prod_id:string,
    prod_name:string,
    prod_slug:string,
    prod_category:string,
    prod_description:string,
    prod_images:string[],
    prod_preview_image?:string | null,
    created_at?:string | null,
    is_trending:boolean,
    hero_visible:boolean,
    hero_order?:number | null,
    product_variants: {
      variant_id:string,
      prod_size:string,
      prod_material:string,
      prod_price:string,
      compare_at_price:string,
      sku:string,
      is_in_stock:string
    }[]
}