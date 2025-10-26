import PageEditor from '@/components/admin/PageEditor';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

interface Props {
  params: { id: string };
}

export default async function AdminEditPage({ params }: Props) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', params.id)
    .single();

  return (
    <div className="space-y-6">
      <PageEditor mode="edit" initialPage={page || undefined} pageId={params.id} />
    </div>
  );
}


