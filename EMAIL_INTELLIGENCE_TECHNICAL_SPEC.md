# 🧠 Email Intelligence System - Szczegółowa Specyfikacja Techniczna
## HVAC CRM SOTA++ - AI-Powered Email Management

---

## 📋 **OVERVIEW**

System Email Intelligence to zaawansowany moduł AI do automatycznej analizy, klasyfikacji i zarządzania komunikacją mailową w firmie HVAC. Wykorzystuje najnowsze technologie NLP i machine learning do transformacji chaotycznej komunikacji mailowej w uporządkowane, automatyczne procesy biznesowe.

---

## 🏗️ **ARCHITEKTURA SYSTEMU**

### 📧 **Email Processing Pipeline:**

```typescript
interface EmailProcessingPipeline {
  // 1. Email Ingestion
  emailConnector: IMAPConnector | ExchangeConnector | GmailAPIConnector;
  
  // 2. Content Extraction
  contentExtractor: {
    textExtraction: string;
    attachmentProcessing: AttachmentProcessor;
    metadataExtraction: EmailMetadata;
  };
  
  // 3. AI Analysis
  aiProcessor: {
    languageDetection: LanguageDetector;
    intentClassification: IntentClassifier;
    entityExtraction: EntityExtractor;
    sentimentAnalysis: SentimentAnalyzer;
    priorityScoring: PriorityScorer;
  };
  
  // 4. Business Logic
  businessProcessor: {
    leadDetection: LeadDetector;
    serviceRequestProcessor: ServiceRequestProcessor;
    emergencyDetector: EmergencyDetector;
    quoteRequestProcessor: QuoteRequestProcessor;
  };
  
  // 5. Response Generation
  responseGenerator: {
    templateEngine: ResponseTemplateEngine;
    aiContentGenerator: GPTResponseGenerator;
    approvalWorkflow: ApprovalWorkflow;
  };
  
  // 6. Integration
  integrationLayer: {
    crmIntegration: CRMIntegrator;
    pipelineIntegration: PipelineIntegrator;
    notificationSystem: NotificationSystem;
  };
}
```

---

## 🤖 **AI MODELS & ALGORITHMS**

### 🎯 **Intent Classification Model:**

```python
class HVACIntentClassifier:
    """
    Klasyfikator intencji dla branży HVAC
    Accuracy: >95% na polskich i angielskich mailach
    """
    
    INTENT_CATEGORIES = {
        'NEW_LEAD': 'Nowy potencjalny klient',
        'SERVICE_REQUEST': 'Zgłoszenie serwisowe',
        'EMERGENCY': 'Awaria/sytuacja awaryjna',
        'QUOTE_REQUEST': 'Prośba o wycenę',
        'COMPLAINT': 'Reklamacja',
        'MAINTENANCE': 'Planowana konserwacja',
        'PAYMENT_INQUIRY': 'Zapytanie o płatność',
        'TECHNICAL_SUPPORT': 'Wsparcie techniczne',
        'INSTALLATION': 'Instalacja nowego systemu',
        'WARRANTY': 'Kwestie gwarancyjne',
        'GENERAL_INQUIRY': 'Ogólne zapytanie',
        'FOLLOW_UP': 'Kontynuacja rozmowy',
        'CANCELLATION': 'Anulowanie usługi',
        'SCHEDULING': 'Planowanie wizyty',
        'FEEDBACK': 'Opinia/feedback'
    }
    
    def __init__(self):
        self.model = self.load_fine_tuned_model()
        self.polish_nlp = spacy.load("pl_core_news_lg")
        self.english_nlp = spacy.load("en_core_web_lg")
    
    def classify_intent(self, email_content: str, language: str) -> IntentResult:
        # Preprocessing
        cleaned_content = self.preprocess_text(email_content, language)
        
        # Feature extraction
        features = self.extract_features(cleaned_content, language)
        
        # Model prediction
        intent_probabilities = self.model.predict_proba([features])[0]
        
        # Post-processing with business rules
        final_intent = self.apply_business_rules(
            intent_probabilities, 
            email_content, 
            language
        )
        
        return IntentResult(
            intent=final_intent,
            confidence=max(intent_probabilities),
            all_probabilities=dict(zip(self.INTENT_CATEGORIES.keys(), intent_probabilities))
        )
```

### 🔍 **Entity Extraction Engine:**

