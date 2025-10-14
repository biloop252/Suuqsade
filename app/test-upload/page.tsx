'use client';

import { useState } from 'react';

export default function ImageUploadTest() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [apiTest, setApiTest] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const testApiRoute = async () => {
    try {
      const response = await fetch('/api/test-simple');
      const data = await response.json();
      setApiTest(data);
      console.log('API test result:', data);
    } catch (error) {
      console.error('API test error:', error);
      setApiTest({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('image_type', 'logo');
      formData.append('alt_text', 'Test logo');
      formData.append('is_active', 'true');

      console.log('Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const response = await fetch('/api/admin/settings/images', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const text = await response.text();
      console.log('Raw response:', text);

      try {
        const data = JSON.parse(text);
        setResult(data);
        console.log('Parsed response:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setResult({ 
          error: 'Failed to parse JSON response',
          rawResponse: text,
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">API and Image Upload Test</h1>
      
      <div className="space-y-6">
        {/* API Test Section */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">API Route Test</h2>
          <button
            onClick={testApiRoute}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Test API Route
          </button>
          {apiTest && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">API Test Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(apiTest, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Image Upload Test</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image File
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            </div>

            {file && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Selected File:</h3>
                <p><strong>Name:</strong> {file.name}</p>
                <p><strong>Size:</strong> {Math.round(file.size / 1024)}KB</p>
                <p><strong>Type:</strong> {file.type}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>

            {result && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Upload Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}