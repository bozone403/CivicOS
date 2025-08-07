# CivicOS Production AI Configuration

## 🎯 Overview
CivicOS uses **Ollama with Mixtral** for free, local AI processing on the Render backend. Local development uses fallback responses to avoid resource usage.

## 🚀 Render Backend Configuration

### Environment Variables (Render)
```bash
NODE_ENV=production
RENDER=true
OLLAMA_MODEL=mistral:latest
OLLAMA_URL=http://localhost:11434
DATABASE_URL=your_supabase_url
```

### Deployment Process
1. **Build Application**: `npm run build:full`
2. **Deploy to Render**: `npm run deploy:render`
3. **Start Command**: `./start.sh`

### Render Start Script
The `start.sh` script:
- Sets production environment
- Starts Ollama service
- Waits for Ollama to be ready
- Starts the main application

## 🏠 Local Development

### Local Environment
- **AI Service**: Disabled (uses fallback responses)
- **Resource Usage**: Minimal (no Ollama)
- **Development**: Fast and lightweight

### Local Commands
```bash
# Start local development (no Ollama)
npm run dev:local

# Test configuration
node test-ollama-config.js
```

## 🤖 AI Service Endpoints

### Available Endpoints (Render Only)
- `POST /api/ai/chat` - General chat
- `POST /api/ai/analyze-news` - News analysis
- `POST /api/ai/analyze-policy` - Policy analysis
- `POST /api/ai/civic-insights` - Civic intelligence
- `GET /api/ai/health` - Service health check

### Request Format
```json
{
  "prompt": "Your question or request",
  "context": "Optional context"
}
```

### Response Format
```json
{
  "response": "AI-generated response",
  "model": "mistral:latest",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🔧 Configuration Details

### AI Service Logic
```typescript
// Only runs on Render backend
const isRender = process.env.RENDER || process.env.NODE_ENV === 'production';
const isLocal = process.env.NODE_ENV === 'development' && !process.env.RENDER;

if (isLocal) {
  return generateEnhancedLocalResponse(prompt);
}
```

### Fallback Responses (Local)
- Canadian politics and politicians
- Policy analysis guidance
- News verification tips
- Voting information
- Rights and legal advice
- Corruption reporting guidance

## 📊 Performance

### Render Backend
- **Model**: Mixtral (4.4GB)
- **Memory**: ~8GB RAM recommended
- **Response Time**: 2-5 seconds
- **Cost**: $0 (free)

### Local Development
- **Model**: None (fallback responses)
- **Memory**: Minimal
- **Response Time**: Instant
- **Cost**: $0

## 🛠️ Troubleshooting

### Common Issues

1. **Ollama not starting on Render**
   - Check Render logs
   - Verify Ollama installation
   - Ensure sufficient memory allocation

2. **Local development using Ollama**
   - Check environment variables
   - Ensure `NODE_ENV=development`
   - Verify `RENDER` is not set

3. **Model not found**
   - Run: `ollama pull mistral:latest`
   - Check available models: `ollama list`

### Health Check
```bash
# Test Ollama service
curl http://localhost:11434/api/tags

# Test AI endpoint
curl -X POST http://localhost:3000/api/ai/health
```

## 🎯 Benefits

### Free AI Processing
- ✅ Zero API costs
- ✅ No rate limits
- ✅ Complete privacy
- ✅ Full control

### Enhanced Capabilities
- ✅ Canadian civic intelligence
- ✅ News bias analysis
- ✅ Policy analysis
- ✅ Politician insights
- ✅ Legal system guidance

### Resource Optimization
- ✅ Local development: No resource usage
- ✅ Render backend: Optimized for production
- ✅ Automatic fallback responses
- ✅ Environment-aware configuration

## 📋 Deployment Checklist

- [ ] Mixtral model downloaded (`ollama pull mistral:latest`)
- [ ] Render environment variables configured
- [ ] Database connection verified
- [ ] Build process completed
- [ ] Start script created
- [ ] Health checks passing
- [ ] Local development tested
- [ ] Production deployment verified

## 🔄 Updates

### Model Updates
```bash
# Update Mixtral model
ollama pull mistral:latest

# Restart Render service
# (Automatic on next deployment)
```

### Configuration Updates
- Update `server/utils/aiService.ts` for AI logic changes
- Update `deploy-render.sh` for deployment changes
- Update environment variables in Render dashboard

---

**Status**: ✅ Production Ready
**Last Updated**: January 2025
**Version**: 2.0 (Mixtral Integration) 