```python
class HVACEntityExtractor:
    """
    Ekstraktor encji specyficznych dla branży HVAC
    """
    
    ENTITY_PATTERNS = {
        'PHONE_NUMBER': r'(\+48\s?)?(\d{3}[\s-]?\d{3}[\s-]?\d{3})',
        'EMAIL': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        'ADDRESS': r'ul\.\s+[A-Za-ząćęłńóśźż\s]+\d+[A-Za-z]?',
        'POSTAL_CODE': r'\d{2}-\d{3}',
        'HVAC_EQUIPMENT': [
            'klimatyzator', 'klimatyzacja', 'pompa ciepła', 'wentylacja',
            'rekuperator', 'chiller', 'split', 'multi split', 'VRV', 'VRF'
        ],
        'HVAC_BRANDS': [
            'Daikin', 'Mitsubishi', 'LG', 'Samsung', 'Gree', 'Haier',
            'Fujitsu', 'Panasonic', 'Toshiba', 'Carrier', 'York'
        ],
        'URGENCY_KEYWORDS': [
            'pilne', 'awaria', 'nie działa', 'zepsuty', 'natychmiast',
            'emergency', 'urgent', 'broken', 'not working'
        ],
        'DATE_TIME': r'\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{1,2}:\d{2}',
        'PRICE': r'\d+[\s,.]?\d*\s?(zł|PLN|euro|EUR|\$)'
    }
    
    def extract_entities(self, text: str, language: str) -> Dict[str, List[str]]:
        entities = {}
        
        # Regex-based extraction
        for entity_type, pattern in self.ENTITY_PATTERNS.items():
            if isinstance(pattern, str):
                matches = re.findall(pattern, text, re.IGNORECASE)
                entities[entity_type] = matches
            elif isinstance(pattern, list):
                found = []
                for item in pattern:
                    if item.lower() in text.lower():
                        found.append(item)
                entities[entity_type] = found
        
        # NLP-based extraction
        nlp_entities = self.extract_nlp_entities(text, language)
        entities.update(nlp_entities)
        
        return entities
```

### 📊 **Priority Scoring Algorithm:**

```python
class PriorityScorer:
    """
    Algorytm oceny pilności maila (1-10 scale)
    """
    
    PRIORITY_WEIGHTS = {
        'urgency_keywords': 3.0,
        'customer_tier': 2.0,
        'equipment_type': 1.5,
        'time_sensitivity': 2.5,
        'business_impact': 2.0,
        'sentiment_score': 1.0
    }
    
    def calculate_priority(self, email_data: EmailData) -> PriorityScore:
        score = 0.0
        factors = {}
        
        # Urgency keywords
        urgency_score = self.score_urgency_keywords(email_data.content)
        score += urgency_score * self.PRIORITY_WEIGHTS['urgency_keywords']
        factors['urgency_keywords'] = urgency_score
        
        # Customer tier (VIP, Regular, New)
        customer_tier_score = self.score_customer_tier(email_data.sender)
        score += customer_tier_score * self.PRIORITY_WEIGHTS['customer_tier']
        factors['customer_tier'] = customer_tier_score
        
        # Equipment type (critical systems get higher priority)
        equipment_score = self.score_equipment_type(email_data.entities)
        score += equipment_score * self.PRIORITY_WEIGHTS['equipment_type']
        factors['equipment_type'] = equipment_score
        
        # Time sensitivity (working hours, weekends, holidays)
        time_score = self.score_time_sensitivity(email_data.timestamp)
        score += time_score * self.PRIORITY_WEIGHTS['time_sensitivity']
        factors['time_sensitivity'] = time_score
        
        # Business impact
        impact_score = self.score_business_impact(email_data.intent, email_data.entities)
        score += impact_score * self.PRIORITY_WEIGHTS['business_impact']
        factors['business_impact'] = impact_score
        
        # Sentiment (negative sentiment = higher priority)
        sentiment_score = self.score_sentiment_impact(email_data.sentiment)
        score += sentiment_score * self.PRIORITY_WEIGHTS['sentiment_score']
        factors['sentiment_score'] = sentiment_score
        
        # Normalize to 1-10 scale
        final_score = min(10, max(1, score))
        
        return PriorityScore(
            score=final_score,
            level=self.get_priority_level(final_score),
            factors=factors,
            explanation=self.generate_explanation(factors)
        )
```

---

## 📨 **EMAIL CONNECTORS**

### 🔌 **Multi-Protocol Support:**

