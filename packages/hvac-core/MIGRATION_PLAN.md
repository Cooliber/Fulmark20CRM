# HVAC Mikro-Pakiety - Plan Migracji
## "Pasja rodzi profesjonalizm" - Migration Strategy

## 🚀 Etapy Migracji

### ✅ ETAP 1: hvac-core (COMPLETED)
**Status**: ✅ Zakończony
**Czas**: ~2h
**Rezultat**: 500KB bundle size

**Wykonane działania**:
- [x] Przeniesienie types/ do hvac-core/src/types/
- [x] Przeniesienie hooks/ do hvac-core/src/hooks/
- [x] Przeniesienie states/ do hvac-core/src/states/
- [x] Przeniesienie utils/ do hvac-core/src/utils/
- [x] Konfiguracja package.json, tsconfig.json
- [x] Utworzenie index.ts z eksportami

### 🔄 ETAP 2: hvac-dashboard (IN PROGRESS)
**Status**: 🔄 W trakcie
**Czas**: ~3h
**Target**: 800KB bundle size

**Wykonane działania**:
- [x] Przeniesienie components/dashboard/ do hvac-dashboard/src/components/
- [x] Przeniesienie components/lazy/ do hvac-dashboard/src/lazy/
- [x] Przeniesienie HvacDashboard.tsx
- [x] Konfiguracja package.json

**Do wykonania**:
- [ ] Optymalizacja importów w lazy components
- [ ] Konfiguracja proper lazy loading
- [ ] Testowanie bundle size
- [ ] Integracja z hvac-core

### 📊 ETAP 3: hvac-analytics (PLANNED)
**Status**: 📅 Zaplanowany
**Czas**: ~4h
**Target**: 1.2MB lazy loaded

**Do wykonania**:
- [ ] Przeniesienie components/analytics/
- [ ] Konfiguracja optional dependencies (Chart.js, D3.js)
- [ ] Implementacja dynamic loading
- [ ] Fallback na native charts
- [ ] Bundle size optimization

### 🔧 ETAP 4: hvac-equipment (PLANNED)
**Status**: 📅 Zaplanowany
**Czas**: ~3h
**Target**: 600KB bundle size

**Do wykonania**:
- [ ] Przeniesienie components/equipment/
- [ ] Przeniesienie components/maintenance/
- [ ] Optymalizacja komponentów
- [ ] Integracja z hvac-core
- [ ] Testing i validation

### 📅 ETAP 5: hvac-scheduling (PLANNED)
**Status**: 📅 Zaplanowany
**Czas**: ~4h
**Target**: 700KB bundle size

**Do wykonania**:
- [ ] Utworzenie pakietu hvac-scheduling
- [ ] Przeniesienie components/scheduling/
- [ ] Przeniesienie components/mobile/
- [ ] Mobile-first optimization
- [ ] Real-time updates integration

### 👥 ETAP 6: hvac-customers (PLANNED)
**Status**: 📅 Zaplanowany
**Czas**: ~3h
**Target**: 600KB bundle size

**Do wykonania**:
- [ ] Utworzenie pakietu hvac-customers
- [ ] Przeniesienie HvacCustomerList.tsx
- [ ] Przeniesienie components/audio-transcription/
- [ ] Przeniesienie components/polish-compliance/
- [ ] Customer 360 integration

### 🔧 ETAP 7: Nx Workspace Configuration
**Status**: 📅 Zaplanowany
**Czas**: ~2h

**Do wykonania**:
- [ ] Dodanie wszystkich pakietów do nx.json
- [ ] Konfiguracja project.json dla każdego pakietu
- [ ] Dependency management
- [ ] Build scripts optimization
- [ ] CI/CD integration

### 🎯 ETAP 8: Bundle Optimization & Testing
**Status**: 📅 Zaplanowany
**Czas**: ~4h

**Do wykonania**:
- [ ] Bundle size analysis i monitoring
- [ ] Performance testing
- [ ] E2E Playwright tests
- [ ] Polish market compliance testing
- [ ] Production deployment preparation

