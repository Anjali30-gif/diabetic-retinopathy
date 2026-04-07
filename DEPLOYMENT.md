# 🚀 Deployment Guide

This document provides instructions to deploy the Diabetic Retinopathy Detection web application.

## Deployment Architecture

- **Frontend**: React/Vite application
- **Backend**: Flask API Server with SocketIO
- **Database**: MongoDB (optional, falls back to in-memory mock)

## Frontend Deployment (Vercel)

### Prerequisites
- GitHub account
- Vercel account (free at https://vercel.com)

### Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin master
   ```

2. **Deploy via Vercel**
   - Visit https://vercel.com/dashboard
   - Click "New Project"
   - Select your GitHub repository
   - Configure build settings:
     - **Framework**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Click "Deploy"

3. **Environment Variables** (Optional)
   - VITE_API_URL: Your backend API URL (e.g., `https://your-backend.herokuapp.com/api`)

## Backend Deployment Options

### Option 1: Render (Free-friendly and easy)

Render is a good choice because it supports Python web services, runs from GitHub, and has a free tier.

**Steps:**
1. Sign up at https://render.com
2. Create a new Web Service
3. Connect to your GitHub repository
4. Set the branch to `master` or `main`
5. Configure these values:
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 1 -k eventlet -b 0.0.0.0:$PORT app.main:app`
6. Add environment variables:
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET_KEY=your_secret_key
   ```
7. Deploy and wait for the service to become live

### Option 2: Railway

**Steps:**
1. Sign up at https://railway.app
2. Create new project → Import from GitHub
3. Select your diabetic-retinopathy repository
4. Set environment variables:
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET_KEY=your_secret_key
   ```
5. Railway automatically detects the Procfile and deploys

### Option 3: Heroku

**Prerequisites:**
- Heroku CLI installed
- Heroku account

**Steps:**
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_connection_string
heroku config:set JWT_SECRET_KEY=your_secret_key

# Deploy
git push heroku master

# View logs
heroku logs --tail
```

### Option 4: PythonAnywhere

1. Sign up at https://www.pythonanywhere.com
2. Create new web app (choose Python 3.11)
3. Clone repository into `/home/username/mysite`
4. Configure WSGI file to use `app.main:app`
5. Set environment variables in Web app settings

## Environment Configuration

Create a `.env` file with:

```
MONGODB_URI=mongodb://username:password@host:port/dbname
JWT_SECRET_KEY=your_secret_key_here
FLASK_ENV=production
```

For frontend builds, use `frontend/.env.example` as a template and set:

```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_DEMO_MODE=false
```

## Backend Production Notes

The backend is now configured for cloud deployment:
- `requirements.txt` uses `tensorflow-cpu==2.15.0` instead of Windows-only `tensorflow-directml`
- `eventlet` is installed so `gunicorn` can run Flask-SocketIO correctly
- `Procfile` uses:
  ```bash
  web: gunicorn -w 1 -k eventlet -b 0.0.0.0:$PORT app.main:app
  ```

If you deploy to Render or another host, the app should start cleanly with these settings.

## Testing Deployment

After deployment, test the endpoints:

```bash
# Test backend
curl https://your-backend-url/api/health

# Test frontend
# Visit https://your-frontend-url
```

## Monitoring & Logs

- **Railway**: Dashboard → Logs tab
- **Heroku**: `heroku logs --tail`
- **Vercel**: Dashboard → Deployment → Logs
- **Local**: Check application console output

## Scaling Considerations

- Use CDN for frontend (Vercel includes this)
- Implement caching for predictions
- Consider GPU nodes for backend if available
- Set up database indexes for MongoDB

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend URL is in frontend environment
2. **Model Loading**: App falls back to mock mode automatically
3. **MongoDB Connection**: Check connection string format
4. **Socket Connection**: Ensure backend domain is added to allowed origins

### Debug Mode

Set `FLASK_ENV=development` for detailed error messages (development only)

## Next Steps

1. Deploy frontend to Vercel
2. Deploy backend to Railway or Heroku
3. Update frontend environment variables with backend URL
4. Test full application flow
5. Set up custom domain (optional)

## Support

For issues or questions, check the main README.md or GitHub issues.