```typescript
interface EmailConnector {
  connect(): Promise<void>;
  fetchEmails(criteria: FetchCriteria): Promise<Email[]>;
  markAsProcessed(emailId: string): Promise<void>;
  sendResponse(response: EmailResponse): Promise<void>;
}

class IMAPConnector implements EmailConnector {
  constructor(
    private config: {
      host: string;
      port: number;
      secure: boolean;
      auth: { user: string; pass: string };
    }
  ) {}
  
  async connect(): Promise<void> {
    // IMAP connection logic
  }
}

class ExchangeConnector implements EmailConnector {
  constructor(
    private config: {
      serverUrl: string;
      username: string;
      password: string;
      domain?: string;
    }
  ) {}
  
  async connect(): Promise<void> {
    // Exchange Web Services connection
  }
}

class GmailAPIConnector implements EmailConnector {
  constructor(
    private config: {
      clientId: string;
      clientSecret: string;
      refreshToken: string;
    }
  ) {}
  
  async connect(): Promise<void> {
    // Gmail API connection
  }
}
```

---

## 🎨 **RESPONSE GENERATION SYSTEM**

### 📝 **Template Engine:**

```typescript
interface ResponseTemplate {
  id: string;
  name: string;
  intent: string;
  language: string;
  subject: string;
  body: string;
  variables: string[];
  approvalRequired: boolean;
}

class ResponseTemplateEngine {
  private templates: Map<string, ResponseTemplate> = new Map();
  
  constructor() {
    this.loadTemplates();
  }
  
  generateResponse(
    email: ProcessedEmail,
    template: ResponseTemplate,
    variables: Record<string, string>
  ): EmailResponse {
    let subject = template.subject;
    let body = template.body;
    
    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      body = body.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return {
      to: email.sender,
      subject: subject,
      body: body,
      templateId: template.id,
      originalEmailId: email.id,
      requiresApproval: template.approvalRequired
    };
  }
}
```

### 🤖 **AI Content Generator:**

```typescript
class GPTResponseGenerator {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
  
  async generatePersonalizedResponse(
    email: ProcessedEmail,
    context: CustomerContext
  ): Promise<string> {
    const prompt = this.buildPrompt(email, context);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Jesteś profesjonalnym przedstawicielem firmy HVAC. 
                   Odpowiadasz na maile klientów w sposób pomocny, profesjonalny i przyjazny.
                   Używaj polskiego języka, chyba że klient pisze po angielsku.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    
    return response.choices[0].message.content || '';
  }
  
  private buildPrompt(email: ProcessedEmail, context: CustomerContext): string {
    return `
      Email od klienta:
      Od: ${email.sender}
      Temat: ${email.subject}
      Treść: ${email.content}
      
      Intencja: ${email.intent}
      Priorytet: ${email.priority}
      Wykryte encje: ${JSON.stringify(email.entities)}
      
      Kontekst klienta:
      - Typ klienta: ${context.customerType}
      - Historia: ${context.history}
      - Poprzednie usługi: ${context.previousServices}
      
      Wygeneruj profesjonalną odpowiedź, która:
      1. Potwierdza otrzymanie maila
      2. Odnosi się do konkretnego problemu/zapytania
      3. Proponuje następne kroki
      4. Zawiera informacje kontaktowe
    `;
  }
}
```

---

## 🔄 **PIPELINE INTEGRATION**

### 🎯 **Automatic Pipeline Creation:**

```typescript
class PipelineIntegrator {
  async processEmailToPipeline(
    processedEmail: ProcessedEmail
  ): Promise<PipelineEntry> {
    switch (processedEmail.intent) {
      case 'NEW_LEAD':
        return this.createSalesPipelineEntry(processedEmail);
      
      case 'SERVICE_REQUEST':
        return this.createServicePipelineEntry(processedEmail);
      
      case 'EMERGENCY':
        return this.createEmergencyPipelineEntry(processedEmail);
      
      case 'QUOTE_REQUEST':
        return this.createQuotePipelineEntry(processedEmail);
      
      default:
        return this.createGeneralPipelineEntry(processedEmail);
    }
  }
  
  private async createSalesPipelineEntry(
    email: ProcessedEmail
  ): Promise<SalesPipelineEntry> {
    const customer = await this.findOrCreateCustomer(email.sender);
    
    return {
      id: generateId(),
      type: 'sales',
      stage: 'lead',
      customerId: customer.id,
      source: 'email',
      priority: email.priority,
      estimatedValue: this.estimateLeadValue(email),
      assignedTo: await this.assignSalesperson(email),
      createdAt: new Date(),
      metadata: {
        originalEmailId: email.id,
        extractedEntities: email.entities,
        customerNotes: email.summary
      }
    };
  }
  
  private async createServicePipelineEntry(
    email: ProcessedEmail
  ): Promise<ServicePipelineEntry> {
    const customer = await this.findCustomer(email.sender);
    const technician = await this.assignTechnician(email);
    
    return {
      id: generateId(),
      type: 'service',
      stage: 'request',
      customerId: customer?.id,
      priority: email.priority,
      urgency: this.calculateUrgency(email),
      assignedTechnician: technician.id,
      scheduledDate: await this.suggestSchedule(email, technician),
      equipment: this.extractEquipmentInfo(email),
      description: email.summary,
      createdAt: new Date(),
      metadata: {
        originalEmailId: email.id,
        extractedEntities: email.entities,
        estimatedDuration: this.estimateServiceDuration(email)
      }
    };
  }
}
```