## 📋 Checklist Migracji

### Pre-Migration Checklist
- [x] Backup obecnej struktury
- [x] Analiza zależności
- [x] Plan architektury
- [x] Bundle size targets

### Per-Package Checklist
**Dla każdego pakietu**:
- [ ] Utworzenie struktury folderów
- [ ] Konfiguracja package.json
- [ ] Konfiguracja tsconfig.json
- [ ] Przeniesienie komponentów
- [ ] Aktualizacja importów
- [ ] Testowanie build
- [ ] Bundle size verification
- [ ] Integration testing

### Post-Migration Checklist
- [ ] Wszystkie pakiety działają
- [ ] Bundle size < 4.7MB
- [ ] Performance tests pass
- [ ] E2E tests pass
- [ ] Production deployment ready

## 🔄 Migration Commands

### 1. Tworzenie nowego pakietu
```bash
# Struktura pakietu
mkdir -p packages/hvac-{name}/src
cd packages/hvac-{name}

# Package configuration
cat > package.json << EOF
{
  "name": "hvac-{name}",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "hvac-core": "workspace:*",
    "twenty-ui": "workspace:*"
  }
}
EOF

# TypeScript configuration
cat > tsconfig.json << EOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs"
  }
}
EOF
```

### 2. Przenoszenie komponentów
```bash
# Przeniesienie folderów
mv packages/twenty-front/src/modules/hvac/components/{folder} \
   packages/hvac-{name}/src/components/

# Aktualizacja importów
find packages/hvac-{name} -name "*.tsx" -o -name "*.ts" | \
xargs sed -i 's|from '\''../../|from '\''hvac-core|g'
```

### 3. Testowanie bundle size
```bash
# Build pakietu
cd packages/hvac-{name}
npm run build

# Analiza rozmiaru
du -sh dist/
```

## 🎯 Success Metrics

### Bundle Size Targets
- [x] hvac-core: 500KB ✅
- [ ] hvac-dashboard: 800KB 🔄
- [ ] hvac-analytics: 1.2MB (lazy) 📅
- [ ] hvac-equipment: 600KB 📅
- [ ] hvac-scheduling: 700KB 📅
- [ ] hvac-customers: 600KB 📅
- [ ] **TOTAL MAIN**: < 500KB 🎯
- [ ] **TOTAL LAZY**: < 4.2MB 🎯

### Performance Targets
- [ ] Initial load time: < 2s
- [ ] Lazy component load: < 500ms
- [ ] Search debounce: 300ms
- [ ] Bundle optimization: > 80% reduction

### Quality Targets
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 warnings
- [ ] Tests: 100% critical path coverage
- [ ] E2E: All user journeys pass

## 🚨 Risk Mitigation

### Potential Issues
1. **Import Dependencies**: Circular dependencies między pakietami
   - **Solution**: Strict dependency rules, tylko hvac-core jako shared

2. **Bundle Size Overflow**: Pakiety przekraczają limity
   - **Solution**: Continuous monitoring, aggressive lazy loading

3. **TypeScript Errors**: Broken imports po migracji
   - **Solution**: Incremental migration, proper type exports

4. **Performance Regression**: Slower loading po refactor
   - **Solution**: Performance testing, optimization

### Rollback Plan
1. **Git branches**: Każdy etap w osobnej gałęzi
2. **Backup**: Pełny backup przed migracją
3. **Incremental**: Możliwość rollback pojedynczych pakietów
4. **Testing**: Comprehensive testing przed merge

## 🎉 Expected Results

Po zakończeniu migracji:
- ✅ **Bundle size**: < 4.7MB (cel osiągnięty!)
- ✅ **Performance**: Znacznie szybsze ładowanie
- ✅ **Maintainability**: Modularny, łatwy w utrzymaniu kod
- ✅ **Scalability**: Łatwe dodawanie nowych funkcji
- ✅ **Developer Experience**: Lepsze DX dzięki modularności

**"Pasja rodzi profesjonalizm"** - Każdy pakiet to perfekcyjnie zoptymalizowany element! 🚀
