#!/bin/bash

# Railway Deployment Monitor for Anplexa
# Monitors all services: API, Companions, Funnel, Docs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Service names
SERVICES=("api" "companions" "funnel" "docs")

# Project details
PROJECT_ID="36380b1b-232c-4c2a-a198-c886fd7b190d"
ENV_ID="bdab3ee8-e57d-4c88-a12c-9f48368f07a9"

# Helper function to print section headers
print_header() {
    echo ""
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Helper function to print status
print_status() {
    local service=$1
    local status=$2

    if [[ $status == *"SUCCESS"* ]] || [[ $status == *"ACTIVE"* ]] || [[ $status == *"healthy"* ]]; then
        echo -e "${GREEN}✓${NC} ${BOLD}$service${NC}: ${GREEN}$status${NC}"
    elif [[ $status == *"FAILED"* ]] || [[ $status == *"ERROR"* ]]; then
        echo -e "${RED}✗${NC} ${BOLD}$service${NC}: ${RED}$status${NC}"
    elif [[ $status == *"BUILDING"* ]] || [[ $status == *"DEPLOYING"* ]]; then
        echo -e "${YELLOW}⟳${NC} ${BOLD}$service${NC}: ${YELLOW}$status${NC}"
    else
        echo -e "${BLUE}ℹ${NC} ${BOLD}$service${NC}: ${BLUE}$status${NC}"
    fi
}

# Check Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}Error: Railway CLI is not installed${NC}"
        echo "Install it with: npm install -g @railway/cli"
        exit 1
    fi
}

# Check if project is linked
check_project_linked() {
    if ! railway status &> /dev/null; then
        echo -e "${RED}Error: No Railway project linked${NC}"
        echo "Link the project with:"
        echo "  railway link --project $PROJECT_ID --environment $ENV_ID"
        exit 1
    fi
}

# Get overall project status
show_status() {
    print_header "Railway Project Status"

    echo -e "${BOLD}Project:${NC} anplexa-dev"
    echo -e "${BOLD}Environment:${NC} production"
    echo -e "${BOLD}Project ID:${NC} $PROJECT_ID"
    echo ""

    echo -e "${BOLD}Services:${NC}"
    railway status
}

# Stream logs for a specific service
stream_logs() {
    local service=$1

    if [ -z "$service" ]; then
        echo -e "${RED}Error: Service name required${NC}"
        echo "Usage: $0 logs <service-name>"
        echo "Services: ${SERVICES[*]}"
        exit 1
    fi

    print_header "Streaming Logs: $service"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""

    railway logs --service "$service" --follow
}

# View recent logs for a specific service
view_logs() {
    local service=$1
    local lines=${2:-100}

    if [ -z "$service" ]; then
        echo -e "${RED}Error: Service name required${NC}"
        echo "Usage: $0 view-logs <service-name> [lines]"
        echo "Services: ${SERVICES[*]}"
        exit 1
    fi

    print_header "Recent Logs: $service (last $lines lines)"

    railway logs --service "$service" | tail -n "$lines"
}

# Check health endpoints
check_health() {
    print_header "Health Check Status"

    echo "Fetching service URLs from Railway..."
    echo ""

    # Get the status output which should contain service URLs
    local status_output=$(railway status 2>&1)

    # Note: We'll need to get actual URLs from Railway
    # For now, show a placeholder that will be filled with actual URLs
    echo -e "${BOLD}Health Checks:${NC}"
    echo ""
    echo -e "${YELLOW}Note: To check health endpoints, first get service URLs with:${NC}"
    echo -e "${CYAN}  railway status${NC}"
    echo ""
    echo "Then manually check:"
    echo "  - API:        curl https://[api-domain]/health"
    echo "  - Companions: curl -I https://[companions-domain]/"
    echo "  - Funnel:     curl -I https://[funnel-domain]/"
    echo "  - Docs:       curl -I https://[docs-domain]/"
    echo ""

    # Try to extract and ping if domains are available
    # This is a basic implementation that can be enhanced
}

# View environment variables for a service
view_vars() {
    local service=$1

    if [ -z "$service" ]; then
        echo -e "${RED}Error: Service name required${NC}"
        echo "Usage: $0 vars <service-name>"
        echo "Services: ${SERVICES[*]}"
        exit 1
    fi

    print_header "Environment Variables: $service"

    railway variables --service "$service"
}

