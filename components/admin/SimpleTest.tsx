'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SimpleTest() {
  const [result, setResult] = useState<string>('Click to test');

  const testQuery = async () => {
    try {
      setResult('Testing...');
      
      // Test the exact query that might be causing issues
      const { data, error } = await supabase
        .from('promotional_media')
        .select('*')
        .limit(1);

      if (error) {
        setResult(`Error: ${error.message}`);
        return;
      }

      setResult(`Success! Found ${data?.length || 0} records`);
      
    } catch (error: any) {
      setResult(`Exception: ${error.message}`);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Simple Query Test</h2>
      <button 
        onClick={testQuery}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Query
      </button>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <pre>{result}</pre>
      </div>
    </div>
  );
}



