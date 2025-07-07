# HVAC-Enhanced TwentyCRM Docker Setup
## "Pasja rodzi profesjonalizm" - Professional HVAC Docker Environment

Ulepszona konfiguracja Docker dla TwentyCRM z pełną integracją modułów HVAC, zoptymalizowana dla rozwoju lokalnego z uwzględnieniem polskiego rynku HVAC.

## 🚀 Szybki Start

### 1. Uruchomienie Skryptu Setup
```bash
# Uruchom ulepszoną konfigurację Docker
./scripts/setupkurde.sh
```

### 2. Wybór Środowiska Rozwoju

#### 🐳 Docker Development (Zalecane)
```bash
# Start wszystkich usług w kontenerach
./start-hvac-docker.sh
```

#### 🖥️ Native Development
```bash
# Start bez Docker (wymaga lokalnych usług)
./start-hvac-native.sh
```

### 3. Zarządzanie Kontenerami
```bash
# Zaawansowane zarządzanie Docker
./scripts/hvac-docker-manager.sh [COMMAND]
```

## 🏗️ Architektura HVAC

### Komponenty Systemu
```
HVAC-Enhanced TwentyCRM
├── 🖥️  Frontend (Port 3002)
│   ├── HVAC Dashboard
│   ├── Customer 360 View
│   ├── Equipment Management
│   ├── Service Tickets
│   └── Analytics
├── ⚙️  Backend API (Port 3001)
│   ├── GraphQL API
│   ├── HVAC Resolvers
│   ├── Polish Compliance
│   └── Business Logic
├── 🗄️  PostgreSQL (Port 5432)
│   ├── TwentyCRM Schema
│   ├── HVAC Extensions
│   └── Polish Localization
├── 🔄 Redis Cache (Port 6379)
│   ├── Session Storage
│   ├── HVAC Cache
│   └── Performance Optimization
└── 🧠 Weaviate (Port 8080)
    ├── Semantic Search
    ├── AI Insights
    └── Vector Database
```

### Mikro-pakiety HVAC
```
packages/
├── hvac-core/           # Podstawowe typy i hooki (500KB)
├── hvac-dashboard/      # Komponenty dashboard (800KB)
├── hvac-analytics/      # Analityka z Chart.js (lazy)
├── hvac-equipment/      # Zarządzanie sprzętem
└── twenty-hvac-server/  # Dedykowany backend HVAC
```

## 🔧 Konfiguracja

### Zmienne Środowiskowe (.env.development)
```bash
# Core Configuration
NODE_ENV=development
SERVER_URL=http://localhost:3001
FRONT_BASE_URL=http://localhost:3002

# HVAC Configuration
HVAC_ENABLED=true
HVAC_DEFAULT_LANGUAGE=pl
HVAC_CURRENCY=PLN
HVAC_TIMEZONE=Europe/Warsaw

# Weaviate Configuration
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8080
WEAVIATE_API_KEY=hvac-dev-key-2024

# Polish Business Configuration
COMPANY_NAME=Fulmark HVAC Development
LOCALIZATION_CURRENCY=PLN
```

### Docker Compose Services
```yaml
services:
  twenty-server:    # TwentyCRM Backend z HVAC
  twenty-front:     # Frontend z modułami HVAC
  postgres:         # Baza danych z polską lokalizacją
  redis:            # Cache dla wydajności
  weaviate:         # Wyszukiwanie semantyczne (opcjonalne)
```

## 📋 Dostępne Komendy

### Zarządzanie Docker
```bash
# Podstawowe operacje
./scripts/hvac-docker-manager.sh start     # Start wszystkich usług
./scripts/hvac-docker-manager.sh stop      # Stop wszystkich usług
./scripts/hvac-docker-manager.sh restart   # Restart wszystkich usług
./scripts/hvac-docker-manager.sh status    # Status usług

# Monitoring i debugowanie
./scripts/hvac-docker-manager.sh health    # Sprawdzenie zdrowia usług
./scripts/hvac-docker-manager.sh logs      # Logi wszystkich usług
./scripts/hvac-docker-manager.sh monitor   # Dashboard monitoringu

# Zarządzanie danymi
./scripts/hvac-docker-manager.sh backup    # Backup bazy danych
./scripts/hvac-docker-manager.sh clean     # Czyszczenie kontenerów
./scripts/hvac-docker-manager.sh rebuild   # Przebudowa wszystkich usług
```

### Operacje na Konkretnych Usługach
```bash
# Logi konkretnej usługi
./scripts/hvac-docker-manager.sh logs-service postgres

# Shell w kontenerze
./scripts/hvac-docker-manager.sh shell twenty-server

# Start/stop konkretnej usługi
./scripts/hvac-docker-manager.sh start-service weaviate
./scripts/hvac-docker-manager.sh stop-service redis
```

