# Client Docker Setup

This directory contains Docker configuration for the React client application.

## Files Overview

- `Dockerfile` - Production build with Nginx
- `Dockerfile.dev` - Development build with hot reloading
- `nginx.conf` - Nginx configuration for production
- `.dockerignore` - Files to exclude from Docker build

## Production Build

The production Dockerfile uses a multi-stage build:

1. **Builder Stage**: Uses Node.js to build the React application
2. **Production Stage**: Uses Nginx to serve the built static files

### Features:
- Multi-stage build for smaller final image
- Nginx for serving static files
- Security headers
- Gzip compression
- Static asset caching
- API proxy to backend services
- SPA routing support

### Build and Run:

```bash
# Build the production image
docker build -t online-judge-client .

# Run the container
docker run -p 3000:80 online-judge-client
```

## Development Build

The development Dockerfile provides hot reloading:

### Features:
- Hot reloading with Vite
- Volume mounting for live code changes
- Development dependencies included

### Build and Run:

```bash
# Build the development image
docker build -f Dockerfile.dev -t online-judge-client-dev .

# Run the development container
docker run -p 5173:5173 -v $(pwd):/app online-judge-client-dev
```

## Docker Compose Integration

### Production:
```bash
# Start all services (production)
docker-compose up -d
```

### Development:
```bash
# Start all services (development)
docker-compose -f docker-compose.dev.yml up -d
```

## Environment Variables

The client application uses these environment variables:

- `VITE_API_BASE` - Backend API base URL (default: http://localhost:5000/api/v1)
- `NODE_ENV` - Environment mode (development/production)

## Nginx Configuration

The `nginx.conf` file includes:

- **API Proxy**: Routes `/api/*` requests to the backend server
- **Compiler Proxy**: Routes `/compile/*` requests to the compiler service
- **SPA Routing**: Handles React Router routes
- **Static Caching**: Optimized caching for static assets
- **Security Headers**: Basic security headers
- **Gzip Compression**: Reduces file sizes

## Ports

- **Production**: Port 80 (mapped to host port 3000)
- **Development**: Port 5173 (Vite default)

## Troubleshooting

### Common Issues:

1. **Build fails**: Check if all dependencies are in package.json
2. **API calls fail**: Verify the API proxy configuration in nginx.conf
3. **Hot reload not working**: Ensure volumes are properly mounted in development
4. **Static assets not loading**: Check nginx configuration and file permissions

### Useful Commands:

```bash
# View client logs
docker-compose logs client

# Rebuild client only
docker-compose build client

# Access client container
docker-compose exec client sh

# Check nginx configuration
docker-compose exec client nginx -t
```

## Performance Optimization

The production build includes several optimizations:

- **Multi-stage build**: Reduces final image size
- **Static asset caching**: 1-year cache for static files
- **Gzip compression**: Reduces transfer sizes
- **Nginx serving**: Fast static file serving
- **Security headers**: Basic security protection

## Security Considerations

- Non-root user in production container
- Security headers in nginx configuration
- No sensitive data in client build
- API proxy for backend communication 