import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TestRow {
  id: number;
  name: string;
  created_at: string;
}

export const SupabaseTest: React.FC = () => {
  const [rows, setRows] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRows = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('test_table').select('*');
      if (error) {
        setError(error.message);
      } else {
        setRows(data || []);
      }
      setLoading(false);
    };
    fetchRows();
  }, []);

  return (
    <div style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8, margin: 16 }}>
      <h3>Supabase Connectivity Test</h3>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && (
        <ul>
          {rows.length === 0 && <li>No data found.</li>}
          {rows.map(row => (
            <li key={row.id}>{row.name} (created: {row.created_at})</li>
          ))}
        </ul>
      )}
    </div>
  );
}; 