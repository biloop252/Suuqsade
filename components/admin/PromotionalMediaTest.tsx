'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function PromotionalMediaTest() {
  const [testResult, setTestResult] = useState<string>('Testing...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    try {
      setIsLoading(true);
      
      // Test 1: Check if table exists
      const { data, error } = await supabase
        .from('promotional_media')
        .select('id, title, media_type')
        .limit(1);

      if (error) {
        setTestResult(`❌ Error: ${error.message}`);
        return;
      }

      // Test 2: Try to insert a test record
      const testData = {
        title: 'Test Banner',
        media_type: 'banner',
        banner_position: 'homepage_top',
        display_order: 999,
        is_active: true,
        language_code: 'en'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('promotional_media')
        .insert(testData)
        .select()
        .single();

      if (insertError) {
        setTestResult(`❌ Insert Error: ${insertError.message}`);
        return;
      }

      // Test 3: Try to update the record
      const { error: updateError } = await supabase
        .from('promotional_media')
        .update({ title: 'Updated Test Banner' })
        .eq('id', insertData.id);

      if (updateError) {
        setTestResult(`❌ Update Error: ${updateError.message}`);
        return;
      }

      // Test 4: Clean up - delete the test record
      const { error: deleteError } = await supabase
        .from('promotional_media')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        setTestResult(`❌ Delete Error: ${deleteError.message}`);
        return;
      }

      setTestResult('✅ All tests passed! Database is working correctly.');
      
    } catch (error: any) {
      setTestResult(`❌ Unexpected Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Promotional Media Database Test</h2>
      
      <div className="mb-4">
        <div className="flex items-center">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          )}
          <span className="text-sm">{testResult}</span>
        </div>
      </div>

      <button
        onClick={testDatabaseConnection}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Run Test Again'}
      </button>

      <div className="mt-4 text-xs text-gray-600">
        <p>This test will:</p>
        <ul className="list-disc list-inside mt-1">
          <li>Check if promotional_media table exists</li>
          <li>Test insert operation</li>
          <li>Test update operation</li>
          <li>Test delete operation</li>
          <li>Clean up test data</li>
        </ul>
      </div>
    </div>
  );
}



