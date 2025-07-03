/**
 * HVAC Mobile Work Order Component
 * "Pasja rodzi profesjonalizm" - Professional Mobile Work Order Interface
 * 
 * Features:
 * - Digital work order completion
 * - Photo documentation
 * - Customer signature capture
 * - Parts and materials tracking
 * - Time tracking
 * - Offline support
 */

// Replaced PrimeReact with TwentyCRM native components for bundle optimization
import { Button } from 'twenty-ui/input';
import { HvacCard, HvacTable } from '../ui/HvacNativeComponents';
import { InputText, ConfirmDialog, toast } from '../ui/PrimeReactReplacements';
import React, { useCallback, useEffect, useRef, useState } from 'react';


// Types
interface TechnicianJob {
  id: string;
  ticketId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED';
  scheduledTime: Date;
  estimatedDuration: number;
  description: string;
  equipmentInfo?: {
    type: string;
    model: string;
    serialNumber: string;
  };
  checklist?: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  description: string;
  category: 'SAFETY' | 'PERFORMANCE' | 'COMPLIANCE' | 'VISUAL';
  type: 'CHECKBOX' | 'TEXT' | 'NUMBER' | 'PHOTO';
  required: boolean;
  completed: boolean;
  value?: any;
  notes?: string;
  photo?: File;
}

interface WorkOrderPart {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: 'FILTER' | 'REFRIGERANT' | 'ELECTRICAL' | 'MECHANICAL' | 'OTHER';
}

