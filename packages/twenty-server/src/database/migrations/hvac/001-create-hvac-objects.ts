import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHvacObjects1703000001 implements MigrationInterface {
  name = 'CreateHvacObjects1703000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This migration will be handled by the Twenty CRM metadata system
    // The HVAC workspace entities will be automatically created when the server starts
    // and the metadata sync process runs
    
    console.log('HVAC objects will be created by the metadata sync system');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback would be handled by removing the HVAC workspace entities
    // from the codebase and running the metadata sync
    
    console.log('HVAC objects rollback handled by metadata sync system');
  }
}