# Monitor all services (dashboard view)
monitor_dashboard() {
    print_header "Railway Monitoring Dashboard"

    echo -e "${BOLD}Project:${NC} anplexa-dev"
    echo -e "${BOLD}Environment:${NC} production"
    echo ""

    # Show status for all services
    echo -e "${BOLD}Service Status:${NC}"
    for service in "${SERVICES[@]}"; do
        echo "  • $service"
    done
    echo ""

    railway status

    echo ""
    echo -e "${BOLD}Available Commands:${NC}"
    echo "  $0 status           - Show project status"
    echo "  $0 logs <service>   - Stream logs for a service"
    echo "  $0 health           - Check health endpoints"
    echo "  $0 vars <service>   - View environment variables"
    echo "  $0 deploy <service> - Deploy a specific service"
    echo ""
}

# Deploy a specific service
deploy_service() {
    local service=$1

    if [ -z "$service" ]; then
        echo -e "${RED}Error: Service name required${NC}"
        echo "Usage: $0 deploy <service-name>"
        echo "Services: ${SERVICES[*]}"
        exit 1
    fi

    print_header "Deploying: $service"

    echo -e "${YELLOW}Starting deployment...${NC}"
    echo ""

    cd "apps/$service"
    railway up --service "$service"
}

# View build logs
view_build_logs() {
    local service=$1

    if [ -z "$service" ]; then
        echo -e "${RED}Error: Service name required${NC}"
        echo "Usage: $0 build-logs <service-name>"
        echo "Services: ${SERVICES[*]}"
        exit 1
    fi

    print_header "Build Logs: $service"

    railway logs --service "$service" --build
}

# View deployment logs
view_deployment_logs() {
    local service=$1

    if [ -z "$service" ]; then
        echo -e "${RED}Error: Service name required${NC}"
        echo "Usage: $0 deploy-logs <service-name>"
        echo "Services: ${SERVICES[*]}"
        exit 1
    fi

    print_header "Deployment Logs: $service"

    railway logs --service "$service" --deployment
}

# Show help
show_help() {
    cat << EOF
${BOLD}Railway Monitoring Script for Anplexa${NC}

${BOLD}USAGE:${NC}
    $0 [COMMAND] [OPTIONS]

${BOLD}COMMANDS:${NC}
    ${GREEN}status${NC}                      Show overall project status
    ${GREEN}monitor${NC}                     Show monitoring dashboard (default)
    ${GREEN}logs${NC} <service>              Stream live logs for a service
    ${GREEN}view-logs${NC} <service> [n]     View recent logs (default: 100 lines)
    ${GREEN}health${NC}                      Check health endpoints
    ${GREEN}vars${NC} <service>              Show environment variables
    ${GREEN}deploy${NC} <service>            Deploy a specific service
    ${GREEN}build-logs${NC} <service>        View build logs
    ${GREEN}deploy-logs${NC} <service>       View deployment logs
    ${GREEN}help${NC}                        Show this help message

${BOLD}SERVICES:${NC}
    ${CYAN}api${NC}         - Express.js API service
    ${CYAN}companions${NC}  - Next.js companions app
    ${CYAN}funnel${NC}      - Vite React funnel app
    ${CYAN}docs${NC}        - Docusaurus documentation

${BOLD}EXAMPLES:${NC}
    # Show dashboard
    $0

    # Check project status
    $0 status

    # Stream API logs
    $0 logs api

    # View last 50 log lines
    $0 view-logs api 50

    # Check health endpoints
    $0 health

    # View API environment variables
    $0 vars api

    # Deploy API service
    $0 deploy api

${BOLD}PROJECT INFO:${NC}
    Project ID:    $PROJECT_ID
    Environment:   production
    Dashboard URL: https://railway.com/project/$PROJECT_ID

${BOLD}DOCUMENTATION:${NC}
    See RAILWAY_DEPLOYMENT.md for full documentation

EOF
}

# Main script logic
main() {
    check_railway_cli
    check_project_linked

    local command=${1:-monitor}

    case $command in
        status)
            show_status
            ;;
        monitor|dashboard)
            monitor_dashboard
            ;;
        logs)
            stream_logs "$2"
            ;;
        view-logs)
            view_logs "$2" "$3"
            ;;
        health)
            check_health
            ;;
        vars|variables)
            view_vars "$2"
            ;;
        deploy)
            deploy_service "$2"
            ;;
        build-logs)
            view_build_logs "$2"
            ;;
        deploy-logs)
            view_deployment_logs "$2"
            ;;
        help|-h|--help)
            show_help
            ;;
        *)
            echo -e "${RED}Error: Unknown command '$command'${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