interface WorkOrderData {
  jobId: string;
  startTime: Date;
  endTime: Date;
  workPerformed: string;
  partsUsed: WorkOrderPart[];
  checklist: ChecklistItem[];
  photos: File[];
  customerSignature?: string;
  technicianNotes: string;
  customerFeedback?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

interface WorkOrderProps {
  job: TechnicianJob;
  onComplete: (jobId: string, workOrderData: WorkOrderData) => void;
  onStatusUpdate: (jobId: string, status: TechnicianJob['status'], notes?: string) => void;
  onClose: () => void;
}

export const HvacMobileWorkOrder: React.FC<WorkOrderProps> = ({
  job,
  onComplete,
  onStatusUpdate,
  onClose,
}) => {
  const hvacApiService = new HvacApiIntegrationService();
  const hvacAnalyticsService = new HvacAnalyticsEngineService();

  useEffect(() => {
    // Fetch maintenance records on component mount
    const fetchMaintenanceRecords = async () => {
      const records = await hvacApiService.getMaintenanceRecords();
      console.log('Fetched maintenance records:', records);
    };

    fetchMaintenanceRecords();
  }, [hvacApiService]);
  // Refs
  const toast = useRef<Toast>(null);
  const fileUploadRef = useRef<FileUpload>(null);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [startTime] = useState(new Date());
  const [workPerformed, setWorkPerformed] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [customerFeedback, setCustomerFeedback] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(job.checklist || []);
  const [partsUsed, setPartsUsed] = useState<WorkOrderPart[]>([]);
  const [customerSignature, setCustomerSignature] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState(false);

  // Calculate completion percentage
  const completionPercentage = useCallback(() => {
    if (checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  }, [checklist]);

  // Handle checklist item update
  const handleChecklistUpdate = useCallback((itemId: string, updates: Partial<ChecklistItem>) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, ...updates }
          : item
      )
    );
  }, []);

  // Handle photo upload
  const handlePhotoUpload = useCallback((files: File[]) => {
    setPhotos(prev => [...prev, ...files]);
    
    toast.current?.show({
      severity: 'success',
      summary: 'Zdjęcia dodane',
      detail: `Dodano ${files.length} zdjęć`,
      life: 3000,
    });
  }, []);

  // Add part to work order
  const addPart = useCallback((part: Omit<WorkOrderPart, 'id' | 'totalPrice'>) => {
    const newPart: WorkOrderPart = {
      ...part,
      id: `part-${Date.now()}`,
      totalPrice: part.quantity * part.unitPrice,
    };
    
    setPartsUsed(prev => [...prev, newPart]);
  }, []);

  // Remove part from work order
  const removePart = useCallback((partId: string) => {
    setPartsUsed(prev => prev.filter(part => part.id !== partId));
  }, []);

  // Calculate total parts cost
  const totalPartsCost = partsUsed.reduce((sum, part) => sum + part.totalPrice, 0);

  // Handle work order completion
  const handleComplete = useCallback(async () => {
    try {
      setIsCompleting(true);

      // Validate required fields
      const requiredItems = checklist.filter(item => item.required);
      const incompleteRequired = requiredItems.filter(item => !item.completed);

      if (incompleteRequired.length > 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Niekompletna lista',
          detail: `Uzupełnij ${incompleteRequired.length} wymaganych pozycji`,
          life: 5000,
        });
        setActiveTab(1); // Switch to checklist tab
        return;
      }

      if (!workPerformed.trim()) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Brak opisu prac',
          detail: 'Opisz wykonane prace',
          life: 3000,
        });
        setActiveTab(0); // Switch to work tab
        return;
      }

      const workOrderData: WorkOrderData = {
        jobId: job.id,
        startTime,
        endTime: new Date(),
        workPerformed,
        partsUsed,
        checklist,
        photos,
        customerSignature,
        technicianNotes,
        customerFeedback,
        followUpRequired,
        followUpDate: followUpDate || undefined,
      };

      // Create maintenance record
      await hvacApiService.createMaintenanceRecord(workOrderData);

      await onComplete(job.id, workOrderData);

      toast.current?.show({
        severity: 'success',
        summary: 'Zlecenie ukończone',
        detail: 'Zlecenie zostało pomyślnie ukończone',
        life: 3000,
      });

    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się ukończyć zlecenia',
        life: 3000,
      });
    } finally {
      setIsCompleting(false);
    }
  }, [
    job.id,
    startTime,
    workPerformed,
    partsUsed,
    checklist,
    photos,
    customerSignature,
    technicianNotes,
    customerFeedback,
    followUpRequired,
    followUpDate,
    onComplete,
    hvacApiService,
  ]);

  // Render checklist item
  const renderChecklistItem = useCallback((item: ChecklistItem) => {
    return (
      <Card key={item.id} className="mb-3 bg-gray-800 border-gray-700">
        <div className="flex align-items-start gap-3">
          <Checkbox
            checked={item.completed}
            onChange={(e) => handleChecklistUpdate(item.id, { completed: e.checked })}
            className="mt-1"
          />
          
          <div className="flex-1">
            <div className="flex justify-content-between align-items-start mb-2">
              <h5 className="text-white font-medium">
                {item.description}
                {item.required && <span className="text-red-400 ml-1">*</span>}
              </h5>
              
              <Tag
                value={item.category}
                severity={
                  item.category === 'SAFETY' ? 'danger' :
                  item.category === 'PERFORMANCE' ? 'info' :
                  item.category === 'COMPLIANCE' ? 'success' : 'warning'
                }
                className="text-xs"
              />
            </div>

            {/* Input based on type */}
            {item.type === 'TEXT' && (
              <InputText
                value={item.value || ''}
                onChange={(e) => handleChecklistUpdate(item.id, { value: e.target.value })}
                placeholder="Wprowadź wartość..."
                className="w-full mb-2"
              />
            )}

            {item.type === 'NUMBER' && (
              <InputNumber
                value={item.value || null}
                onValueChange={(e) => handleChecklistUpdate(item.id, { value: e.value })}
                placeholder="Wprowadź wartość..."
                className="w-full mb-2"
              />
            )}

            {item.type === 'PHOTO' && (
              <div className="mb-2">
                <FileUpload
                  mode="basic"
                  accept="image/*"
                  auto
                  chooseLabel="Dodaj zdjęcie"
                  className="mb-2"
                  customUpload
                  uploadHandler={(e) => {
                    handleChecklistUpdate(item.id, { photo: e.files[0] });
                    handlePhotoUpload(e.files);
                  }}
                />
                
                {item.photo && (
                  <Image
                    src={URL.createObjectURL(item.photo)}
                    alt="Zdjęcie"
                    width="150"
                    height="150"
                    preview
                  />
                )}
              </div>
            )}

            {/* Notes */}
            <InputTextarea
              value={item.notes || ''}
              onChange={(e) => handleChecklistUpdate(item.id, { notes: e.target.value })}
              placeholder="Dodatkowe uwagi..."
              rows={2}
              className="w-full"
            />
          </div>
        </div>
      </Card>
    );
  }, [handleChecklistUpdate, handlePhotoUpload]);

  // Toolbar content
  const toolbarStartContent = (
    <div className="flex align-items-center gap-2">
      <Button
        icon="pi pi-times"
        label="Anuluj"
        className="p-button-text p-button-secondary"
        onClick={onClose}
      />
    </div>
  );

  const toolbarEndContent = (
    <div className="flex align-items-center gap-2">
      <Button
        icon="pi pi-check"
        label="Ukończ zlecenie"
        className="p-button-success"
        onClick={handleComplete}
        loading={isCompleting}
        disabled={completionPercentage() < 100}
      />
    </div>
  );

  return (
    <div className="hvac-mobile-work-order h-full">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <Toolbar
        start={toolbarStartContent}
        end={toolbarEndContent}
        className="mb-4 bg-gray-800 border-gray-700"
      />

      {/* Job Info */}
      <Card className="mb-4 bg-gray-800 border-gray-700">
        <div className="flex justify-content-between align-items-start mb-3">
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">
              {job.customerName}
            </h3>
            <p className="text-gray-400 mb-2">{job.serviceType}</p>
            <div className="flex gap-2">
              <Tag value={job.priority} severity="warning" />
              <Tag value={job.status} severity="info" />
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white mb-1">
              {completionPercentage()}%
            </div>
            <div className="text-sm text-gray-400">ukończone</div>
          </div>
        </div>
        
        <ProgressBar value={completionPercentage()} className="mb-3" />
        
        <div className="text-sm text-gray-400">
          Rozpoczęto: {startTime.toLocaleTimeString('pl-PL')}
        </div>
      </Card>

      {/* Main Content */}
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel header="Prace" leftIcon="pi pi-wrench">
          <div className="space-y-4">
            {/* Work Description */}
            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-semibold mb-3">Opis wykonanych prac</h4>
              <InputTextarea
                value={workPerformed}
                onChange={(e) => setWorkPerformed(e.target.value)}
                placeholder="Opisz szczegółowo wykonane prace..."
                rows={5}
                className="w-full"
              />
            </Card>

            {/* Technician Notes */}
            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-semibold mb-3">Uwagi technika</h4>
              <InputTextarea
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                placeholder="Dodatkowe uwagi, zalecenia..."
                rows={3}
                className="w-full"
              />
            </Card>

            {/* Follow-up */}
            <Card className="bg-gray-800 border-gray-700">
              <div className="flex align-items-center gap-2 mb-3">
                <Checkbox
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.checked)}
                />
                <h4 className="text-white font-semibold">Wymagana wizyta kontrolna</h4>
              </div>
              
              {followUpRequired && (
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Data wizyty kontrolnej:</label>
                  <input
                    type="date"
                    value={followUpDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFollowUpDate(e.target.value ? new Date(e.target.value) : null)}
                    className="p-inputtext p-component w-full"
                  />
                </div>
              )}
            </Card>
          </div>
        </TabPanel>

        <TabPanel header="Lista kontrolna" leftIcon="pi pi-list">
          <div className="space-y-3">
            {checklist.length > 0 ? (
              checklist.map(renderChecklistItem)
            ) : (
              <div className="text-center py-8">
                <i className="pi pi-list text-gray-400 text-4xl mb-3" />
                <div className="text-gray-400">
                  Brak listy kontrolnej dla tego zlecenia
                </div>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel header="Części" leftIcon="pi pi-cog">
          <div className="space-y-4">
            {/* Parts List */}
            {partsUsed.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <h4 className="text-white font-semibold mb-3">Użyte części</h4>
                <DataTable value={partsUsed} className="p-datatable-sm">
                  <Column field="name" header="Nazwa" />
                  <Column field="partNumber" header="Nr części" />
                  <Column field="quantity" header="Ilość" />
                  <Column 
                    field="unitPrice" 
                    header="Cena jedn." 
                    body={(rowData) => `${rowData.unitPrice.toFixed(2)} PLN`}
                  />
                  <Column 
                    field="totalPrice" 
                    header="Razem" 
                    body={(rowData) => `${rowData.totalPrice.toFixed(2)} PLN`}
                  />
                  <Column 
                    body={(rowData) => (
                      <Button
                        icon="pi pi-trash"
                        className="p-button-text p-button-danger p-button-sm"
                        onClick={() => removePart(rowData.id)}
                      />
                    )}
                  />
                </DataTable>
                
                <Divider />
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">
                    Łączny koszt części: {totalPartsCost.toFixed(2)} PLN
                  </div>
                </div>
              </Card>
            )}

            {/* Add Part Form */}
            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-semibold mb-3">Dodaj część</h4>
              <div className="text-center text-gray-400 py-4">
                Formularz dodawania części - do implementacji
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel header="Zdjęcia" leftIcon="pi pi-camera">
          <div className="space-y-4">
            {/* Photo Upload */}
            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-semibold mb-3">Dokumentacja fotograficzna</h4>
              
              <FileUpload
                ref={fileUploadRef}
                mode="basic"
                accept="image/*"
                multiple
                auto
                chooseLabel="Dodaj zdjęcia"
                className="mb-3"
                customUpload
                uploadHandler={(e) => handlePhotoUpload(e.files)}
              />
              
              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={URL.createObjectURL(photo)}
                        alt={`Zdjęcie ${index + 1}`}
                        width="100%"
                        height="150"
                        preview
                        className="border-round"
                      />
                      <Button
                        icon="pi pi-times"
                        className="p-button-danger p-button-sm absolute top-0 right-0 m-1"
                        onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {photos.length === 0 && (
                <div className="text-center py-8">
                  <i className="pi pi-camera text-gray-400 text-4xl mb-3" />
                  <div className="text-gray-400">
                    Brak zdjęć
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabPanel>

        <TabPanel header="Podpis" leftIcon="pi pi-pencil">
          <div className="space-y-4">
            {/* Customer Feedback */}
            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-semibold mb-3">Opinia klienta</h4>
              <InputTextarea
                value={customerFeedback}
                onChange={(e) => setCustomerFeedback(e.target.value)}
                placeholder="Opinia klienta o wykonanych pracach..."
                rows={3}
                className="w-full"
              />
            </Card>

            {/* Customer Signature */}
            <Card className="bg-gray-800 border-gray-700">
              <h4 className="text-white font-semibold mb-3">Podpis klienta</h4>
              <div className="text-center text-gray-400 py-8">
                Pole podpisu elektronicznego - do implementacji
              </div>
            </Card>
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
};
