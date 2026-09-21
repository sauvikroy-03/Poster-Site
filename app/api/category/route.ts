import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


export async function GET(){
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Or NEXT_PUBLIC_SUPABASE_ANON_KEY
);
try{

    const {data,error}=await supabase.from('categories').select("id,category_name").order("category_name", { ascending: true });

    if(error){
        return(NextResponse.json({error:error},{status:400}))
    }
    return(NextResponse.json(data,{status:200}))

}catch(err){
return(NextResponse.json({ error: "Failed to fetch categories" },{status:500}))
}


}