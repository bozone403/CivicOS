import React from 'react';
import { ShieldAlert } from 'lucide-react';

export function PermissionHint({ required }: { required: string | string[] }) {
  const perms = Array.isArray(required) ? required : [required];
  return (
    <div className="flex items-start gap-2 p-3 rounded border bg-amber-50 text-amber-900">
      <ShieldAlert className="w-4 h-4 mt-0.5" />
      <div className="text-sm">
        This action requires the following permission(s):
        <ul className="list-disc ml-5 mt-1">
          {perms.map((p) => (
            <li key={p}><code>{p}</code></li>
          ))}
        </ul>
      </div>
    </div>
  );
}


