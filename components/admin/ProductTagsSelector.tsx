'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ProductTag } from '@/types/database';

interface ProductTagsSelectorProps {
  initialSelectedIds?: string[];
  onChange: (selectedIds: string[]) => void;
}

export default function ProductTagsSelector({ initialSelectedIds = [], onChange }: ProductTagsSelectorProps) {
  const [allTags, setAllTags] = useState<ProductTag[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    setSelectedIds(initialSelectedIds);
  }, [initialSelectedIds.join(',')]);

  useEffect(() => {
    onChange(selectedIds);
  }, [selectedIds.join(',')]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_tags')
        .select('*')
        .order('name', { ascending: true });
      if (error) {
        console.error('Error fetching product tags:', error);
      } else {
        setAllTags(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return allTags;
    const q = search.toLowerCase();
    return allTags.filter(t => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
  }, [search, allTags]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const createTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const { data, error } = await supabase
        .from('product_tags')
        .insert([{ name, slug }])
        .select()
        .single();
      if (error) {
        console.error('Error creating tag:', error);
      } else if (data) {
        setAllTags(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedIds(prev => [...prev, data.id]);
        setNewTagName('');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tags..."
          className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {loading ? (
          <span className="text-xs text-gray-500">Loading tags...</span>
        ) : filtered.length === 0 ? (
          <span className="text-xs text-gray-500">No tags found</span>
        ) : (
          filtered.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleSelect(tag.id)}
              className={`px-2.5 py-1 text-xs rounded-full border ${
                selectedIds.includes(tag.id)
                  ? 'bg-primary-50 text-primary-700 border-primary-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
              title={tag.description || ''}
            >
              #{tag.name}
            </button>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Create new tag"
          className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
        />
        <button
          type="button"
          onClick={createTag}
          disabled={creating}
          className="px-3 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          {creating ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  );
}



