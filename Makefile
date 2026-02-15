.PHONY: help build up down restart logs ps shell-backend shell-frontend clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

ps: ## Show running containers
	docker-compose ps

shell-backend: ## Open shell in backend container
	docker-compose exec backend /bin/bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend /bin/sh

clean: ## Remove containers, volumes, and images
	docker-compose down -v --rmi all

rebuild: ## Rebuild and restart services
	docker-compose up -d --build

health: ## Check health of all services
	@echo "Checking backend health..."
	@curl -s http://localhost:8000/health | python -m json.tool || echo "Backend not responding"
	@echo ""
	@echo "Checking frontend health..."
	@curl -s http://localhost:3000/health || echo "Frontend not responding"

test-backend: ## Run backend tests
	docker-compose exec backend python -m pytest tests/ -v

install: ## First-time setup - copy .env.example to .env
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file from .env.example"; \
		echo "Please edit .env with your API keys and configuration"; \
	else \
		echo ".env file already exists"; \
	fi
