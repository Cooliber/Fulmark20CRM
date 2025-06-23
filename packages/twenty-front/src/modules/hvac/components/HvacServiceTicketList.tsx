import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import styled from '@emotion/styled';
import { IconPlus, IconCalendar, IconUser, IconTool } from 'twenty-ui/display';

// Note: IconTicket is not available in twenty-ui, using IconTag as alternative
import { IconTag as IconTicket } from 'twenty-ui/display';

// GraphQL Queries
const HVAC_SERVICE_TICKETS = gql`
  query HvacServiceTickets($first: Int!, $offset: Int!) {
    hvacServiceTickets(first: $first, offset: $offset) {
      edges {
        id
        ticketNumber
        title
        description
        status
        priority
        serviceType
        customerId
        technicianId
        scheduledDate
        estimatedCost
        createdAt
        updatedAt
      }
      totalCount
      hasNextPage
      hasPreviousPage
    }
  }
`;

const CREATE_HVAC_SERVICE_TICKET = gql`
  mutation CreateHvacServiceTicket($input: CreateHvacServiceTicketInput!) {
    createHvacServiceTicket(input: $input) {
      id
      ticketNumber
      title
      status
      priority
      serviceType
      scheduledDate
      estimatedCost
    }
  }
`;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  gap: 16px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.font.color.primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${({ theme }) => theme.color.blue};
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.color.blue}dd;
  }
`;

const TicketGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
`;

const TicketCard = styled.div<{ priority: string }>`
  padding: 20px;
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.light};
  border-left: 4px solid ${({ priority, theme }) => 
    priority === 'EMERGENCY' ? theme.color.red :
    priority === 'CRITICAL' ? theme.color.orange :
    priority === 'HIGH' ? theme.color.yellow :
    priority === 'MEDIUM' ? theme.color.blue :
    theme.color.green
  };
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.color.blue};
    box-shadow: 0 4px 12px ${({ theme }) => theme.color.blue}20;
    transform: translateY(-2px);
  }
`;

const TicketHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const TicketNumber = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.font.color.tertiary};
  text-transform: uppercase;
`;

const TicketTitle = styled.h3`
  margin: 4px 0 0 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.font.color.primary};
  line-height: 1.3;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${({ status, theme }) => 
    status === 'COMPLETED' ? theme.color.green + '20' :
    status === 'IN_PROGRESS' ? theme.color.blue + '20' :
    status === 'SCHEDULED' ? theme.color.purple + '20' :
    status === 'ON_HOLD' ? theme.color.orange + '20' :
    status === 'CANCELLED' ? theme.color.red + '20' :
    theme.color.gray + '20'
  };
  color: ${({ status, theme }) => 
    status === 'COMPLETED' ? theme.color.green :
    status === 'IN_PROGRESS' ? theme.color.blue :
    status === 'SCHEDULED' ? theme.color.purple :
    status === 'ON_HOLD' ? theme.color.orange :
    status === 'CANCELLED' ? theme.color.red :
    theme.color.gray
  };
`;

const TicketDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${({ theme }) => theme.font.color.secondary};
`;

const DetailIcon = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.font.color.tertiary};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  color: ${({ theme }) => theme.font.color.tertiary};
`;

// Types
interface ServiceTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  serviceType: string;
  customerId?: string;
  technicianId?: string;
  scheduledDate?: string;
  estimatedCost?: number;
  createdAt: string;
  updatedAt: string;
}

interface HvacServiceTicketListProps {
  onTicketClick?: (ticket: ServiceTicket) => void;
  onCreateTicket?: () => void;
}

export const HvacServiceTicketList: React.FC<HvacServiceTicketListProps> = ({
  onTicketClick,
  onCreateTicket,
}) => {
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // GraphQL hooks
  const { data, loading, error, refetch } = useQuery(HVAC_SERVICE_TICKETS, {
    variables: {
      first: pageSize,
      offset: page * pageSize,
    },
    pollInterval: 30000, // Poll every 30 seconds for updates
  });

  const [createTicket] = useMutation(CREATE_HVAC_SERVICE_TICKET, {
    onCompleted: () => {
      refetch();
    },
  });

  const handleTicketClick = useCallback((ticket: ServiceTicket) => {
    if (onTicketClick) {
      onTicketClick(ticket);
    }
  }, [onTicketClick]);

  const handleCreateClick = useCallback(() => {
    if (onCreateTicket) {
      onCreateTicket();
    }
  }, [onCreateTicket]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      INSTALLATION: 'Instalacja',
      MAINTENANCE: 'Konserwacja',
      REPAIR: 'Naprawa',
      INSPECTION: 'Przegląd',
      EMERGENCY: 'Awaria',
      CONSULTATION: 'Konsultacja',
    };
    return labels[type] || type;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      LOW: 'Niski',
      MEDIUM: 'Średni',
      HIGH: 'Wysoki',
      CRITICAL: 'Krytyczny',
      EMERGENCY: 'Awaria',
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      OPEN: 'Otwarte',
      SCHEDULED: 'Zaplanowane',
      IN_PROGRESS: 'W trakcie',
      ON_HOLD: 'Wstrzymane',
      COMPLETED: 'Zakończone',
      CANCELLED: 'Anulowane',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <LoadingContainer>
        Ładowanie zgłoszeń serwisowych...
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Container>
        <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
          Błąd podczas ładowania zgłoszeń: {error.message}
        </div>
      </Container>
    );
  }

  const tickets = data?.hvacServiceTickets?.edges || [];

  return (
    <Container>
      <Header>
        <Title>
          <IconTicket size={24} />
          Zgłoszenia Serwisowe HVAC
        </Title>
        <CreateButton onClick={handleCreateClick}>
          <IconPlus size={16} />
          Nowe Zgłoszenie
        </CreateButton>
      </Header>

      <TicketGrid>
        {tickets.map((ticket: ServiceTicket) => (
          <TicketCard
            key={ticket.id}
            priority={ticket.priority}
            onClick={() => handleTicketClick(ticket)}
          >
            <TicketHeader>
              <div>
                <TicketNumber>{ticket.ticketNumber}</TicketNumber>
                <TicketTitle>{ticket.title}</TicketTitle>
              </div>
              <StatusBadge status={ticket.status}>
                {getStatusLabel(ticket.status)}
              </StatusBadge>
            </TicketHeader>

            <TicketDetails>
              <DetailRow>
                <DetailIcon>
                  <IconTool size={14} />
                </DetailIcon>
                {getServiceTypeLabel(ticket.serviceType)} | Priorytet: {getPriorityLabel(ticket.priority)}
              </DetailRow>

              {ticket.scheduledDate && (
                <DetailRow>
                  <DetailIcon>
                    <IconCalendar size={14} />
                  </DetailIcon>
                  Zaplanowane: {formatDate(ticket.scheduledDate)}
                </DetailRow>
              )}

              {ticket.estimatedCost && (
                <DetailRow>
                  <DetailIcon>
                    💰
                  </DetailIcon>
                  Szacowany koszt: {formatCurrency(ticket.estimatedCost)}
                </DetailRow>
              )}

              <DetailRow>
                <DetailIcon>
                  <IconUser size={14} />
                </DetailIcon>
                Utworzone: {formatDate(ticket.createdAt)}
              </DetailRow>
            </TicketDetails>
          </TicketCard>
        ))}
      </TicketGrid>

      {tickets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
          <IconTicket size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <div>Brak zgłoszeń serwisowych</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            Kliknij "Nowe Zgłoszenie" aby utworzyć pierwsze zgłoszenie
          </div>
        </div>
      )}
    </Container>
  );
};
