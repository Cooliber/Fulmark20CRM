/**
 * Customer 360 Communication Tab Component
 * "Pasja rodzi profesjonalizm" - Communication timeline and history
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Timeline } from 'primereact/timeline';
import React from 'react';

// HVAC monitoring
import { trackHVACUserAction } from '../../index';

// Types
interface Communication {
  id: string;
  type: 'email' | 'phone' | 'meeting' | 'note';
  subject: string;
  content: string;
  date: Date;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'pending' | 'failed';
}

interface Customer360CommunicationTabProps {
  customerId: string;
  communications: Communication[];
}

export const Customer360CommunicationTab: React.FC<Customer360CommunicationTabProps> = ({
  customerId,
  communications,
}) => {
  // Mock data for demonstration
  const mockCommunications: Communication[] = [
    {
      id: '1',
      type: 'email',
      subject: 'Zapytanie o serwis klimatyzacji',
      content: 'Dzień dobry, proszę o wycenę serwisu klimatyzacji...',
      date: new Date('2025-06-20'),
      direction: 'inbound',
      status: 'completed',
    },
    {
      id: '2',
      type: 'phone',
      subject: 'Rozmowa telefoniczna - umówienie wizyty',
      content: 'Umówiono wizytę technika na 25.06.2025',
      date: new Date('2025-06-19'),
      direction: 'outbound',
      status: 'completed',
    },
    {
      id: '3',
      type: 'meeting',
      subject: 'Wizyta techniczna',
      content: 'Przegląd systemu HVAC, wymiana filtrów',
      date: new Date('2025-06-15'),
      direction: 'outbound',
      status: 'completed',
    },
  ];

  // Get icon for communication type
  const getTypeIcon = (type: Communication['type']): string => {
    switch (type) {
      case 'email': return 'pi-envelope';
      case 'phone': return 'pi-phone';
      case 'meeting': return 'pi-users';
      case 'note': return 'pi-file-edit';
      default: return 'pi-comment';
    }
  };

  // Get color for communication direction
  const getDirectionColor = (direction: Communication['direction']): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' => {
    return direction === 'inbound' ? 'info' : 'success';
  };

  // Handle new communication action
  const handleNewCommunication = (type: string) => {
    trackHVACUserAction(
      `customer360_new_communication_${type}`,
      'CUSTOMER_360',
      { customerId, communicationType: type }
    );
    
    // TODO: Open communication dialog
    console.log(`New ${type} communication for customer ${customerId}`);
  };

  // Timeline content renderer
  const timelineContent = (item: Communication) => (
    <Card className="mt-2">
      <div className="flex justify-content-between align-items-start mb-2">
        <div className="flex align-items-center gap-2">
          <i className={`pi ${getTypeIcon(item.type)} text-primary`} />
          <span className="font-semibold">{item.subject}</span>
        </div>
        <Badge
          value={item.direction === 'inbound' ? 'Przychodzące' : 'Wychodzące'}
          severity={getDirectionColor(item.direction)}
        />
      </div>
      <p className="text-600 mb-2 line-height-3">{item.content}</p>
      <div className="text-sm text-500">
        {item.date.toLocaleDateString('pl-PL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </Card>
  );

  return (
    <div className="grid">
      {/* Communication Actions */}
      <div className="col-12">
        <Card title="Nowa komunikacja" className="mb-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              label="Wyślij email"
              icon="pi pi-envelope"
              className="p-button-outlined"
              onClick={() => handleNewCommunication('email')}
            />
            <Button
              label="Zadzwoń"
              icon="pi pi-phone"
              className="p-button-outlined"
              onClick={() => handleNewCommunication('phone')}
            />
            <Button
              label="Zaplanuj spotkanie"
              icon="pi pi-calendar"
              className="p-button-outlined"
              onClick={() => handleNewCommunication('meeting')}
            />
            <Button
              label="Dodaj notatkę"
              icon="pi pi-file-edit"
              className="p-button-outlined"
              onClick={() => handleNewCommunication('note')}
            />
          </div>
        </Card>
      </div>

      {/* Communication Timeline */}
      <div className="col-12">
        <Card title="Historia komunikacji">
          {mockCommunications.length > 0 ? (
            <Timeline
              value={mockCommunications}
              align="left"
              content={timelineContent}
              marker={(item) => (
                <div className={`timeline-marker bg-primary border-circle p-2`}>
                  <i className={`pi ${getTypeIcon(item.type)} text-white`} />
                </div>
              )}
            />
          ) : (
            <div className="text-center p-6">
              <i className="pi pi-comments text-6xl text-400 mb-4" />
              <h3 className="text-900 font-semibold mb-2">Brak komunikacji</h3>
              <p className="text-600 mb-4">
                Nie ma jeszcze żadnej komunikacji z tym klientem.
              </p>
              <Button
                label="Rozpocznij komunikację"
                icon="pi pi-plus"
                onClick={() => handleNewCommunication('email')}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
