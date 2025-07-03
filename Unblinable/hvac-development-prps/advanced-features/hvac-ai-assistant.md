name: "HVAC AI Assistant - Intelligent SOTA++ Support System"
description: |

## Purpose
Develop an advanced AI-powered assistant specifically designed for HVAC professionals, integrating seamlessly with TwentyCRM to provide intelligent support, predictive insights, and automated workflows for Polish HVAC market.

## Core Principles
1. **"Pasja rodzi profesjonalizm"** - Professional-grade AI assistance
2. **Polish Market Expertise** - Deep understanding of Polish HVAC regulations
3. **TwentyCRM Integration** - Seamless integration with existing workflows
4. **Real-time Intelligence** - Instant insights and recommendations
5. **Technician-Friendly** - Designed for field workers and office staff

---

## Goal
Create an intelligent AI assistant that understands HVAC systems, Polish market requirements, and TwentyCRM workflows to provide contextual help, predictive maintenance recommendations, and automated task management.

## Why
- **Productivity Boost**: Reduces diagnostic time by 60% through AI insights
- **Knowledge Transfer**: Captures expert knowledge for junior technicians
- **Compliance Assurance**: Ensures Polish market regulatory compliance
- **Cost Reduction**: Prevents costly equipment failures through predictions
- **Customer Satisfaction**: Faster resolution times and proactive maintenance

## What
Comprehensive AI assistant featuring:
- Natural language HVAC system diagnostics
- Predictive maintenance recommendations
- Polish regulation compliance checking
- Automated service order generation
- Real-time equipment monitoring insights
- Integration with Polish manufacturer databases
- Voice-activated mobile interface for technicians

### Success Criteria
- [ ] 90% accuracy in HVAC diagnostics
- [ ] 60% reduction in diagnostic time
- [ ] 100% Polish regulation compliance
- [ ] Voice recognition accuracy > 95%
- [ ] Integration with 5+ Polish HVAC manufacturers
- [ ] Mobile response time < 500ms
- [ ] Customer satisfaction score > 4.8/5

## All Needed Context

### Documentation & References
```yaml
# AI/ML Integration Patterns
- doc: https://docs.openai.com/api/chat/completions
  section: Function calling for HVAC diagnostics
  critical: Structured output for equipment analysis
  
- doc: https://docs.anthropic.com/claude/docs/tool-use
  section: Tool use patterns for HVAC workflows
  critical: Integration with TwentyCRM APIs

# HVAC Knowledge Base
- file: packages/hvac-core/src/knowledge/hvac-systems.ts
  why: HVAC system definitions and relationships
  critical: Equipment types and diagnostic patterns
  
- file: packages/hvac-analytics/src/services/PredictiveService.ts
  why: Existing predictive analytics patterns
  critical: Machine learning model integration

# Polish Market Requirements
- doc: https://www.gov.pl/web/klimat/certyfikacja-energetyczna
  section: Polish energy certification requirements
  critical: Compliance validation patterns
  
- file: packages/hvac-core/src/compliance/polish-regulations.ts
  why: Polish HVAC regulations implementation
  critical: Regulatory compliance checking

# TwentyCRM Integration
- file: packages/twenty-front/src/modules/ui/input/components/TextInput.tsx
  why: Input component patterns for AI interface
  critical: User interaction patterns
  
- file: packages/twenty-front/src/modules/activities/components/ActivityEditor.tsx
  why: Activity creation patterns for AI-generated tasks
  critical: Automated workflow integration
```

### AI Assistant Architecture
```typescript
// Core AI Assistant Structure
export type HVACAIAssistant = {
  id: string;
  name: string;
  capabilities: HVACCapability[];
  knowledgeBase: HVACKnowledgeBase;
  integrations: HVACIntegration[];
  polishCompliance: PolishComplianceEngine;
};

export type HVACCapability = 
  | 'diagnostics'
  | 'predictive_maintenance'
  | 'compliance_checking'
  | 'service_planning'
  | 'equipment_optimization'
  | 'energy_analysis';

export type HVACKnowledgeBase = {
  equipmentDatabase: HVACEquipmentDB;
  troubleshootingGuides: TroubleshootingGuide[];
  polishRegulations: PolishRegulation[];
  manufacturerSpecs: ManufacturerSpec[];
  bestPractices: HVACBestPractice[];
};
```

