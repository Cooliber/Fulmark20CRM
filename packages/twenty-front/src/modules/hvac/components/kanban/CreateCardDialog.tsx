/**
 * CreateCardDialog - Dialog for Creating New Kanban Cards
 * "Pasja rodzi profesjonalizm" - Professional card creation dialog for HVAC
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Chips } from 'primereact/chips';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import React, { useCallback, useState } from 'react';

// HVAC services and hooks
import {
    KanbanCardType,
    trackHVACUserAction
} from '../../index';

// Component props
interface CreateCardDialogProps {
  visible: boolean;
  columnId: string | null;
  onHide: () => void;
  onCreateCard: (cardData: Partial<KanbanCardType>) => Promise<void>;
}

// Card type options
const CARD_TYPES = [
  { label: 'Serwis', value: 'service' },
  { label: 'Instalacja', value: 'installation' },
  { label: 'Konserwacja', value: 'maintenance' },
  { label: 'Naprawa', value: 'repair' },
  { label: 'Przegląd', value: 'inspection' },
  { label: 'Awaria', value: 'emergency' },
];

// Priority options
const PRIORITY_OPTIONS = [
  { label: 'Niski', value: 'low' },
  { label: 'Średni', value: 'medium' },
  { label: 'Wysoki', value: 'high' },
  { label: 'Krytyczny', value: 'critical' },
];

export const CreateCardDialog: React.FC<CreateCardDialogProps> = ({
  visible,
  columnId,
  onHide,
  onCreateCard,
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<KanbanCardType>>({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    status: 'active',
    tags: [],
    dueDate: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof KanbanCardType, value: any) => {
    setFormData((prev: Partial<KanbanCardType>) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!formData.title?.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Track card creation attempt
      trackHVACUserAction('kanban_card_create_attempt', 'KANBAN_MANAGEMENT', {
        columnId,
        cardType: formData.type,
        priority: formData.priority,
      });

      await onCreateCard({
        ...formData,
        title: formData.title!.trim(),
        description: formData.description?.trim() || '',
        columnId: columnId!,
        position: 0, // Will be set by the service
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        status: 'active',
        tags: [],
        dueDate: undefined,
      });

      // Track successful creation
      trackHVACUserAction('kanban_card_created_success', 'KANBAN_MANAGEMENT', {
        columnId,
        cardType: formData.type,
      });

    } catch (error) {
      trackHVACUserAction('kanban_card_create_error', 'KANBAN_MANAGEMENT', {
        error: error instanceof Error ? error.message : 'Unknown error',
        columnId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, columnId, onCreateCard]);

  // Handle dialog hide
  const handleHide = useCallback(() => {
    if (!isSubmitting) {
      onHide();
      // Reset form when closing
      setFormData({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        status: 'active',
        tags: [],
        dueDate: undefined,
      });
    }
  }, [isSubmitting, onHide]);

  // Dialog footer
  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Anuluj"
        icon="pi pi-times"
        outlined
        onClick={handleHide}
        disabled={isSubmitting}
      />
      <Button
        label="Utwórz kartę"
        icon="pi pi-check"
        onClick={handleSubmit}
        disabled={!formData.title?.trim() || isSubmitting}
        loading={isSubmitting}
      />
    </div>
  );

  return (
    <Dialog
      header="Utwórz nową kartę"
      visible={visible}
      style={{ width: '500px' }}
      footer={dialogFooter}
      onHide={handleHide}
      modal
      draggable={false}
      resizable={false}
    >
      <div className="flex flex-column gap-3">
        {/* Title */}
        <div className="field">
          <label htmlFor="card-title" className="block text-900 font-medium mb-2">
            Tytuł *
          </label>
          <InputText
            id="card-title"
            value={formData.title || ''}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Wprowadź tytuł karty..."
            className="w-full"
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="field">
          <label htmlFor="card-description" className="block text-900 font-medium mb-2">
            Opis
          </label>
          <InputTextarea
            id="card-description"
            value={formData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Wprowadź opis karty..."
            className="w-full"
            rows={3}
          />
        </div>

        {/* Type and Priority */}
        <div className="flex gap-3">
          <div className="field flex-1">
            <label htmlFor="card-type" className="block text-900 font-medium mb-2">
              Typ
            </label>
            <Dropdown
              id="card-type"
              value={formData.type}
              options={CARD_TYPES}
              onChange={(e) => handleFieldChange('type', e.value)}
              className="w-full"
            />
          </div>

          <div className="field flex-1">
            <label htmlFor="card-priority" className="block text-900 font-medium mb-2">
              Priorytet
            </label>
            <Dropdown
              id="card-priority"
              value={formData.priority}
              options={PRIORITY_OPTIONS}
              onChange={(e) => handleFieldChange('priority', e.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Due Date */}
        <div className="field">
          <label htmlFor="card-due-date" className="block text-900 font-medium mb-2">
            Termin wykonania
          </label>
          <Calendar
            id="card-due-date"
            value={formData.dueDate}
            onChange={(e) => handleFieldChange('dueDate', e.value)}
            placeholder="Wybierz termin..."
            className="w-full"
            dateFormat="dd/mm/yy"
            showIcon
          />
        </div>

        {/* Tags */}
        <div className="field">
          <label htmlFor="card-tags" className="block text-900 font-medium mb-2">
            Tagi
          </label>
          <Chips
            id="card-tags"
            value={formData.tags || []}
            onChange={(e) => handleFieldChange('tags', e.value)}
            placeholder="Dodaj tagi..."
            className="w-full"
          />
        </div>
      </div>
    </Dialog>
  );
};
