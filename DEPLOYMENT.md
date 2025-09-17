# Deployment Guide - Auracare Beauty Parlor Management System

This guide covers deploying the Auracare MERN stack application to various platforms.

## 🚀 Production Deployment

### Prerequisites
- MongoDB Atlas account (or hosted MongoDB)
- Domain name (optional)
- SSL certificate (for HTTPS)
- Gmail account with App Password
- Google Cloud Console project (for OAuth)

## 🗄️ Database Deployment (MongoDB Atlas)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster
   - Choose your preferred region

2. **Configure Database**
   - Create a database user
   - Whitelist IP addresses (0.0.0.0/0 for all)
   - Get connection string

3. **Update Environment Variables**
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auracare?retryWrites=true&w=majority
   ```

## 🖥️ Backend Deployment

### Option 1: Railway
1. **Setup Railway Account**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub account

2. **Deploy Backend**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and deploy
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables**
   - Add all variables from `.env`
   - Set `NODE_ENV=production`

### Option 2: Heroku
1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Deploy to Heroku**
   ```bash
   # Create Heroku app
   heroku create auracare-api

   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your_mongodb_connection_string
   # ... add all other environment variables

   # Deploy
   git subtree push --prefix backend heroku main
   ```

### Option 3: DigitalOcean App Platform
1. **Create DigitalOcean Account**
2. **Create New App**
   - Connect GitHub repository
   - Select backend folder
   - Configure environment variables
   - Deploy

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)
1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy Frontend**
   ```bash
   cd frontend
   vercel
   ```

3. **Configure Environment Variables**
   - Add `VITE_API_URL` pointing to your backend
   - Add Google OAuth client ID

### Option 2: Netlify
1. **Build the Project**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**
   - Drag and drop `dist` folder to Netlify
   - Or connect GitHub for automatic deploys

3. **Configure Settings**
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables

### Option 3: AWS S3 + CloudFront
1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Upload to S3**
   - Create S3 bucket
   - Enable static website hosting
   - Upload `dist` folder contents

3. **Setup CloudFront**
   - Create CloudFront distribution
   - Point to S3 bucket
   - Configure SSL certificate

## 🐳 Docker Deployment

### Using Docker Compose
1. **Build and Run**
   ```bash
   docker-compose up -d
   ```

2. **Environment Variables**
   - Create `.env` files for each service
   - Update MongoDB connection strings

### Individual Docker Containers

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## ☁️ Cloud Platform Specific Configurations

### AWS EC2
1. **Launch EC2 Instance**
   - Choose Ubuntu 20.04 LTS
   - Configure security groups (ports 80, 443, 3000, 5000)

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   sudo npm install -g pm2

   # Install Nginx
   sudo apt install nginx -y
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone <your-repo-url>

   # Setup backend
   cd auracare/backend
   npm install
   pm2 start server.js --name "auracare-api"

   # Setup frontend
   cd ../frontend
   npm install
   npm run build

   # Configure Nginx
   sudo cp dist/* /var/www/html/
   ```

### Google Cloud Platform
1. **Create GCP Project**
2. **Enable APIs**
   - App Engine API
   - Cloud Build API

3. **Deploy with App Engine**
   ```yaml
   # app.yaml (backend)
   runtime: nodejs18
   service: api
   env_variables:
     NODE_ENV: production
     MONGODB_URI: your_connection_string
   ```

## 🔒 Production Security Checklist

### Environment Variables
- [ ] All sensitive data in environment variables
- [ ] Different keys for production
- [ ] HTTPS enabled
- [ ] CORS properly configured

### Database Security
- [ ] Database user with minimal permissions
- [ ] IP whitelist configured
- [ ] Connection string secured
- [ ] Regular backups enabled

### API Security
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Proper error handling
- [ ] Security headers configured

### Frontend Security
- [ ] No sensitive data in client code
- [ ] API keys properly configured
- [ ] HTTPS enforced
- [ ] Content Security Policy headers

## 📧 Email Configuration for Production

### Gmail Setup
1. **Enable 2-Factor Authentication**
2. **Generate App Password**
   - Go to Google Account settings
   - Security → App passwords
   - Generate password for "Mail"

3. **Update Environment Variables**
   ```bash
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

### Alternative Email Services
- **SendGrid**: Professional email service
- **Mailgun**: Transactional email API
- **Amazon SES**: AWS email service

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test

      - name: Build frontend
        run: cd frontend && npm run build

      - name: Deploy to production
        # Add your deployment commands here
```

## 📊 Monitoring and Analytics

### Application Monitoring
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and logging
- **New Relic**: Application performance monitoring

### Server Monitoring
- **PM2 Monitoring**: Process monitoring
- **Uptime Robot**: Website uptime monitoring
- **Google Analytics**: User behavior tracking

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update CORS configuration in backend
   - Add frontend domain to allowed origins

2. **Environment Variables Not Loading**
   - Verify variable names match exactly
   - Check for syntax errors in .env files

3. **Database Connection Issues**
   - Verify connection string format
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has proper permissions

4. **Google OAuth Not Working**
   - Update redirect URIs in Google Console
   - Verify client ID and secret
   - Check HTTPS requirements

### Performance Optimization

1. **Backend Optimizations**
   - Enable gzip compression
   - Implement caching strategies
   - Optimize database queries
   - Use connection pooling

2. **Frontend Optimizations**
   - Enable lazy loading
   - Optimize images and assets
   - Use CDN for static files
   - Implement service workers

## 📞 Support

If you encounter issues during deployment:
- Check application logs
- Verify environment variables
- Test API endpoints
- Monitor database connections

For additional support, refer to the main README.md file or create an issue in the repository.

---

**Happy Deploying! 🚀**