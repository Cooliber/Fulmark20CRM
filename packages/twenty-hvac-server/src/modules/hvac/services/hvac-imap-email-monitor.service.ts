import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';

import { HvacEmailAttachmentProcessorService, EmailAttachment, EmailProcessingResult } from './hvac-email-attachment-processor.service';
import { HvacCacheManagerService } from './hvac-cache-manager.service';
import { HVACErrorContext, HvacSentryService } from './hvac-sentry.service';
import { HvacWeaviateService, HvacSemanticDocument } from './hvac-weaviate.service';

export type EmailAccount = {
  email: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  enabled: boolean;
};

export type ProcessedEmail = {
  id: string;
  messageId: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
  receivedAt: Date;
  attachments: EmailAttachment[];
  processingResult?: EmailProcessingResult;
  customerId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
};

@Injectable()
export class HvacImapEmailMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HvacImapEmailMonitorService.name);
  private readonly emailAccounts: EmailAccount[];
  private readonly imapConnections = new Map<string, Imap>();
  private readonly processedEmails = new Map<string, ProcessedEmail>();
  private isMonitoring = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly attachmentProcessor: HvacEmailAttachmentProcessorService,
    private readonly cacheService: HvacCacheManagerService,
    private readonly sentryService: HvacSentryService,
    private readonly weaviateService: HvacWeaviateService,
  ) {
    this.emailAccounts = [
      {
        email: 'dolores@koldbringers.pl',
        password: this.configService.get('HVAC_EMAIL_DOLORES_PASSWORD', 'Blaeritipol1'),
        host: this.configService.get('HVAC_EMAIL_IMAP_HOST', 'mail.koldbringers.pl'),
        port: this.configService.get('HVAC_EMAIL_IMAP_PORT', 993),
        tls: this.configService.get('HVAC_EMAIL_IMAP_TLS', true),
        enabled: this.configService.get('HVAC_EMAIL_DOLORES_ENABLED', true),
      },
      {
        email: 'grzegorz@koldbringers.pl',
        password: this.configService.get('HVAC_EMAIL_GRZEGORZ_PASSWORD', 'Blaeritipol1'),
        host: this.configService.get('HVAC_EMAIL_IMAP_HOST', 'mail.koldbringers.pl'),
        port: this.configService.get('HVAC_EMAIL_IMAP_PORT', 993),
        tls: this.configService.get('HVAC_EMAIL_IMAP_TLS', true),
        enabled: this.configService.get('HVAC_EMAIL_GRZEGORZ_ENABLED', true),
      },
    ];
  }

  async onModuleInit(): Promise<void> {
    if (this.configService.get('HVAC_EMAIL_MONITORING_ENABLED', true)) {
      await this.startMonitoring();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.stopMonitoring();
  }

  /**
   * Start IMAP monitoring for all enabled email accounts
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('Email monitoring is already running');
      return;
    }

    try {
      this.logger.log('Starting HVAC email monitoring...');

      for (const account of this.emailAccounts) {
        if (account.enabled) {
          await this.connectToAccount(account);
        }
      }

      this.isMonitoring = true;
      this.logger.log(`Email monitoring started for ${this.imapConnections.size} accounts`);

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.EMAIL_PROCESSING,
        { action: 'start_monitoring' },
      );
      this.logger.error('Failed to start email monitoring:', error);
    }
  }

  /**
   * Stop IMAP monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    try {
      this.logger.log('Stopping HVAC email monitoring...');

      for (const [email, imap] of this.imapConnections) {
        try {
          imap.end();
          this.logger.log(`Disconnected from ${email}`);
        } catch (error) {
          this.logger.warn(`Error disconnecting from ${email}:`, error);
        }
      }

      this.imapConnections.clear();
      this.isMonitoring = false;
      this.logger.log('Email monitoring stopped');

    } catch (error) {
      this.logger.error('Error stopping email monitoring:', error);
    }
  }

  /**
   * Connect to individual email account
   */
  private async connectToAccount(account: EmailAccount): Promise<void> {
    try {
      const imap = new Imap({
        user: account.email,
        password: account.password,
        host: account.host,
        port: account.port,
        tls: account.tls,
        tlsOptions: { rejectUnauthorized: false },
        keepalive: true,
      });

      imap.once('ready', () => {
        this.logger.log(`Connected to ${account.email}`);
        this.setupEmailListener(imap, account.email);
      });

      imap.once('error', (error) => {
        this.logger.error(`IMAP error for ${account.email}:`, error);
        this.sentryService.captureHVACError(
          error,
          HVACErrorContext.EMAIL_PROCESSING,
          { email: account.email },
        );
      });

      imap.once('end', () => {
        this.logger.log(`Connection ended for ${account.email}`);
        this.imapConnections.delete(account.email);
      });

      imap.connect();
      this.imapConnections.set(account.email, imap);

    } catch (error) {
      this.logger.error(`Failed to connect to ${account.email}:`, error);
      throw error;
    }
  }

  /**
   * Setup email listener for new messages
   */
  private setupEmailListener(imap: Imap, email: string): void {
    imap.openBox('INBOX', false, (error, box) => {
      if (error) {
        this.logger.error(`Failed to open inbox for ${email}:`, error);
        return;
      }

      this.logger.log(`Monitoring inbox for ${email} (${box.messages.total} messages)`);

      // Listen for new messages
      imap.on('mail', (numNewMsgs) => {
        this.logger.log(`${numNewMsgs} new messages received in ${email}`);
        this.processNewMessages(imap, email, numNewMsgs);
      });

      // Process existing unread messages
      this.processUnreadMessages(imap, email);
    });
  }

  /**
   * Process new incoming messages
   */
  private async processNewMessages(imap: Imap, email: string, numNewMsgs: number): Promise<void> {
    try {
      // Search for recent messages
      imap.search(['UNSEEN'], (error, results) => {
        if (error) {
          this.logger.error(`Error searching for new messages in ${email}:`, error);
          return;
        }

        if (results.length > 0) {
          this.fetchAndProcessMessages(imap, email, results);
        }
      });
    } catch (error) {
      this.logger.error(`Error processing new messages for ${email}:`, error);
    }
  }

  /**
   * Process existing unread messages
   */
  private async processUnreadMessages(imap: Imap, email: string): Promise<void> {
    try {
      imap.search(['UNSEEN'], (error, results) => {
        if (error) {
          this.logger.error(`Error searching for unread messages in ${email}:`, error);
          return;
        }

        if (results.length > 0) {
          this.logger.log(`Found ${results.length} unread messages in ${email}`);
          this.fetchAndProcessMessages(imap, email, results);
        }
      });
    } catch (error) {
      this.logger.error(`Error processing unread messages for ${email}:`, error);
    }
  }

  /**
   * Fetch and process messages
   */
  private fetchAndProcessMessages(imap: Imap, email: string, messageIds: number[]): void {
    const fetch = imap.fetch(messageIds, {
      bodies: '',
      markSeen: true,
      struct: true,
    });

    fetch.on('message', (msg, seqno) => {
      this.processMessage(msg, seqno, email);
    });

    fetch.once('error', (error) => {
      this.logger.error(`Error fetching messages from ${email}:`, error);
    });

    fetch.once('end', () => {
      this.logger.log(`Finished processing ${messageIds.length} messages from ${email}`);
    });
  }

  /**
   * Process individual message
   */
  private processMessage(msg: any, seqno: number, accountEmail: string): void {
    let buffer = '';

    msg.on('body', (stream: any) => {
      stream.on('data', (chunk: any) => {
        buffer += chunk.toString('utf8');
      });

      stream.once('end', async () => {
        try {
          const parsed = await simpleParser(buffer);
          await this.handleParsedEmail(parsed, accountEmail);
        } catch (error) {
          this.logger.error(`Error parsing email from ${accountEmail}:`, error);
        }
      });
    });

    msg.once('attributes', (attrs: any) => {
      this.logger.log(`Processing message ${seqno} from ${accountEmail}`);
    });

    msg.once('end', () => {
      this.logger.debug(`Finished processing message ${seqno} from ${accountEmail}`);
    });
  }

  /**
   * Handle parsed email
   */
  private async handleParsedEmail(parsed: ParsedMail, accountEmail: string): Promise<void> {
    try {
      const emailId = this.generateEmailId();
      const customerId = await this.identifyCustomer(parsed.from?.text || '', parsed.text || '');

      // Convert attachments
      const attachments: EmailAttachment[] = parsed.attachments.map(att => ({
        filename: att.filename || 'unknown',
        contentType: att.contentType,
        size: att.size,
        content: att.content,
        cid: att.cid,
      }));

      const processedEmail: ProcessedEmail = {
        id: emailId,
        messageId: parsed.messageId || emailId,
        from: parsed.from?.text || '',
        to: parsed.to?.text ? [parsed.to.text] : [],
        subject: parsed.subject || '',
        text: parsed.text || '',
        html: parsed.html?.toString(),
        receivedAt: parsed.date || new Date(),
        attachments,
        customerId,
        status: 'pending',
      };

      // Process attachments if any
      if (attachments.length > 0) {
        processedEmail.status = 'processing';
        
        try {
          const processingResult = await this.attachmentProcessor.processEmailAttachments(
            emailId,
            attachments,
            {
              customerId,
              fromEmail: parsed.from?.text,
              subject: parsed.subject,
              receivedAt: parsed.date,
            },
          );

          processedEmail.processingResult = processingResult;
          processedEmail.status = 'completed';

        } catch (error) {
          processedEmail.status = 'failed';
          processedEmail.error = error.message;
          this.logger.error(`Error processing attachments for email ${emailId}:`, error);
        }
      } else {
        processedEmail.status = 'completed';
      }

      // Index email in Weaviate
      await this.indexEmailInWeaviate(processedEmail);

      // Store processed email
      this.processedEmails.set(emailId, processedEmail);

      this.logger.log(`Successfully processed email: ${parsed.subject} from ${parsed.from?.text}`);

    } catch (error) {
      this.sentryService.captureHVACError(
        error,
        HVACErrorContext.EMAIL_PROCESSING,
        {
          accountEmail,
          subject: parsed.subject,
          from: parsed.from?.text,
        },
      );

      this.logger.error('Error handling parsed email:', error);
    }
  }

  /**
   * Identify customer from email content
   */
  private async identifyCustomer(fromEmail: string, content: string): Promise<string | undefined> {
    try {
      // Simple customer identification logic
      // In production, this would use more sophisticated matching
      const emailDomain = fromEmail.split('@')[1];
      
      // Check cache first
      const cacheKey = `customer_email_${fromEmail}`;
      const cachedCustomerId = await this.cacheService.get<string>(cacheKey);
      if (cachedCustomerId) {
        return cachedCustomerId;
      }

      // For now, generate a simple customer ID based on email
      const customerId = `cust_${emailDomain.replace('.', '_')}_${Date.now()}`;
      
      // Cache the result
      await this.cacheService.set(cacheKey, customerId, { ttl: 86400 }); // 24 hours

      return customerId;

    } catch (error) {
      this.logger.error('Error identifying customer:', error);
      return undefined;
    }
  }

  /**
   * Index email in Weaviate for semantic search
   */
  private async indexEmailInWeaviate(email: ProcessedEmail): Promise<void> {
    try {
      const content = [
        `Subject: ${email.subject}`,
        `From: ${email.from}`,
        `Content: ${email.text}`,
        email.processingResult?.audioTranscriptions
          ?.map(trans => `Transcription: ${trans.transcriptionText}`)
          .join('\n') || '',
      ].filter(Boolean).join('\n');

      const document: HvacSemanticDocument = {
        content,
        title: `Email - ${email.subject}`,
        type: 'email',
        metadata: {
          customerId: email.customerId,
          timestamp: email.receivedAt,
          source: 'email_monitoring',
          emailId: email.id,
          fromEmail: email.from,
          subject: email.subject,
          hasAttachments: email.attachments.length > 0,
          attachmentCount: email.attachments.length,
          audioTranscriptionCount: email.processingResult?.audioTranscriptions?.length || 0,
        },
      };

      await this.weaviateService.indexDocument(document);
      this.logger.log(`Indexed email in Weaviate: ${email.id}`);

    } catch (error) {
      this.logger.error('Error indexing email in Weaviate:', error);
    }
  }

  /**
   * Manual check for new emails (called by cron)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkForNewEmails(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.logger.debug('Performing manual check for new emails...');

    for (const [email, imap] of this.imapConnections) {
      try {
        if (imap.state === 'authenticated') {
          this.processUnreadMessages(imap, email);
        }
      } catch (error) {
        this.logger.error(`Error during manual check for ${email}:`, error);
      }
    }
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): Record<string, unknown> {
    const emails = Array.from(this.processedEmails.values());
    
    return {
      totalEmails: emails.length,
      completedEmails: emails.filter(e => e.status === 'completed').length,
      failedEmails: emails.filter(e => e.status === 'failed').length,
      emailsWithAttachments: emails.filter(e => e.attachments.length > 0).length,
      totalAttachments: emails.reduce((sum, e) => sum + e.attachments.length, 0),
      audioTranscriptions: emails.reduce((sum, e) => 
        sum + (e.processingResult?.audioTranscriptions?.length || 0), 0),
      connectedAccounts: this.imapConnections.size,
      isMonitoring: this.isMonitoring,
    };
  }

  /**
   * Generate unique email ID
   */
  private generateEmailId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
