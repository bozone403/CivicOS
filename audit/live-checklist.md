## LIVE Verification Checklist (Phase S)

Base: https://civicos.onrender.com

| Check | Endpoint(s) | Result | Evidence |
|---|---|---|---|
| Profile media upload | POST /api/auth/upload-profile-picture (type=profile|banner) | Pending | network-log refs |
| Legacy upload | POST /api/users/:id/upload-image | Pending | network-log refs |
| Notifications unread/read-all | GET/POST /api/notifications, /api/notifications/read-all | Pending | network-log refs |
| Messaging UUID and user_ UUID | /api/messages send/receive, counts | Pending | network-log refs |
| CSP/assets | Static image loads, lazy chunks MIME | Pending | console/network |
| Elections/voting | /api/voting/bills, compat vote route | Pending | network-log refs |
| Transparency/news freshness | /api/news, /api/lobbyists, /api/procurement | Pending | network-log refs |
| Upload 15MB | /api/upload | Pending | network-log refs |
| Rate limits | Various POST auth/login burst | Pending | network-log refs |


