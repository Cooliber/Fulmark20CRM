/**
 * HVAC Maintenance Checklist Component
 * "Pasja rodzi profesjonalizm" - Professional Equipment-Specific Checklists
 * 
 * Features:
 * - Equipment-specific maintenance checklists
 * - Digital form completion
 * - Photo documentation
 * - Compliance verification
 * - Performance measurements
 * - Safety checks
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { FileUpload } from 'primereact/fileupload';
import { Image } from 'primereact/image';
import { Panel } from 'primereact/panel';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Steps } from 'primereact/steps';
import { Divider } from 'primereact/divider';
import { Chip } from 'primereact/chip';
import { Rating } from 'primereact/rating';
import { classNames } from 'primereact/utils';

// Types
interface Equipment {
  id: string;
  name: string;
  type: 'AIR_CONDITIONING' | 'HEATING' | 'VENTILATION' | 'REFRIGERATION' | 'HEAT_PUMP';
  model: string;
  serialNumber: string;
  manufacturer: string;
  installationDate: Date;
  location: string;
  customerId: string;
  customerName: string;
}

interface ChecklistItem {
  id: string;
  description: string;
  category: 'SAFETY' | 'PERFORMANCE' | 'COMPLIANCE' | 'VISUAL' | 'MEASUREMENT';
  type: 'CHECKBOX' | 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'PHOTO' | 'RATING';
  required: boolean;
  options?: string[];
  unit?: string;
  minValue?: number;
  maxValue?: number;
  expectedValue?: string;
  toleranceRange?: {
    min: number;
    max: number;
  };
  instructions?: string;
  safetyNotes?: string;
  complianceCode?: string;
}

interface ChecklistResponse {
  itemId: string;
  value: any;
  notes?: string;
  photos?: File[];
  timestamp: Date;
  technicianId: string;
}

interface MaintenanceChecklist {
  id: string;
  equipmentId: string;
  equipmentType: string;
  maintenanceType: string;
  items: ChecklistItem[];
  responses: ChecklistResponse[];
  completionPercentage: number;
  startTime?: Date;
  completionTime?: Date;
  technicianId?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REQUIRES_ATTENTION';
}

interface ChecklistProps {
  equipment: Equipment[];
  onChecklistComplete: (data: any) => void;
  loading?: boolean;
}

export const HvacMaintenanceChecklist: React.FC<ChecklistProps> = ({
  equipment,
  onChecklistComplete,
  loading = false,
}) => {
  // Refs
  const toast = useRef<Toast>(null);
  const fileUploadRef = useRef<FileUpload>(null);

  // State
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [currentChecklist, setCurrentChecklist] = useState<MaintenanceChecklist | null>(null);
  const [responses, setResponses] = useState<Map<string, ChecklistResponse>>(new Map());
  const [currentStep, setCurrentStep] = useState(0);
  const [photos, setPhotos] = useState<Map<string, File[]>>(new Map());
  const [activeAccordion, setActiveAccordion] = useState<number>(0);

  // Equipment type options
  const equipmentOptions = equipment.map(eq => ({
    label: `${eq.name} (${eq.customerName})`,
    value: eq.id,
    equipment: eq,
  }));

  // Generate checklist based on equipment type
  const generateChecklist = useCallback((equipment: Equipment): MaintenanceChecklist => {
    const baseItems: ChecklistItem[] = [
      // Safety checks
      {
        id: 'safety-1',
        description: 'Sprawdź stan izolacji elektrycznej',
        category: 'SAFETY',
        type: 'CHECKBOX',
        required: true,
        instructions: 'Sprawdź czy wszystkie połączenia elektryczne są prawidłowo izolowane',
        safetyNotes: 'UWAGA: Przed sprawdzeniem wyłącz zasilanie!',
      },
      {
        id: 'safety-2',
        description: 'Sprawdź szczelność instalacji',
        category: 'SAFETY',
        type: 'CHECKBOX',
        required: true,
        instructions: 'Sprawdź czy nie ma wycieków czynnika chłodniczego',
        complianceCode: 'EPA-608',
      },
      // Performance checks
      {
        id: 'performance-1',
        description: 'Zmierz temperaturę wlotu',
        category: 'PERFORMANCE',
        type: 'NUMBER',
        required: true,
        unit: '°C',
        minValue: -30,
        maxValue: 50,
        instructions: 'Zmierz temperaturę powietrza na wlocie do urządzenia',
      },
      {
        id: 'performance-2',
        description: 'Zmierz temperaturę wylotu',
        category: 'PERFORMANCE',
        type: 'NUMBER',
        required: true,
        unit: '°C',
        minValue: -30,
        maxValue: 50,
        instructions: 'Zmierz temperaturę powietrza na wylocie z urządzenia',
      },
      {
        id: 'performance-3',
        description: 'Oceń poziom hałasu',
        category: 'PERFORMANCE',
        type: 'RATING',
        required: false,
        instructions: 'Oceń poziom hałasu w skali 1-5 (1-bardzo cichy, 5-bardzo głośny)',
      },
      // Visual inspection
      {
        id: 'visual-1',
        description: 'Stan filtrów powietrza',
        category: 'VISUAL',
        type: 'DROPDOWN',
        required: true,
        options: ['Dobry', 'Wymaga czyszczenia', 'Wymaga wymiany', 'Uszkodzony'],
        instructions: 'Sprawdź stan filtrów powietrza',
      },
      {
        id: 'visual-2',
        description: 'Zdjęcie ogólne urządzenia',
        category: 'VISUAL',
        type: 'PHOTO',
        required: true,
        instructions: 'Zrób zdjęcie ogólne urządzenia przed rozpoczęciem prac',
      },
      // Compliance checks
      {
        id: 'compliance-1',
        description: 'Sprawdź ważność certyfikatów',
        category: 'COMPLIANCE',
        type: 'CHECKBOX',
        required: true,
        instructions: 'Sprawdź czy certyfikaty urządzenia są aktualne',
        complianceCode: 'LOCAL-BUILDING-CODE',
      },
    ];

    // Add equipment-specific items
    const equipmentSpecificItems = getEquipmentSpecificItems(equipment.type);

    return {
      id: `checklist-${equipment.id}-${Date.now()}`,
      equipmentId: equipment.id,
      equipmentType: equipment.type,
      maintenanceType: 'PREVENTIVE',
      items: [...baseItems, ...equipmentSpecificItems],
      responses: [],
      completionPercentage: 0,
      status: 'NOT_STARTED',
    };
  }, []);

  // Get equipment-specific checklist items
  const getEquipmentSpecificItems = useCallback((equipmentType: string): ChecklistItem[] => {
    switch (equipmentType) {
      case 'AIR_CONDITIONING':
        return [
          {
            id: 'ac-1',
            description: 'Sprawdź poziom czynnika chłodniczego',
            category: 'PERFORMANCE',
            type: 'DROPDOWN',
            required: true,
            options: ['Prawidłowy', 'Niski', 'Wysoki', 'Wyciek'],
            complianceCode: 'EPA-608',
          },
          {
            id: 'ac-2',
            description: 'Wyczyść parownik',
            category: 'PERFORMANCE',
            type: 'CHECKBOX',
            required: true,
            instructions: 'Wyczyść parownik z kurzu i zanieczyszczeń',
          },
        ];
      case 'HEATING':
        return [
          {
            id: 'heating-1',
            description: 'Sprawdź ciśnienie gazu',
            category: 'SAFETY',
            type: 'NUMBER',
            required: true,
            unit: 'mbar',
            minValue: 0,
            maxValue: 100,
            instructions: 'Zmierz ciśnienie gazu w instalacji',
          },
        ];
      case 'VENTILATION':
        return [
          {
            id: 'vent-1',
            description: 'Zmierz przepływ powietrza',
            category: 'PERFORMANCE',
            type: 'NUMBER',
            required: true,
            unit: 'm³/h',
            minValue: 0,
            maxValue: 10000,
            instructions: 'Zmierz przepływ powietrza w kanałach',
          },
        ];
      default:
        return [];
    }
  }, []);

  // Calculate completion percentage
  const calculateCompletion = useCallback((checklist: MaintenanceChecklist, responses: Map<string, ChecklistResponse>) => {
    const requiredItems = checklist.items.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => responses.has(item.id));
    return Math.round((completedRequired.length / requiredItems.length) * 100);
  }, []);

  // Handle equipment selection
  const handleEquipmentSelect = useCallback((equipmentId: string) => {
    const equipment = equipmentOptions.find(opt => opt.value === equipmentId)?.equipment;
    if (equipment) {
      setSelectedEquipment(equipment);
      const checklist = generateChecklist(equipment);
      setCurrentChecklist(checklist);
      setResponses(new Map());
      setPhotos(new Map());
      setCurrentStep(0);
      setActiveAccordion(0);
    }
  }, [equipmentOptions, generateChecklist]);

  // Handle response change
  const handleResponseChange = useCallback((itemId: string, value: any, notes?: string) => {
    if (!currentChecklist) return;

    const newResponse: ChecklistResponse = {
      itemId,
      value,
      notes,
      timestamp: new Date(),
      technicianId: 'current-user', // Would get from auth context
    };

    const newResponses = new Map(responses);
    newResponses.set(itemId, newResponse);
    setResponses(newResponses);

    // Update completion percentage
    const completion = calculateCompletion(currentChecklist, newResponses);
    setCurrentChecklist(prev => prev ? { ...prev, completionPercentage: completion } : null);
  }, [currentChecklist, responses, calculateCompletion]);

  // Handle photo upload
  const handlePhotoUpload = useCallback((itemId: string, files: File[]) => {
    const newPhotos = new Map(photos);
    newPhotos.set(itemId, files);
    setPhotos(newPhotos);

    // Also update response
    handleResponseChange(itemId, files.length > 0, `${files.length} zdjęć dodanych`);
  }, [photos, handleResponseChange]);

  // Complete checklist
  const handleCompleteChecklist = useCallback(async () => {
    if (!currentChecklist || !selectedEquipment) return;

    try {
      const checklistData = {
        equipmentId: selectedEquipment.id,
        checklistId: currentChecklist.id,
        responses: Array.from(responses.values()),
        photos: Array.from(photos.entries()),
        completionTime: new Date(),
        completionPercentage: currentChecklist.completionPercentage,
      };

      await onChecklistComplete(checklistData);

      toast.current?.show({
        severity: 'success',
        summary: 'Sukces',
        detail: 'Lista kontrolna została ukończona',
        life: 3000,
      });

      // Reset form
      setCurrentChecklist(null);
      setSelectedEquipment(null);
      setResponses(new Map());
      setPhotos(new Map());
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się zapisać listy kontrolnej',
        life: 3000,
      });
    }
  }, [currentChecklist, selectedEquipment, responses, photos, onChecklistComplete]);

  // Render checklist item
  const renderChecklistItem = useCallback((item: ChecklistItem) => {
    const response = responses.get(item.id);
    const itemPhotos = photos.get(item.id) || [];

    return (
      <Card key={item.id} className="mb-3 bg-gray-800 border-gray-700">
        <div className="flex align-items-start gap-3">
          {/* Category indicator */}
          <div className={classNames(
            'w-1 h-full rounded',
            {
              'bg-red-500': item.category === 'SAFETY',
              'bg-blue-500': item.category === 'PERFORMANCE',
              'bg-green-500': item.category === 'COMPLIANCE',
              'bg-yellow-500': item.category === 'VISUAL',
              'bg-purple-500': item.category === 'MEASUREMENT',
            }
          )} />

          <div className="flex-1">
            {/* Item header */}
            <div className="flex justify-content-between align-items-start mb-2">
              <div>
                <h5 className="text-white font-medium mb-1">
                  {item.description}
                  {item.required && <span className="text-red-400 ml-1">*</span>}
                </h5>
                <div className="flex gap-2">
                  <Tag
                    value={item.category}
                    severity={
                      item.category === 'SAFETY' ? 'danger' :
                      item.category === 'PERFORMANCE' ? 'info' :
                      item.category === 'COMPLIANCE' ? 'success' :
                      item.category === 'VISUAL' ? 'warning' : 'secondary'
                    }
                    className="text-xs"
                  />
                  {item.complianceCode && (
                    <Chip label={item.complianceCode} className="text-xs bg-green-100 text-green-800" />
                  )}
                </div>
              </div>
              
              {response && (
                <Badge value="✓" severity="success" />
              )}
            </div>

            {/* Instructions */}
            {item.instructions && (
              <div className="text-sm text-gray-300 mb-2 p-2 bg-gray-700 rounded">
                <i className="pi pi-info-circle mr-2" />
                {item.instructions}
              </div>
            )}

            {/* Safety notes */}
            {item.safetyNotes && (
              <div className="text-sm text-red-300 mb-2 p-2 bg-red-900 rounded">
                <i className="pi pi-exclamation-triangle mr-2" />
                {item.safetyNotes}
              </div>
            )}

            {/* Input based on type */}
            <div className="mb-2">
              {item.type === 'CHECKBOX' && (
                <Checkbox
                  checked={response?.value || false}
                  onChange={(e) => handleResponseChange(item.id, e.checked)}
                />
              )}

              {item.type === 'TEXT' && (
                <InputText
                  value={response?.value || ''}
                  onChange={(e) => handleResponseChange(item.id, e.target.value)}
                  placeholder="Wprowadź wartość..."
                  className="w-full"
                />
              )}

              {item.type === 'NUMBER' && (
                <div className="flex align-items-center gap-2">
                  <InputNumber
                    value={response?.value || null}
                    onValueChange={(e) => handleResponseChange(item.id, e.value)}
                    min={item.minValue}
                    max={item.maxValue}
                    placeholder="Wprowadź wartość..."
                    className="flex-1"
                  />
                  {item.unit && (
                    <span className="text-gray-400">{item.unit}</span>
                  )}
                </div>
              )}

              {item.type === 'DROPDOWN' && (
                <Dropdown
                  value={response?.value || null}
                  options={item.options?.map(opt => ({ label: opt, value: opt }))}
                  onChange={(e) => handleResponseChange(item.id, e.value)}
                  placeholder="Wybierz opcję..."
                  className="w-full"
                />
              )}

              {item.type === 'RATING' && (
                <Rating
                  value={response?.value || 0}
                  onChange={(e) => handleResponseChange(item.id, e.value)}
                  stars={5}
                />
              )}

              {item.type === 'PHOTO' && (
                <div>
                  <FileUpload
                    ref={fileUploadRef}
                    mode="basic"
                    accept="image/*"
                    multiple
                    auto
                    chooseLabel="Dodaj zdjęcia"
                    className="mb-2"
                    customUpload
                    uploadHandler={(e) => handlePhotoUpload(item.id, e.files)}
                  />
                  
                  {itemPhotos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {itemPhotos.map((photo, index) => (
                        <Image
                          key={index}
                          src={URL.createObjectURL(photo)}
                          alt={`Zdjęcie ${index + 1}`}
                          width="100"
                          height="100"
                          preview
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <InputTextarea
              value={response?.notes || ''}
              onChange={(e) => handleResponseChange(item.id, response?.value, e.target.value)}
              placeholder="Dodatkowe uwagi..."
              rows={2}
              className="w-full"
            />

            {/* Tolerance range indicator */}
            {item.toleranceRange && item.type === 'NUMBER' && response?.value && (
              <div className="mt-2">
                {response.value >= item.toleranceRange.min && response.value <= item.toleranceRange.max ? (
                  <Tag value="W normie" severity="success" />
                ) : (
                  <Tag value="Poza normą" severity="danger" />
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }, [responses, photos, handleResponseChange, handlePhotoUpload]);

  // Group items by category
  const groupedItems = currentChecklist?.items.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, ChecklistItem[]>) || {};

  const categoryLabels = {
    SAFETY: 'Bezpieczeństwo',
    PERFORMANCE: 'Wydajność',
    COMPLIANCE: 'Zgodność',
    VISUAL: 'Inspekcja wizualna',
    MEASUREMENT: 'Pomiary',
  };

  return (
    <div className="hvac-maintenance-checklist">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Equipment Selection */}
      {!currentChecklist && (
        <Card className="mb-4 bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">
            Wybierz urządzenie do konserwacji
          </h3>
          
          <Dropdown
            value={selectedEquipment?.id || null}
            options={equipmentOptions}
            onChange={(e) => handleEquipmentSelect(e.value)}
            placeholder="Wybierz urządzenie..."
            className="w-full"
            filter
            filterBy="label"
          />
        </Card>
      )}

      {/* Checklist Progress */}
      {currentChecklist && (
        <Card className="mb-4 bg-gray-800 border-gray-700">
          <div className="flex justify-content-between align-items-center mb-3">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Lista kontrolna: {selectedEquipment?.name}
              </h3>
              <p className="text-gray-400">
                {selectedEquipment?.customerName} • {selectedEquipment?.location}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-white mb-1">
                {currentChecklist.completionPercentage}%
              </div>
              <div className="text-sm text-gray-400">
                ukończone
              </div>
            </div>
          </div>
          
          <ProgressBar
            value={currentChecklist.completionPercentage}
            className="mb-3"
          />
          
          <div className="flex gap-2">
            <Button
              label="Anuluj"
              icon="pi pi-times"
              className="p-button-outlined p-button-secondary"
              onClick={() => {
                setCurrentChecklist(null);
                setSelectedEquipment(null);
                setResponses(new Map());
                setPhotos(new Map());
              }}
            />
            
            <Button
              label="Zakończ listę kontrolną"
              icon="pi pi-check"
              className="p-button-success"
              disabled={currentChecklist.completionPercentage < 100}
              onClick={handleCompleteChecklist}
            />
          </div>
        </Card>
      )}

      {/* Checklist Items */}
      {currentChecklist && (
        <Accordion activeIndex={activeAccordion} onTabChange={(e) => setActiveAccordion(e.index as number)}>
          {Object.entries(groupedItems).map(([category, items], index) => (
            <AccordionTab
              key={category}
              header={
                <div className="flex align-items-center gap-2">
                  <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                  <Badge
                    value={items.filter(item => responses.has(item.id)).length + '/' + items.length}
                    severity={
                      items.every(item => responses.has(item.id)) ? 'success' : 'info'
                    }
                  />
                </div>
              }
            >
              <div className="space-y-3">
                {items.map(renderChecklistItem)}
              </div>
            </AccordionTab>
          ))}
        </Accordion>
      )}
    </div>
  );
};
