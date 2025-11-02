# 🔧 Troubleshooting Guide

Common issues and solutions for AGL Monolith service.

---

## ❌ "FOREIGN KEY constraint failed" Error

### Problem

When creating a game, you see:
```
SqliteError: FOREIGN KEY constraint failed
```

### Cause

The `games` table requires a valid `client_id`, but no clients exist in the database.

### Solution

**Option 1: Reset Database (Recommended)**

```powershell
# Stop the service (Ctrl+C in the terminal running it)

# Reset database
.\scripts\reset-db.ps1

# Restart service
npm run dev:monolith

# Run tests
.\scripts\test-monolith.ps1
```

**Option 2: Manual Fix**

```bash
# Stop the service (Ctrl+C)

# Delete database files
rm services/monolith/agl.db*

# Restart service (will recreate database with default client)
npm run dev:monolith
```

---

## ❌ Port Already in Use

### Problem

```
Error: listen EADDRINUSE: address already in use :::3000
```

### Solution

**Windows:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

**Or change port:**
```bash
# services/monolith/.env
PORT=3001
```

---

## ❌ Database Locked

### Problem

```
SqliteError: database is locked
```

### Solution

```powershell
# Stop all running monolith processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# Remove WAL files
rm services/monolith/agl.db-shm
rm services/monolith/agl.db-wal

# Restart service
npm run dev:monolith
```

---

## ❌ Module Not Found

### Problem

```
Error: Cannot find module '@anthropic-ai/sdk'
```

### Solution

```bash
cd services/monolith
npm install
cd ../..
npm run dev:monolith
```

---

## ❌ TypeScript Compilation Error

### Problem

```
TSError: Unable to compile TypeScript
```

### Solution

```bash
cd services/monolith

# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build

# Run development mode
npm run dev
```

---

## ❌ Empty Response from API

### Problem

API returns empty `{}` or no data

### Solution

1. **Check service logs** - Look for errors in terminal
2. **Verify endpoint** - Make sure URL is correct
3. **Check request body** - Ensure JSON is valid

```bash
# Test with verbose output
curl -v -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{"eventType":"player.victory","data":{}}'
```

---

## ❌ High Memory Usage

### Problem

Service consuming too much memory (>1GB)

### Solution

```bash
# Restart service regularly
# Or increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm run dev:monolith
```

---

## ❌ WebSocket Connection Failed

### Problem

```
WebSocket connection to 'ws://localhost:3000' failed
```

### Solution

1. **Check CORS settings** - Make sure your origin is allowed
2. **Verify WebSocket URL** - Should be `ws://` not `http://`
3. **Check firewall** - Ensure port 3000 is open

```javascript
// Correct WebSocket connection
const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});
```

---

## ❌ Tests Fail with 400/500 Errors

### Problem

```
✗ Failed to create game: (500) 内部服务器错误
```

### Solution

1. **Check service logs** for detailed error
2. **Reset database** if it's corrupted
3. **Verify request format** matches API expectations

```powershell
# Full reset
.\scripts\reset-db.ps1
npm run dev:monolith
.\scripts\test-monolith.ps1
```

---

## ❌ "Cannot read property of undefined"

### Problem

```
TypeError: Cannot read property 'emotion' of undefined
```

### Solution

**Check response structure:**

```javascript
// Always check if response exists
const response = await fetch('/api/emotion/analyze', {...});
const data = await response.json();

if (data && data.emotion) {
  console.log(data.emotion);
} else {
  console.error('Invalid response:', data);
}
```

---

## 🔍 Debug Mode

### Enable Detailed Logging

**Method 1: Environment Variable**
```bash
# services/monolith/.env
LOG_LEVEL=debug
```

**Method 2: Command Line**
```bash
LOG_LEVEL=debug npm run dev:monolith
```

### Check Database Directly

```bash
# Open database with SQLite CLI
sqlite3 services/monolith/agl.db

# List tables
.tables

# Show all clients
SELECT * FROM clients;

# Show all games
SELECT * FROM games;

# Show table schema
.schema games
```

---

## 📊 Performance Issues

### Slow API Responses

**Check database indexes:**
```sql
-- In sqlite3
.indexes games
.indexes players
.indexes memories
```

**Monitor queries:**
```javascript
// In db.ts, add logging
db.prepare('...').run(); // Add console.time/timeEnd
```

### High CPU Usage

**Common causes:**
- Too many concurrent requests
- Large memory objects
- Infinite loops in code

**Solutions:**
- Add rate limiting
- Optimize database queries
- Use caching effectively

---

## 🆘 Still Having Issues?

### Collect Debug Information

```bash
# 1. Service version
node --version
npm --version

# 2. Database info
ls -la services/monolith/agl.db*

# 3. Service logs
npm run dev:monolith 2>&1 | tee service.log

# 4. Test results
.\scripts\test-monolith.ps1 > test-results.txt
```

### Full Reset

```powershell
# Nuclear option - reset everything
rm -rf services/monolith/node_modules
rm -rf services/monolith/agl.db*
rm -rf services/monolith/dist

cd services/monolith
npm install
cd ../..

npm run dev:monolith
```

---

## 📚 Related Docs

- [Quick Start](./QUICKSTART.md)
- [Testing Guide](./TESTING-QUICKSTART.md)
- [Monolith Mode](./QUICKSTART-MONOLITH.md)
- [API Documentation](./docs/api/README.md)

---

## 💬 Get Help

- Check service logs in terminal
- Review error messages carefully
- Search for error in GitHub Issues
- Ask in GitHub Discussions

---

**Remember**: Most issues are fixed by a simple service restart or database reset! 🔄
