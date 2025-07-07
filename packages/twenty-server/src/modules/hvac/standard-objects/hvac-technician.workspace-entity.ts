import { msg } from '@lingui/macro';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNotAuditLogged } from 'src/engine/twenty-orm/decorators/workspace-is-not-audit-logged.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';
import { FieldMetadataType } from 'twenty-shared/types';

@WorkspaceEntity({
  standardId: 'hvac-technician',
  namePlural: 'hvacTechnicians',
  labelSingular: msg`HVAC Technician`,
  labelPlural: msg`HVAC Technicians`,
  description: msg`HVAC service technicians`,
  icon: 'IconUser',
})
@WorkspaceIsSystem()
@WorkspaceIsNotAuditLogged()
export class HvacTechnicianWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: 'firstName',
    type: FieldMetadataType.TEXT,
    label: msg`First Name`,
    description: msg`Technician first name`,
    icon: 'IconUser',
  })
  firstName: string;

  @WorkspaceField({
    standardId: 'lastName',
    type: FieldMetadataType.TEXT,
    label: msg`Last Name`,
    description: msg`Technician last name`,
    icon: 'IconUser',
  })
  lastName: string;

  @WorkspaceField({
    standardId: 'email',
    type: FieldMetadataType.EMAIL,
    label: msg`Email`,
    description: msg`Technician email address`,
    icon: 'IconMail',
  })
  email: string;

  @WorkspaceField({
    standardId: 'phone',
    type: FieldMetadataType.PHONE,
    label: msg`Phone`,
    description: msg`Technician phone number`,
    icon: 'IconPhone',
  })
  phone: string;

  @WorkspaceField({
    standardId: 'employeeId',
    type: FieldMetadataType.TEXT,
    label: msg`Employee ID`,
    description: msg`Unique employee identifier`,
    icon: 'IconHash',
  })
  employeeId: string;

  @WorkspaceField({
    standardId: 'specialization',
    type: FieldMetadataType.SELECT,
    label: msg`Specialization`,
    description: msg`Technician specialization`,
    icon: 'IconTool',
    options: [
      { value: 'hvac_general', label: 'HVAC General', position: 0, color: 'blue' },
      { value: 'heating', label: 'Heating', position: 1, color: 'red' },
      { value: 'cooling', label: 'Cooling', position: 2, color: 'blue' },
      { value: 'ventilation', label: 'Ventilation', position: 3, color: 'green' },
      { value: 'refrigeration', label: 'Refrigeration', position: 4, color: 'purple' },
    ],
    defaultValue: "'hvac_general'",
  })
  specialization: string;

  @WorkspaceField({
    standardId: 'status',
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Technician status`,
    icon: 'IconCircleDot',
    options: [
      { value: 'active', label: 'Active', position: 0, color: 'green' },
      { value: 'on_leave', label: 'On Leave', position: 1, color: 'yellow' },
      { value: 'inactive', label: 'Inactive', position: 2, color: 'red' },
    ],
    defaultValue: "'active'",
  })
  status: string;

  @WorkspaceField({
    standardId: 'hireDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Hire Date`,
    description: msg`Technician hire date`,
    icon: 'IconCalendar',
  })
  hireDate: Date;

  @WorkspaceField({
    standardId: 'certifications',
    type: FieldMetadataType.TEXT,
    label: msg`Certifications`,
    description: msg`Technician certifications`,
    icon: 'IconCertificate',
  })
  certifications: string;

  @WorkspaceField({
    standardId: 'hourlyRate',
    type: FieldMetadataType.NUMBER,
    label: msg`Hourly Rate`,
    description: msg`Technician hourly rate`,
    icon: 'IconCurrencyDollar',
  })
  hourlyRate: number;
}
