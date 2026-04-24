import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TaskUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TaskStatus {
  CREATED = 'created',
  CLAIMED = 'claimed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('tasks')
@Index(['geoPoint'], { spatial: true })
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  shortDescription: string;

  @Column('text')
  fullDescription: string;

  @Column('text', { array: true, default: '{}' })
  photoUrls: string[];

  @Column('int')
  reward: number; // KZT, divisible by 5 only

  @Column()
  city: string; // City name (e.g., "Астана")

  @Column()
  address: string; // Full address

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'geoPoint', // Explicit column name to match database
  })
  geoPoint: string; // PostGIS Point (longitude, latitude) - calculated from city/address

  @Column({
    type: 'enum',
    enum: TaskUrgency,
    default: TaskUrgency.MEDIUM,
  })
  urgency: TaskUrgency;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.CREATED,
  })
  status: TaskStatus;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'uuid', nullable: true })
  claimedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'claimedById' })
  claimedBy: User | null;

  @Column({ type: 'boolean', default: false })
  customerConfirmed: boolean;

  @Column({ type: 'boolean', default: false })
  executorConfirmed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // 24h after creation
}
