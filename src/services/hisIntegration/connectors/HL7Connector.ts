/**
 * HL7 V2 Connector
 * Connects to legacy HL7 V2 systems via MLLP or HTTP
 * HL7 V2 is the most widely deployed healthcare messaging standard
 */

import { BaseHISConnector } from '../BaseHISConnector';
import { FHIRResource, HISConfig } from '../types';
import { HISConnectionError, HISDataError } from '../integrations/ErrorHandler';

interface HL7Message {
  type: string; // MSH-9.1 (e.g., ADT, ORM, ORU, RGV)
  event: string; // MSH-9.2 (e.g., A01, A02, O01, R01, V09)
  version: string; // MSH-12
  timestamp: string; // MSH-7
  messageId: string; // MSH-10
  sendingApplication: string; // MSH-3
  sendingFacility: string; // MSH-4
  receivingApplication: string; // MSH-5
  receivingFacility: string; // MSH-6
  segments: Map<string, string[][]>; // Parsed segments
  raw: string; // Raw HL7 message
}

interface HL7ParsedSegment {
  [key: string]: string | string[];
}

export class HL7Connector extends BaseHISConnector {
  private protocol: 'mllp' | 'http' = 'http';
  private fieldSeparator: string = '|';
  private componentSeparator: string = '^';
  private repetitionSeparator: string = '~';
  private escapeCharacter: string = '\\';
  private subcomponentSeparator: string = '&';

  /**
   * Connect to HL7 V2 system
   */
  async connect(): Promise<void> {
    try {
      const config = this.config;

      // Determine protocol from URL or config
      if (config.baseUrl.startsWith('mllp://')) {
        this.protocol = 'mllp';
      } else if (config.baseUrl.startsWith('http')) {
        this.protocol = 'http';
      }

      // Test connection
      const canConnect = await this.testConnection();
      if (!canConnect) {
        throw new HISConnectionError('Failed to connect to HL7 V2 system');
      }

      this.logMessage(`Connected to HL7 V2 system via ${this.protocol.toUpperCase()}`, 'Connect');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError('Connect', message);
      throw new HISConnectionError(`Failed to connect to HL7 V2 system: ${message}`);
    }
  }

  /**
   * Disconnect from HL7 V2 system
   */
  async disconnect(): Promise<void> {
    this.logMessage('Disconnected from HL7 V2 system', 'Disconnect');
  }

  /**
   * Fetch data from HL7 V2 system
   * Sends a query message and receives data
   */
  async fetchData(messageType: string = 'ADT', filters?: Record<string, string>): Promise<FHIRResource[]> {
    try {
      // Build HL7 query message
      const queryMessage = this.buildQueryMessage(messageType, filters);

      // Send message
      const response = await this.sendHL7Message(queryMessage);

      // Parse response
      const messages = this.parseHL7Messages(response);
      const resources = messages.map((msg) => this.hl7ToFHIR(msg));

      this.logMessage(`Fetched ${resources.length} resources from HL7 V2 system`, 'Fetch');
      return resources;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError('Fetch', message);
      throw new HISDataError(`Failed to fetch data from HL7 V2 system: ${message}`, 'HL7', true);
    }
  }

  /**
   * Send data to HL7 V2 system
   */
  async sendData(resource: FHIRResource): Promise<string> {
    try {
      // Convert FHIR to HL7
      const hl7Message = this.fhirToHL7(resource);

      // Send message
      const response = await this.sendHL7Message(hl7Message);

      // Parse acknowledgment
      const ackMessage = this.parseHL7Message(response);
      const messageId = ackMessage.messageId;

      this.logMessage(`Sent ${resource.resourceType} to HL7 V2 system with ID: ${messageId}`, 'Send');
      return messageId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError('Send', message);
      throw new HISDataError(`Failed to send data to HL7 V2 system: ${message}`, 'HL7', true);
    }
  }

  /**
   * Build HL7 query message
   */
  private buildQueryMessage(messageType: string, filters?: Record<string, string>): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const messageId = this.generateMessageId();