## 🎯 Funkcje HVAC

### ✅ Zaimplementowane
- **Dashboard HVAC** - Centralny panel zarządzania
- **Customer 360** - Pełny widok klienta z historią
- **Equipment Management** - Zarządzanie sprzętem HVAC
- **Service Tickets** - System zleceń serwisowych
- **Semantic Search** - Wyszukiwanie semantyczne (Weaviate)
- **Polish Compliance** - Zgodność z polskim prawem
- **Bundle Optimization** - Optymalizacja rozmiaru (< 4.7MB)

### 🔄 W Rozwoju
- **AI Insights** - Analiza predykcyjna
- **IoT Integration** - Integracja z urządzeniami IoT
- **Mobile App** - Aplikacja mobilna dla techników
- **Advanced Analytics** - Zaawansowana analityka

## 🌐 Dostęp do Aplikacji

Po uruchomieniu usług:

| Usługa | URL | Opis |
|--------|-----|------|
| Frontend | http://localhost:3002 | Interfejs użytkownika HVAC |
| Backend API | http://localhost:3001 | REST API |
| GraphQL | http://localhost:3001/graphql | GraphQL Playground |
| Weaviate | http://localhost:8080 | Vector Database UI |
| PostgreSQL | localhost:5432 | Baza danych |
| Redis | localhost:6379 | Cache |

## 🔍 Diagnostyka

### Sprawdzenie Zdrowia Systemu
```bash
# Automatyczne sprawdzenie wszystkich usług
./.hvac/health-check.sh

# Sprawdzenie konkretnej usługi
curl http://localhost:3001/healthz  # Backend
curl http://localhost:3002          # Frontend
curl http://localhost:8080/v1/.well-known/ready  # Weaviate
```

### Typowe Problemy

#### 1. Port już zajęty
```bash
# Sprawdź co używa portu
sudo lsof -i :3001

# Zatrzymaj konfliktujące usługi
sudo systemctl stop apache2  # Przykład
```

#### 2. Brak uprawnień Docker
```bash
# Dodaj użytkownika do grupy docker
sudo usermod -aG docker $USER
newgrp docker
```

#### 3. Problemy z Weaviate
```bash
# Restart tylko Weaviate
./scripts/hvac-docker-manager.sh restart-service weaviate

# Sprawdź logi Weaviate
./scripts/hvac-docker-manager.sh logs-service weaviate
```

## 📊 Monitoring Wydajności

### Metryki HVAC
- **Bundle Size**: < 4.7MB (cel)
- **Search Performance**: < 300ms
- **Memory Usage**: Monitorowane przez Docker
- **Database Performance**: PostgreSQL metrics

### Narzędzia Monitoringu
- **Docker Stats**: `docker stats`
- **Health Checks**: Automatyczne sprawdzanie zdrowia
- **Performance Dashboard**: Wbudowany w HVAC
- **Sentry Integration**: Opcjonalne monitorowanie błędów

## 🚀 Deployment

### Development
```bash
# Lokalny development
./start-hvac-docker.sh
```

### Production
```bash
# Użyj production compose
docker-compose -f docker-compose.hvac-production.yml up -d
```

## 📝 Logowanie

### Lokalizacja Logów
```
./logs/
├── twenty-server.log    # Backend logs
├── twenty-front.log     # Frontend logs
├── postgres.log         # Database logs
├── redis.log           # Cache logs
└── weaviate.log        # Vector database logs
```

### Poziomy Logowania
- **DEBUG**: Szczegółowe informacje rozwojowe
- **INFO**: Informacje o działaniu systemu
- **WARN**: Ostrzeżenia o potencjalnych problemach
- **ERROR**: Błędy wymagające uwagi

## 🔐 Bezpieczeństwo

### Development Keys (NIE UŻYWAJ W PRODUKCJI)
```bash
ACCESS_TOKEN_SECRET=hvac_dev_access_secret_2024
LOGIN_TOKEN_SECRET=hvac_dev_login_secret_2024
WEAVIATE_API_KEY=hvac-dev-key-2024
```

### Production Security
- Użyj silnych, unikalnych kluczy
- Skonfiguruj HTTPS
- Włącz firewall
- Regularnie aktualizuj zależności

## 🎯 Następne Kroki

1. **Uruchom setup**: `./scripts/setupkurde.sh`
2. **Start środowiska**: `./start-hvac-docker.sh`
3. **Sprawdź zdrowie**: `./.hvac/health-check.sh`
4. **Otwórz aplikację**: http://localhost:3002
5. **Skonfiguruj HVAC**: Przejdź do modułów HVAC w nawigacji

---

**"Pasja rodzi profesjonalizm!"** 🏗️  
**"Kontrola Klimatu = Kontrola Sukcesu!"** 🌟
