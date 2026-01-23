import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_notification_settings')
export class UserNotificationSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // System notifications (cannot be fully disabled)
  @Column({ type: 'boolean', default: true })
  loginFromNewDevice: boolean; // Вход в аккаунт с нового устройства

  @Column({ type: 'boolean', default: true })
  passwordChange: boolean; // Смена пароля

  @Column({ type: 'boolean', default: true })
  securityErrors: boolean; // Ошибки безопасности

  @Column({ type: 'boolean', default: true })
  accountBlocked: boolean; // Блокировка / восстановление аккаунта

  // Account and profile
  @Column({ type: 'boolean', default: true })
  profileChanges: boolean; // Изменения данных профиля

  @Column({ type: 'boolean', default: true })
  actionConfirmation: boolean; // Подтверждение действий

  @Column({ type: 'boolean', default: true })
  sessionExpiration: boolean; // Истечение сессии

  // Work/Service notifications
  @Column({ type: 'boolean', default: true })
  newMessages: boolean; // Новые сообщения

  @Column({ type: 'boolean', default: true })
  newTasks: boolean; // Новые заявки / заказы

  @Column({ type: 'boolean', default: true })
  taskStatusChange: boolean; // Изменение статуса задачи

  @Column({ type: 'boolean', default: true })
  taskComments: boolean; // Ответы или комментарии

  @Column({ type: 'boolean', default: true })
  executorAssigned: boolean; // Назначение исполнителя

  @Column({ type: 'boolean', default: true })
  supportReplies: boolean; // Ответы от поддержки

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
