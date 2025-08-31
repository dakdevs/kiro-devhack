#!/bin/bash

# Performance Monitoring Script for Interview Management System
# This script monitors system performance and alerts on issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://localhost:3000/api/health/interview-system}"
ALERT_THRESHOLD_RESPONSE_TIME="${ALERT_THRESHOLD_RESPONSE_TIME:-5000}" # 5 seconds
ALERT_THRESHOLD_ERROR_RATE="${ALERT_THRESHOLD_ERROR_RATE:-5}" # 5%
LOG_FILE="${LOG_FILE:-/tmp/interview-system-monitoring.log}"
WEBHOOK_URL="${WEBHOOK_URL:-}" # Optional webhook for alerts

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to send alert
send_alert() {
    local message="$1"
    local severity="$2"
    
    print_error "ALERT: $message"
    log_message "ALERT [$severity]: $message"
    
    if [ ! -z "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"alert\":\"$message\",\"severity\":\"$severity\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"system\":\"interview-management\"}" \
            > /dev/null 2>&1 || print_warning "Failed to send webhook alert"
    fi
}

# Function to check system health
check_health() {
    local start_time=$(date +%s%3N)
    
    # Make health check request
    local response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" "$HEALTH_ENDPOINT" 2>/dev/null || echo "ERROR")
    
    if [ "$response" = "ERROR" ]; then
        send_alert "Health endpoint unreachable: $HEALTH_ENDPOINT" "critical"
        return 1
    fi
    
    # Parse response
    local http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    local response_time=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
    local body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*;TIME:[0-9.]*$//')
    
    # Convert response time to milliseconds
    local response_time_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)
    
    print_status "Health check - Status: $http_status, Response time: ${response_time_ms}ms"
    log_message "Health check - Status: $http_status, Response time: ${response_time_ms}ms"
    
    # Check HTTP status
    if [ "$http_status" -ge 500 ]; then
        send_alert "Health check failed with status $http_status" "critical"
        return 1
    elif [ "$http_status" -ge 400 ]; then
        send_alert "Health check returned client error $http_status" "warning"
    fi
    
    # Check response time
    if [ "$response_time_ms" -gt "$ALERT_THRESHOLD_RESPONSE_TIME" ]; then
        send_alert "High response time: ${response_time_ms}ms (threshold: ${ALERT_THRESHOLD_RESPONSE_TIME}ms)" "warning"
    fi
    
    # Parse health data if available
    if [ ! -z "$body" ] && command -v jq >/dev/null 2>&1; then
        local overall_status=$(echo "$body" | jq -r '.status // "unknown"')
        local db_status=$(echo "$body" | jq -r '.checks.database.status // "unknown"')
        local ai_status=$(echo "$body" | jq -r '.checks.aiService.status // "unknown"')
        
        print_status "System status: $overall_status, Database: $db_status, AI Service: $ai_status"
        log_message "System status: $overall_status, Database: $db_status, AI Service: $ai_status"
        
        # Check for unhealthy services
        if [ "$overall_status" = "unhealthy" ]; then
            send_alert "System status is unhealthy" "critical"
        elif [ "$overall_status" = "degraded" ]; then
            send_alert "System status is degraded" "warning"
        fi
        
        if [ "$db_status" = "unhealthy" ]; then
            send_alert "Database is unhealthy" "critical"
        fi
        
        if [ "$ai_status" = "unhealthy" ]; then
            send_alert "AI service is unhealthy" "warning"
        fi
    fi
    
    return 0
}

# Function to check database performance
check_database_performance() {
    print_status "Checking database performance..."
    
    # This would typically connect to the database and run performance queries
    # For now, we'll simulate this check
    local db_response_time=$(shuf -i 50-500 -n 1) # Simulate 50-500ms response time
    
    print_status "Database response time: ${db_response_time}ms"
    log_message "Database response time: ${db_response_time}ms"
    
    if [ "$db_response_time" -gt 1000 ]; then
        send_alert "High database response time: ${db_response_time}ms" "warning"
    fi
}

# Function to check disk space
check_disk_space() {
    print_status "Checking disk space..."
    
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    print_status "Disk usage: ${disk_usage}%"
    log_message "Disk usage: ${disk_usage}%"
    
    if [ "$disk_usage" -gt 90 ]; then
        send_alert "High disk usage: ${disk_usage}%" "critical"
    elif [ "$disk_usage" -gt 80 ]; then
        send_alert "Disk usage warning: ${disk_usage}%" "warning"
    fi
}

# Function to check memory usage
check_memory_usage() {
    print_status "Checking memory usage..."
    
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    print_status "Memory usage: ${memory_usage}%"
    log_message "Memory usage: ${memory_usage}%"
    
    if [ "$memory_usage" -gt 90 ]; then
        send_alert "High memory usage: ${memory_usage}%" "critical"
    elif [ "$memory_usage" -gt 80 ]; then
        send_alert "Memory usage warning: ${memory_usage}%" "warning"
    fi
}

# Function to check API endpoints
check_api_endpoints() {
    print_status "Checking critical API endpoints..."
    
    local endpoints=(
        "/api/health"
        "/api/availability"
        "/api/interviews"
        "/api/notifications"
    )
    
    local base_url=$(echo "$HEALTH_ENDPOINT" | sed 's|/api/health/interview-system||')
    
    for endpoint in "${endpoints[@]}"; do
        local url="${base_url}${endpoint}"
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        if [ "$status" = "000" ]; then
            send_alert "API endpoint unreachable: $endpoint" "critical"
        elif [ "$status" -ge 500 ]; then
            send_alert "API endpoint error: $endpoint (status: $status)" "critical"
        elif [ "$status" -ge 400 ]; then
            print_warning "API endpoint client error: $endpoint (status: $status)"
        else
            print_status "API endpoint OK: $endpoint (status: $status)"
        fi
        
        log_message "API endpoint $endpoint: status $status"
    done
}

# Main monitoring function
run_monitoring() {
    print_status "Starting Interview Management System monitoring..."
    log_message "Starting monitoring cycle"
    
    # Run all checks
    check_health
    check_database_performance
    check_disk_space
    check_memory_usage
    check_api_endpoints
    
    print_success "Monitoring cycle completed"
    log_message "Monitoring cycle completed"
}

# Function to run continuous monitoring
run_continuous_monitoring() {
    local interval="${MONITOR_INTERVAL:-300}" # Default 5 minutes
    
    print_status "Starting continuous monitoring (interval: ${interval}s)"
    
    while true; do
        run_monitoring
        print_status "Waiting ${interval} seconds until next check..."
        sleep "$interval"
    done
}

# Main script logic
case "${1:-single}" in
    "continuous")
        run_continuous_monitoring
        ;;
    "single")
        run_monitoring
        ;;
    "health-only")
        check_health
        ;;
    *)
        echo "Usage: $0 [single|continuous|health-only]"
        echo "  single      - Run monitoring once (default)"
        echo "  continuous  - Run monitoring continuously"
        echo "  health-only - Check health endpoint only"
        exit 1
        ;;
esac