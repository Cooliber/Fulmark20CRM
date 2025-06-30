import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('HvacEquipmentSummary')
export class HvacEquipmentSummaryType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  type: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  lastMaintenance?: Date;

  @Field({ nullable: true })
  nextMaintenance?: Date;
}

@ObjectType('HvacProperty')
export class HvacPropertyType {
  @Field(() => ID)
  id: string;

  @Field()
  address: string;

  @Field()
  propertyType: string;

  @Field(() => [HvacEquipmentSummaryType], { nullable: 'itemsAndList' })
  equipmentList?: HvacEquipmentSummaryType[];
}

@ObjectType('HvacCustomerAddress')
export class HvacCustomerAddressType {
  @Field({ nullable: true })
  street?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  postalCode?: string;

  @Field({ nullable: true })
  country?: string;
}

@ObjectType('HvacCustomer')
export class HvacCustomerType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => HvacCustomerAddressType, { nullable: true })
  address?: HvacCustomerAddressType;

  @Field(() => [HvacPropertyType], { nullable: 'itemsAndList' })
  properties?: HvacPropertyType[];
}
