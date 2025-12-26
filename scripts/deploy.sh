#!/bin/bash

# DHL Shipping Production Deployment Script
# Script tự động hóa triển khai ứng dụng lên production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/dhlshipping"
COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${GREEN}=== DHL Shipping Deployment Script ===${NC}\n"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Navigate to project directory
cd "$PROJECT_DIR" || {
    echo -e "${RED}Project directory not found: $PROJECT_DIR${NC}"
    exit 1
}

# Function to check container health
check_health() {
    local container=$1
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}Waiting for $container to be healthy...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if docker inspect "$container" --format='{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
            echo -e "${GREEN}$container is healthy!${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo -e "${RED}$container failed to become healthy${NC}"
    return 1
}

# Function to show menu
show_menu() {
    echo -e "\n${GREEN}Select deployment action:${NC}"
    echo "1) Build and start containers"
    echo "2) Stop containers"
    echo "3) Restart containers"
    echo "4) View logs"
    echo "5) Update application (pull code and rebuild)"
    echo "6) Initialize database"
    echo "7) Backup database"
    echo "8) Check status"
    echo "9) Exit"
    echo -ne "\nEnter choice [1-9]: "
}

# Main deployment function
deploy() {
    echo -e "${GREEN}Building and starting containers...${NC}\n"
    
    # Build images
    docker compose -f "$COMPOSE_FILE" build --no-cache
    
    # Start containers
    docker compose -f "$COMPOSE_FILE" up -d
    
    # Wait for health checks
    check_health "dhl-backend-prod"
    check_health "dhl-frontend-prod"
    
    echo -e "\n${GREEN}Deployment completed successfully!${NC}"
    echo -e "${YELLOW}Check status with: docker compose -f $COMPOSE_FILE ps${NC}"
}

# Stop containers
stop_containers() {
    echo -e "${YELLOW}Stopping containers...${NC}"
    docker compose -f "$COMPOSE_FILE" down
    echo -e "${GREEN}Containers stopped${NC}"
}

# Restart containers
restart_containers() {
    echo -e "${YELLOW}Restarting containers...${NC}"
    docker compose -f "$COMPOSE_FILE" restart
    echo -e "${GREEN}Containers restarted${NC}"
}

# View logs
view_logs() {
    echo -e "${YELLOW}Showing logs (Press Ctrl+C to exit)...${NC}\n"
    docker compose -f "$COMPOSE_FILE" logs -f
}

# Update application
update_app() {
    echo -e "${YELLOW}Updating application...${NC}"
    
    # Rebuild and restart
    echo "Rebuilding containers..."
    docker compose -f "$COMPOSE_FILE" up -d --build
    
    echo -e "${GREEN}Update completed!${NC}"
}

# Initialize database
init_database() {
    echo -e "${YELLOW}Initializing database...${NC}"
    docker exec dhl-backend-prod npm run init-data || {
        echo -e "${RED}Failed to initialize database${NC}"
        exit 1
    }
    echo -e "${GREEN}Database initialized${NC}"
}

# Backup database
backup_database() {
    echo -e "${YELLOW}Creating backup...${NC}"
    if [ -f "scripts/backup.sh" ]; then
        bash scripts/backup.sh
    else
        echo -e "${RED}Backup script not found${NC}"
    fi
}

# Check status
check_status() {
    echo -e "${GREEN}Container Status:${NC}\n"
    docker compose -f "$COMPOSE_FILE" ps
    
    echo -e "\n${GREEN}Resource Usage:${NC}\n"
    docker stats --no-stream
    
    echo -e "\n${GREEN}Health Checks:${NC}\n"
    echo "Backend: $(docker inspect dhl-backend-prod --format='{{.State.Health.Status}}' 2>/dev/null || echo 'not running')"
    echo "Frontend: $(docker inspect dhl-frontend-prod --format='{{.State.Health.Status}}' 2>/dev/null || echo 'not running')"
}

# Main loop
while true; do
    show_menu
    read -r choice
    
    case $choice in
        1)
            deploy
            ;;
        2)
            stop_containers
            ;;
        3)
            restart_containers
            ;;
        4)
            view_logs
            ;;
        5)
            update_app
            ;;
        6)
            init_database
            ;;
        7)
            backup_database
            ;;
        8)
            check_status
            ;;
        9)
            echo -e "${GREEN}Exiting...${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
    
    echo ""
done

