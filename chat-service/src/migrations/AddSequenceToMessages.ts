import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSequenceToMessages implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add sequence column
    await queryRunner.addColumn(
      'messages',
      new TableColumn({
        name: 'sequence',
        type: 'bigint',
        isNullable: true,
      }),
    );

    // Create index for faster queries
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_chatId_sequence" ON messages ("chatId", "sequence")`,
    );

    console.log('✅ Added sequence column and index to messages table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index first
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_messages_chatId_sequence"`,
    );

    // Drop column
    await queryRunner.dropColumn('messages', 'sequence');

    console.log('✅ Removed sequence column from messages table');
  }
}