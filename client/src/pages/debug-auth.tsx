import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { config } from '@/lib/config';

export default function DebugAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);

  const token = localStorage.getItem('civicos-jwt');

  useEffect(() => {
    // Collect debug information
    setDebugInfo({
      token: token ? `${token.substring(0, 20)}...` : 'None',
      tokenLength: token?.length || 0,
      apiUrl: config.apiUrl,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      localStorage: {
        hasToken: !!token,
        tokenKey: 'civicos-jwt',
        allKeys: Object.keys(localStorage)
      }
    });
  }, [token]);

  const runTests = async () => {
    setIsTesting(true);
    const results: any = {};

    try {
      // Test 1: Check if backend is reachable
      try {
        const envCheck = await fetch(`${config.apiUrl}/api/auth/env-check`);
        results.backendReachable = {
          status: envCheck.ok,
          statusText: envCheck.statusText,
          data: await envCheck.json()
        };
      } catch (error) {
        results.backendReachable = {
          status: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }

      // Test 2: Test JWT secret
      try {
        const jwtCheck = await fetch(`${config.apiUrl}/api/auth/debug-jwt`);
        results.jwtSecret = {
          status: jwtCheck.ok,
          statusText: jwtCheck.statusText,
          data: await jwtCheck.json()
        };
      } catch (error) {
        results.jwtSecret = {
          status: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }

      // Test 3: Test token validation (if token exists)
      if (token) {
        try {
          const userResponse = await apiRequest('/api/auth/user', 'GET');
          results.tokenValidation = {
            status: true,
            data: userResponse
          };
        } catch (error) {
          results.tokenValidation = {
            status: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      } else {
        results.tokenValidation = {
          status: false,
          error: 'No token to test'
        };
      }

      // Test 4: Test login endpoint
      try {
        const loginTest = await fetch(`${config.apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' })
        });
        results.loginEndpoint = {
          status: loginTest.ok,
          statusCode: loginTest.status,
          statusText: loginTest.statusText
        };
      } catch (error) {
        results.loginEndpoint = {
          status: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }

    } catch (error) {
      results.generalError = error instanceof Error ? error.message : String(error);
    }

    setTestResults(results);
    setIsTesting(false);
  };

  const clearToken = () => {
    localStorage.removeItem('civicos-jwt');
    window.location.reload();
  };

  const goToAuth = () => {
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Authentication Debug Panel
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Authentication State</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
                  <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
                  <div><strong>Token exists:</strong> {token ? 'Yes' : 'No'}</div>
                  <div><strong>User:</strong> {user ? `${user.firstName} ${user.lastName}` : 'None'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>API URL:</strong> {config.apiUrl}</div>
                  <div><strong>Environment:</strong> {config.environment}</div>
                  <div><strong>Token Length:</strong> {token?.length || 0}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={runTests} disabled={isTesting}>
                {isTesting ? 'Running Tests...' : 'Run Diagnostic Tests'}
              </Button>
              <Button onClick={clearToken} variant="outline">
                Clear Token
              </Button>
              <Button onClick={goToAuth} variant="outline">
                Go to Auth
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {Object.keys(testResults).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(testResults).map(([testName, result]: [string, any]) => (
                  <div key={testName} className="border rounded p-3">
                    <h4 className="font-semibold mb-2 capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h4>
                    <div className="text-sm">
                      <div><strong>Status:</strong> {result.status ? '✅ Pass' : '❌ Fail'}</div>
                      {result.error && <div><strong>Error:</strong> {result.error}</div>}
                      {result.statusCode && <div><strong>Status Code:</strong> {result.statusCode}</div>}
                      {result.data && (
                        <div>
                          <strong>Data:</strong>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {window.authDebug ? (
                <div className="space-y-2">
                  {window.authDebug.map((log: any, i: number) => (
                    <div key={i} className="text-xs border-b pb-1">
                      <div className="text-gray-500">{log.timestamp}</div>
                      <div className="text-blue-600">{log.message}</div>
                      {log.data && (
                        <pre className="text-xs bg-gray-100 p-1 rounded mt-1">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No debug logs available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 