### Polish Market AI Training Data
```typescript
// Polish HVAC Market Specific Training
export const polishHVACTrainingData = {
  manufacturers: [
    'Vaillant Polska',
    'Viessmann Polska', 
    'Bosch Termotechnika',
    'Junkers Polska',
    'Daikin Polska'
  ],
  regulations: [
    'Rozporządzenie w sprawie warunków technicznych',
    'Ustawa o efektywności energetycznej',
    'Normy PN-EN dotyczące HVAC'
  ],
  climaticConditions: {
    temperatureRange: { min: -25, max: 35 },
    heatingPeriod: { start: 'October', end: 'April' },
    energyEfficiencyRequirements: 'A+++ minimum'
  },
  vatRates: {
    installation: 0.23,
    maintenance: 0.23,
    energyEfficient: 0.08
  }
};
```

## Implementation Blueprint

### Phase 1: Core AI Engine
```typescript
// AI Assistant Core Engine
export class HVACAIEngine {
  private openAIClient: OpenAI;
  private knowledgeBase: HVACKnowledgeBase;
  private polishCompliance: PolishComplianceEngine;

  constructor(config: HVACAIConfig) {
    this.openAIClient = new OpenAI({
      apiKey: config.openAIKey,
      organization: config.organization
    });
    this.knowledgeBase = new HVACKnowledgeBase(config.knowledgeConfig);
    this.polishCompliance = new PolishComplianceEngine(config.complianceConfig);
  }

  async diagnoseSystem(
    systemData: HVACSystemData,
    symptoms: string[],
    context: DiagnosticContext
  ): Promise<HVACDiagnosis> {
    const prompt = this.buildDiagnosticPrompt(systemData, symptoms, context);
    
    const response = await this.openAIClient.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: this.getHVACExpertSystemPrompt()
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      functions: this.getHVACDiagnosticFunctions(),
      function_call: 'auto'
    });

    return this.parseDiagnosticResponse(response);
  }

  private getHVACExpertSystemPrompt(): string {
    return `
      You are an expert HVAC technician with 20+ years of experience in the Polish market.
      You specialize in:
      - Heating, ventilation, and air conditioning systems
      - Polish building codes and energy efficiency regulations
      - Equipment from major Polish suppliers (Vaillant, Viessmann, Bosch)
      - Predictive maintenance and energy optimization
      
      Always consider:
      - Polish climate conditions and seasonal requirements
      - Energy efficiency standards (A+++ minimum)
      - VAT implications for different service types
      - Safety regulations and compliance requirements
      
      Provide practical, actionable recommendations that comply with Polish regulations.
    `;
  }
}
```

### Phase 2: Voice Interface for Technicians
```typescript
// Voice-Activated Mobile Interface
export class HVACVoiceAssistant {
  private speechRecognition: SpeechRecognition;
  private speechSynthesis: SpeechSynthesis;
  private aiEngine: HVACAIEngine;

  constructor(aiEngine: HVACAIEngine) {
    this.aiEngine = aiEngine;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    this.speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.speechRecognition.lang = 'pl-PL'; // Polish language
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;

    this.speechRecognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      this.processVoiceCommand(transcript);
    };
  }

  async processVoiceCommand(command: string): Promise<void> {
    const intent = await this.parseIntent(command);
    
    switch (intent.type) {
      case 'diagnose':
        await this.handleDiagnosticRequest(intent);
        break;
      case 'create_service_order':
        await this.handleServiceOrderCreation(intent);
        break;
      case 'check_compliance':
        await this.handleComplianceCheck(intent);
        break;
      default:
        this.speak('Nie rozumiem polecenia. Spróbuj ponownie.');
    }
  }

  private speak(text: string): void {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pl-PL';
    utterance.rate = 0.9;
    this.speechSynthesis.speak(utterance);
  }
}
```

### Phase 3: Predictive Maintenance AI
```typescript
// Predictive Maintenance Engine
export class HVACPredictiveEngine {
  private mlModel: TensorFlowModel;
  private historicalData: HVACHistoricalData;

  async predictMaintenance(
    equipmentId: string,
    currentMetrics: HVACMetrics
  ): Promise<MaintenancePrediction> {
    const features = this.extractFeatures(currentMetrics);
    const prediction = await this.mlModel.predict(features);
    
    return {
      equipmentId,
      riskLevel: this.calculateRiskLevel(prediction),
      recommendedActions: this.generateRecommendations(prediction),
      timeToFailure: this.estimateTimeToFailure(prediction),
      confidenceScore: prediction.confidence,
      polishComplianceImpact: this.assessComplianceImpact(prediction)
    };
  }

  private generateRecommendations(
    prediction: MLPrediction
  ): MaintenanceRecommendation[] {
    const recommendations: MaintenanceRecommendation[] = [];
    
    if (prediction.filterReplacement > 0.7) {
      recommendations.push({
        action: 'replace_filter',
        priority: 'high',
        estimatedCost: this.calculateCostInPLN('filter_replacement'),
        polishSupplier: 'Vaillant Polska',
        vatRate: 0.23
      });
    }
    
    if (prediction.systemCleaning > 0.5) {
      recommendations.push({
        action: 'system_cleaning',
        priority: 'medium',
        estimatedCost: this.calculateCostInPLN('system_cleaning'),
        complianceRequirement: 'PN-EN 12599:2012'
      });
    }
    
    return recommendations;
  }
}
```

