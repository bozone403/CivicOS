import React from "react";
import { Button } from "@/components/ui/button";

export default function PlatformNotice({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-2 text-red-700">Platform Notice: Live Upgrades & Civic Expansion Underway</h2>
        <p className="mb-3 text-gray-700 text-sm">
          CivicOS is in the midst of a major live upgrade to expand our infrastructure and enhance platform stability. Some features may be temporarily limited—thank you for your patience as we build a stronger, more transparent democracy.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
          <p className="text-xs text-blue-800 font-medium">
            We are raising essential startup funding to cover critical operational costs:
            <ul className="list-disc ml-5 mt-1">
              <li>Full-time server hosting</li>
              <li>Government API access</li>
              <li>Advanced AI-powered civic auditing</li>
            </ul>
            These systems are vital for real-time tracking of political activity, legislation, and public accountability across Canada.
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-2">
          <p className="text-xs text-yellow-800 font-bold">
            Funding Goal: $25,000 CAD<br/>
            Every dollar you contribute goes directly to platform operations—no salaries, no overhead, 100% to transparency and civic technology.
          </p>
        </div>
        <p className="text-xs text-gray-700 mb-2">
          If you value independent, nonpartisan civic oversight, please consider supporting our mission. Your contribution helps us scale, innovate, and keep Canadian democracy open and accountable.
        </p>
        <Button
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
          onClick={() => window.open('https://civicos.ca/donate', '_blank')}
        >
          Learn More / Donate
        </Button>
      </div>
    </div>
  );
} 