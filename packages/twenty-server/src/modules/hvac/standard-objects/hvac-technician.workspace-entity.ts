import { Relation } from 'src/engine/workspace-manager/workspace-sync-metadata/interfaces/relation.interface';

import { FieldMetadataType } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { RelationMetadataType } from 'src/engine/metadata-modules/relation-metadata/relation-metadata.entity';
import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNotAuditLogged } from 'src/engine/twenty-orm/decorators/workspace-is-not-audit-logged.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';

@WorkspaceEntity({
  standardId: 'hvac-technician',
  namePlural: 'hvacTechnicians',
  labelSingular: 'HVAC Technician',
  labelPlural: 'HVAC Technicians',
  description: 'HVAC service technicians',
  icon: 'IconUser',
})
@WorkspaceIsSystem()
@WorkspaceIsNotAuditLogged()
export class HvacTechnicianWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: 'firstName',
    type: FieldMetadataType.TEXT,
    label: 'First Name',
    description: 'Technician first name',
    icon: 'IconUser',
  })
  firstName: string;

  @WorkspaceField({
    standardId: 'lastName',
    type: FieldMetadataType.TEXT,
    label: 'Last Name',
    description: 'Technician last name',
    icon: 'IconUser',
  })
  lastName: string;

  @WorkspaceField({
    standardId: 'email',
    type: FieldMetadataType.EMAIL,
    label: 'Email',
    description: 'Technician email address',
    icon: 'IconMail',
  })
  email: string;

  @WorkspaceField({
    standardId: 'phone',
    type: FieldMetadataType.PHONE,
    label: 'Phone',
    description: 'Technician phone number',
    icon: 'IconPhone',
  })
  phone: string;

  @WorkspaceField({
    standardId: 'employeeId',
    type: FieldMetadataType.TEXT,
    label: 'Employee ID',
    description: 'Unique employee identifier',
    icon: 'IconHash',
  })
  employeeId: string;

  @WorkspaceField({
    standardId: 'specialization',
    type: FieldMetadataType.SELECT,
    label: 'Specialization',
    description: 'Technician specialization',
    icon: 'IconTool',
    options: [
      { value: 'hvac_general', label: 'HVAC General', position: 0, color: 'blue' },
      { value: 'heating', label: 'Heating', position: 1, color: 'red' },
      { value: 'cooling', label: 'Cooling', position: 2, color: 'cyan' },
      { value: 'ventilation', label: 'Ventilation', position: 3, color: 'green' },
      { value: 'refrigeration', label: 'Refrigeration', position: 4, color: 'purple' },
    ],
    defaultValue: 'hvac_general',
  })
  specialization: string;

  @WorkspaceField({
    standardId: 'status',
    type: FieldMetadataType.SELECT,
    label: 'Status',
    description: 'Technician status',
    icon: 'IconCircleDot',
    options: [
      { value: 'active', label: 'Active', position: 0, color: 'green' },
      { value: 'on_leave', label: 'On Leave', position: 1, color: 'yellow' },
      { value: 'inactive', label: 'Inactive', position: 2, color: 'red' },
    ],
    defaultValue: 'active',
  })
  status: string;

  @WorkspaceField({
    standardId: 'hireDate',
    type: FieldMetadataType.DATE_TIME,
    label: 'Hire Date',
    description: 'Technician hire date',
    icon: 'IconCalendar',
  })
  hireDate: Date;

  @WorkspaceField({
    standardId: 'certifications',
    type: FieldMetadataType.TEXT,
    label: 'Certifications',
    description: 'Technician certifications',
    icon: 'IconCertificate',
  })
  certifications: string;

  @WorkspaceField({
    standardId: 'hourlyRate',
    type: FieldMetadataType.NUMBER,
    label: 'Hourly Rate',
    description: 'Technician hourly rate',
    icon: 'IconCurrencyDollar',
  })
  hourlyRate: number;
}
