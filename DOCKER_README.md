# Docker Deployment Guide

This guide explains how to deploy the Wallet Access application using Docker.

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Contract Addresses
USDT_CONTRACT_ADDRESS=0x55d398326f99059fF775485246999027B3197955
PROGRAM_CONTRACT_ADDRESS=0x8B9c85D168d82D6266d71b6f31bb48e3bE1caDf4

# Server Configuration
PORT=3000
NODE_ENV=production
SECRET_KEY=your-secret-key-here
```

## Docker Deployment Options

### Option 1: Using Docker Compose (Recommended)

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Run in detached mode:**
   ```bash
   docker-compose up -d --build
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker directly

1. **Build the Docker image:**
   ```bash
   docker build -t wallet-access .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 \
     -e USDT_CONTRACT_ADDRESS=0x55d398326f99059fF775485246999027B3197955 \
     -e PROGRAM_CONTRACT_ADDRESS=0x8B9c85D168d82D6266d71b6f31bb48e3bE1caDf4 \
     -e PORT=3000 \
     -e NODE_ENV=production \
     --name wallet-access-container \
     wallet-access
   ```

3. **Run in detached mode:**
   ```bash
   docker run -d -p 3000:3000 \
     -e USDT_CONTRACT_ADDRESS=0x55d398326f99059fF775485246999027B3197955 \
     -e PROGRAM_CONTRACT_ADDRESS=0x8B9c85D168d82D6266d71b6f31bb48e3bE1caDf4 \
     -e PORT=3000 \
     -e NODE_ENV=production \
     --name wallet-access-container \
     wallet-access
   ```

## Accessing the Application

Once deployed, you can access the application at:
- **Main Page**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API Health Check**: http://localhost:3000/api/check-connection

## Production Considerations

1. **Security:**
   - Change the default `SECRET_KEY` in production
   - Use HTTPS in production
   - Consider using a reverse proxy like Nginx

2. **Environment Variables:**
   - Never commit the `.env` file to version control
   - Use a secure method to manage secrets in production

3. **Monitoring:**
   - The container includes health checks
   - Monitor logs for issues: `docker-compose logs -f`

4. **Updates:**
   - To update the application:
     ```bash
     docker-compose down
     docker-compose up --build
     ```

## Troubleshooting

1. **Port conflicts:** Make sure port 3000 is not already in use, or change the PORT environment variable.

2. **Contract address issues:** Verify the contract addresses in your `.env` file are correct.

3. **Build issues:** Check that all dependencies are listed in `requirements.txt`.

4. **Permission issues:** The application runs as a non-root user for security.