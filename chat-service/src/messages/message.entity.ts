
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('messages')
@Index(['chatId', 'createdAt'])
@Index(['chatId', 'sequence'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  chatId: string;

  @Column()
  userId: string;

  @Column()
  username: string;

  @Column()
  displayName: string;

  @Column('text')
  content: string;

  @Column({ type: 'bigint', nullable: true })
  sequence: number;

  @CreateDateColumn()
  createdAt: Date;
}