---

## 📊 **ANALYTICS & REPORTING**

### 📈 **Email Intelligence Metrics:**

```typescript
interface EmailAnalytics {
  // Volume Metrics
  totalEmailsProcessed: number;
  emailsPerDay: number;
  emailsPerHour: number[];
  
  // Classification Metrics
  intentDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  languageDistribution: Record<string, number>;
  
  // Performance Metrics
  averageProcessingTime: number;
  classificationAccuracy: number;
  responseTime: number;
  
  // Business Metrics
  leadsGenerated: number;
  conversionRate: number;
  customerSatisfaction: number;
  
  // Team Metrics
  responsesByAgent: Record<string, number>;
  averageResponseTime: Record<string, number>;
  approvalRate: number;
}

class EmailAnalyticsEngine {
  async generateDailyReport(): Promise<EmailAnalyticsReport> {
    const today = new Date();
    const emails = await this.getEmailsForDate(today);
    
    return {
      date: today,
      summary: {
        totalProcessed: emails.length,
        newLeads: emails.filter(e => e.intent === 'NEW_LEAD').length,
        emergencies: emails.filter(e => e.priority >= 8).length,
        averageResponseTime: this.calculateAverageResponseTime(emails)
      },
      intentBreakdown: this.calculateIntentBreakdown(emails),
      performanceMetrics: await this.calculatePerformanceMetrics(emails),
      recommendations: this.generateRecommendations(emails)
    };
  }
}
```

---

## 🔒 **SECURITY & COMPLIANCE**

### 🛡️ **Data Protection:**

```typescript
class EmailSecurityManager {
  // GDPR/RODO Compliance
  async anonymizeEmailData(email: Email): Promise<AnonymizedEmail> {
    return {
      ...email,
      sender: this.hashEmail(email.sender),
      content: this.removePII(email.content),
      attachments: await this.sanitizeAttachments(email.attachments)
    };
  }
  
  // Encryption at rest
  async encryptSensitiveData(data: any): Promise<string> {
    return this.aes256Encrypt(JSON.stringify(data));
  }
  
  // Access control
  async checkPermissions(userId: string, action: string): Promise<boolean> {
    const user = await this.getUserPermissions(userId);
    return user.permissions.includes(action);
  }
}
```

---

## 🚀 **DEPLOYMENT & SCALING**

### ☁️ **Cloud Architecture:**

```yaml
# Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: email-intelligence-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: email-intelligence
  template:
    metadata:
      labels:
        app: email-intelligence
    spec:
      containers:
      - name: email-processor
        image: hvac-crm/email-intelligence:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: openai-key
```

### 📊 **Performance Targets:**

- **Email Processing**: <30 seconds per email
- **Classification Accuracy**: >95%
- **System Uptime**: 99.9%
- **Response Generation**: <10 seconds
- **Concurrent Users**: 1000+
- **Emails per Hour**: 10,000+

---

## 🎯 **FUTURE ENHANCEMENTS**

### 🔮 **Roadmap:**

1. **Voice Email Processing** - analiza wiadomości głosowych
2. **Multi-modal AI** - analiza obrazów w mailach
3. **Blockchain Integration** - niezmienność logów komunikacji
4. **Edge Computing** - przetwarzanie na urządzeniach lokalnych
5. **Quantum Encryption** - ultra-bezpieczna komunikacja

---

*Specyfikacja techniczna stworzona z pasją dla innowacji w branży HVAC* 🚀