### Phase 4: TwentyCRM Integration
```typescript
// TwentyCRM AI Assistant Integration
export const HVACAIAssistantWidget = () => {
  const [isListening, setIsListening] = useState(false);
  const [aiResponse, setAIResponse] = useState<string>('');
  const { createActivity } = useCreateActivity();
  const { createServiceOrder } = useCreateServiceOrder();

  const handleVoiceCommand = useCallback(async (command: string) => {
    const response = await hvacAIEngine.processCommand(command);
    setAIResponse(response.message);
    
    // Auto-create activities based on AI recommendations
    if (response.actions) {
      for (const action of response.actions) {
        await createActivity({
          type: 'hvac_ai_recommendation',
          title: action.title,
          description: action.description,
          dueDate: action.suggestedDate
        });
      }
    }
  }, [createActivity]);

  return (
    <Card>
      <Section title="HVAC AI Assistant">
        <Button
          onClick={() => setIsListening(!isListening)}
          variant={isListening ? 'danger' : 'primary'}
          Icon={isListening ? IconMicrophone : IconMicrophoneOff}
        >
          {isListening ? 'Zatrzymaj nasłuchiwanie' : 'Rozpocznij rozmowę'}
        </Button>
        
        {aiResponse && (
          <div style={{ marginTop: '16px' }}>
            <Text variant="body">{aiResponse}</Text>
          </div>
        )}
        
        <HVACQuickActions />
      </Section>
    </Card>
  );
};
```

## Validation & Testing Strategy

### AI Accuracy Tests
```typescript
describe('HVAC AI Diagnostics', () => {
  it('should accurately diagnose common HVAC issues', async () => {
    const systemData = createMockHVACSystem();
    const symptoms = ['low_heating', 'unusual_noise'];
    
    const diagnosis = await hvacAI.diagnoseSystem(systemData, symptoms, {});
    
    expect(diagnosis.accuracy).toBeGreaterThan(0.9);
    expect(diagnosis.recommendations).toHaveLength(3);
    expect(diagnosis.polishCompliance).toBe(true);
  });
  
  it('should provide Polish-specific recommendations', async () => {
    const diagnosis = await hvacAI.diagnoseSystem(polishHVACSystem, symptoms, {});
    
    expect(diagnosis.recommendations[0].supplier).toContain('Polska');
    expect(diagnosis.vatCalculation).toBeDefined();
    expect(diagnosis.complianceStandards).toContain('PN-EN');
  });
});
```

### Voice Recognition Tests
```typescript
describe('Voice Assistant', () => {
  it('should recognize Polish HVAC commands', async () => {
    const command = 'Sprawdź system grzewczy w budynku A';
    const intent = await voiceAssistant.parseIntent(command);
    
    expect(intent.type).toBe('diagnose');
    expect(intent.target).toBe('heating_system');
    expect(intent.location).toBe('building_A');
  });
});
```

## Integration Points

### TwentyCRM Workflow Integration
```typescript
// Automatic service order creation from AI recommendations
export const useAIServiceOrderCreation = () => {
  const { createServiceOrder } = useCreateServiceOrder();
  
  const createFromAIRecommendation = useCallback(async (
    recommendation: AIRecommendation
  ) => {
    const serviceOrder = {
      title: `AI Recommended: ${recommendation.action}`,
      description: recommendation.description,
      priority: recommendation.priority,
      estimatedCost: recommendation.estimatedCost,
      polishVAT: recommendation.vatRate,
      complianceRequirements: recommendation.complianceStandards
    };
    
    return await createServiceOrder(serviceOrder);
  }, [createServiceOrder]);
  
  return { createFromAIRecommendation };
};
```

## Success Metrics

### Performance Metrics
- Diagnostic accuracy: > 90%
- Response time: < 500ms
- Voice recognition accuracy: > 95%
- Polish language understanding: > 98%

### Business Metrics
- Diagnostic time reduction: 60%
- Customer satisfaction: > 4.8/5
- Maintenance cost reduction: 40%
- Compliance score: 100%

### Technical Metrics
- API response time: < 200ms
- Mobile app performance: 60 FPS
- Offline capability: 80% of features
- Battery usage optimization: < 5% per hour

---

**"Pasja rodzi profesjonalizm"** 🌟
**AI-powered HVAC excellence for Polish market** 🤖🔧