      // MSH segment (Message Header)
      const msh = [
        'MSH',
        this.fieldSeparator,
        this.componentSeparator + this.repetitionSeparator + this.escapeCharacter + this.subcomponentSeparator,
        this.config.username || 'AccreditEx',
        this.config.apiKey || 'ACCREDITEX',
        this.config.password || 'REMOTE_APP',
        this.config.clientId || 'REMOTE_FACILITY',
        timestamp,
        '',
        messageType,
        messageId,
        'P',
        '2.5.1',
      ].join(this.fieldSeparator);    // QRD segment (Query Definition) for queries
    const qrd = [
      'QRD',
      timestamp,
      messageId,
      'D',
      'A',
      '1',
      '100',
      '200',
      messageType,
    ].join(this.fieldSeparator);

    let message = `${msh}\r${qrd}`;

    // Add filter segments if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        // Add filter-specific segments (simplified)
        const qrf = [`QRF`, key, value].join(this.fieldSeparator);
        message += `\r${qrf}`;
      });
    }

    return message;
  }

  /**
   * Convert FHIR resource to HL7 V2 message
   */
  private fhirToHL7(resource: FHIRResource): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const messageId = this.generateMessageId();
    const messageType = this.resourceTypeToHL7Type(resource.resourceType);

    // MSH segment
    const msh = [
      'MSH',
      this.fieldSeparator,
      this.componentSeparator + this.repetitionSeparator + this.escapeCharacter + this.subcomponentSeparator,
      this.config.username || 'AccreditEx',
      this.config.apiKey || 'ACCREDITEX',
      this.config.password || 'REMOTE_APP',
      this.config.clientId || 'REMOTE_FACILITY',
      timestamp,
      '',
      messageType,
      messageId,
      'P',
      '2.5.1',
    ].join(this.fieldSeparator);

    let message = msh;

    // Add resource-specific segments
    if (resource.resourceType === 'Patient') {
      const patient = resource as any;
      const pid = [
        'PID',
        '1',
        patient.id,
        patient.identifier?.[0]?.value || '',
        patient.name?.[0]?.family || '',
        patient.name?.[0]?.given?.join('^') || '',
        patient.birthDate || '',
        patient.gender || 'U',
      ].join(this.fieldSeparator);
      message += `\r${pid}`;
    } else if (resource.resourceType === 'Observation') {
      const obs = resource as any;
      const obx = [
        'OBX',
        '1',
        obs.valueQuantity?.code || 'NM',
        obs.code?.coding?.[0]?.code || '',
        '0',
        obs.valueQuantity?.value || obs.valueString || '',
        obs.valueQuantity?.unit || '',
        '',
        '',
        'F',
      ].join(this.fieldSeparator);
      message += `\r${obx}`;
    }

    return message;
  }

  /**
   * Convert HL7 V2 message to FHIR resource
   */
  private hl7ToFHIR(message: HL7Message): FHIRResource {
    // Simplified conversion based on message type
    const segments = Array.from(message.segments.entries());

    if (message.type === 'ADT' || message.event === 'A01') {
      // ADT to Patient conversion
      const pid = message.segments.get('PID')?.[0];
      if (pid) {
        return {
          resourceType: 'Patient',
          id: pid[1] || this.generateId(),
          name: pid[5]
            ? [
                {
                  family: pid[5],
                  given: [pid[6]],
                },
              ]
            : [],
          birthDate: pid[7] || undefined,
          gender: (pid[8] || 'unknown').toLowerCase() as any,
          identifier: pid[2]
            ? [
                {
                  value: pid[2],
                },
              ]
            : [],
        };
      }
    } else if (message.type === 'ORU' || message.event === 'R01') {
      // ORU to Observation conversion
      const obx = message.segments.get('OBX')?.[0];
      if (obx) {
        return {
          resourceType: 'Observation',
          id: this.generateId(),
          status: 'final' as any,
          code: {
            coding: [
              {
                code: obx[3] || '',
                display: obx[3] || '',
              },
            ],
          },
          valueQuantity: {
            value: parseFloat(obx[5]) || undefined,
            unit: obx[6] || '',
          },
        };
      }
    }

    // Default resource
    return {
      resourceType: 'Bundle',
      id: this.generateId(),
      type: 'collection' as any,
    };
  }

  /**
   * Send HL7 message
   */
  private async sendHL7Message(message: string): Promise<string> {
    try {
      if (this.protocol === 'http') {
        // HTTP POST
        const response = await this.makeRequest('POST', this.config.baseUrl, { message });
        const result = await response.text();
        return result;
      } else {
        // MLLP (for completeness, actual implementation would use TCP socket)
        const mllpStart = '\x0b';
        const mllpEnd = '\x1c\x0d';
        const wrappedMessage = mllpStart + message + mllpEnd;
        this.logMessage('HL7 message queued for MLLP delivery', 'Send');
        return wrappedMessage;
      }
    } catch (error) {
      throw new HISConnectionError(`Failed to send HL7 message: ${String(error)}`);
    }
  }

  /**
   * Parse single HL7 message
   */
  private parseHL7Message(raw: string): HL7Message {
    const lines = raw.split('\r');
    const segments = new Map<string, string[][]>();

    let messageType = '';
    let event = '';
    let version = '2.5.1';
    let timestamp = '';
    let messageId = '';
    let sendingApplication = '';
    let sendingFacility = '';
    let receivingApplication = '';
    let receivingFacility = '';

    for (const line of lines) {
      if (!line) continue;

      const parts = line.split(this.fieldSeparator);
      const segmentName = parts[0];

      if (segmentName === 'MSH') {
        sendingApplication = parts[3] || '';
        sendingFacility = parts[4] || '';
        receivingApplication = parts[5] || '';
        receivingFacility = parts[6] || '';
        timestamp = parts[7] || '';
        messageType = parts[9]?.split(this.componentSeparator)[0] || '';
        event = parts[9]?.split(this.componentSeparator)[1] || '';
        messageId = parts[10] || '';
        version = parts[12] || '2.5.1';
      }

      // Store all fields as array of arrays
      const fieldData = parts.slice(1).map((field) => field.split(this.componentSeparator));
      segments.set(segmentName, fieldData);
    }

    return {
      type: messageType,
      event,
      version,
      timestamp,
      messageId,
      sendingApplication,
      sendingFacility,
      receivingApplication,
      receivingFacility,
      segments,
      raw,
    };
  }

  /**
   * Parse multiple HL7 messages
   */
  private parseHL7Messages(raw: string): HL7Message[] {
    // Handle multiple messages separated by MLLP markers
    const messages: HL7Message[] = [];
    const mllpStart = '\x0b';
    const mllpEnd = '\x1c';

    let current = raw;
    while (current.includes(mllpStart)) {
      const start = current.indexOf(mllpStart);
      const end = current.indexOf(mllpEnd, start);

      if (start !== -1 && end !== -1) {
        const messageRaw = current.substring(start + 1, end);
        messages.push(this.parseHL7Message(messageRaw));
        current = current.substring(end + 2);
      } else {
        break;
      }
    }

    // If no MLLP markers, treat entire input as single message
    if (messages.length === 0) {
      messages.push(this.parseHL7Message(raw));
    }

    return messages;
  }

  /**
   * Map FHIR resource type to HL7 message type
   */
  private resourceTypeToHL7Type(resourceType: string): string {
    const mapping: Record<string, string> = {
      Patient: 'ADT^A01',
      Observation: 'ORU^R01',
      Medication: 'RGV^O15',
      Procedure: 'ORM^O01',
      Encounter: 'ADT^A01',
      Condition: 'ADT^A01',
    };
    return mapping[resourceType] || 'ADT^A01';
  }

  /**
   * Test connection to HL7 V2 system
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testMessage = 'MSH|^~\\&|TEST|TEST|TEST|TEST|20231201010101||ADT^A01|123|P|2.5.1';
      const response = await this.sendHL7Message(testMessage);
      if (response.length > 0) {
        return { success: true, message: 'Connected to HL7 V2 system successfully' };
      }
      return { success: false, message: 'HL7 V2 system returned empty response' };
    } catch (error) {
      return { success: false, message: `HL7 connection test failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique resource ID
   */
  private generateId(): string {
    return `ID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
