import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

export interface FCMNotificationPayload {
  title: string;
  body: string;
  data?: {
    id?: string;
    type?: string;
    taskId?: string;
    actionUrl?: string;
    [key: string]: any;
  };
}

@Injectable()
export class FCMService {
  private readonly logger = new Logger(FCMService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
      const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');

      if (serviceAccountPath) {
        // Initialize from service account file
        const serviceAccount = require(serviceAccountPath);
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.logger.log('Firebase Admin initialized from service account file');
      } else if (serviceAccountJson) {
        // Initialize from JSON string (for Docker/cloud deployments)
        const serviceAccount = JSON.parse(serviceAccountJson);
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.logger.log('Firebase Admin initialized from JSON string');
      } else {
        this.logger.warn('Firebase service account not configured. Push notifications will not work.');
        this.logger.warn('Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON environment variable');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin:', error);
    }
  }

  async sendNotification(
    userId: string,
    payload: FCMNotificationPayload,
  ): Promise<boolean> {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fcm.service.ts:sendNotification:entry',message:'sendNotification called',data:{userId,title:payload.title,hasFirebaseApp:!!this.firebaseApp},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    } catch(e) {}
    this.logger.log(`[DEBUG] sendNotification called: userId=${userId}, hasFirebaseApp=${!!this.firebaseApp}`);
    // #endregion

    if (!this.firebaseApp) {
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fcm.service.ts:sendNotification:noFirebase',message:'Firebase not initialized',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
      this.logger.warn('Firebase not initialized. Cannot send notification.');
      return false;
    }

    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fcm.service.ts:sendNotification:userFound',message:'user lookup result',data:{userId,userFound:!!user,hasFcmToken:!!user?.fcmToken,fcmTokenLength:user?.fcmToken?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      } catch(e) {}
      this.logger.log(`[DEBUG] User lookup: found=${!!user}, hasFcmToken=${!!user?.fcmToken}`);
      // #endregion

      if (!user || !user.fcmToken) {
        // #region agent log
        try {
          fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fcm.service.ts:sendNotification:noToken',message:'user has no FCM token',data:{userId,userFound:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        } catch(e) {}
        // #endregion
        this.logger.debug(`User ${userId} has no FCM token`);
        return false;
      }

      const message: admin.messaging.Message = {
        token: user.fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data
          ? Object.entries(payload.data).reduce((acc, [key, value]) => {
              acc[key] = String(value);
              return acc;
            }, {} as Record<string, string>)
          : {},
        android: {
          priority: 'high' as const,
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
        },
      };

      const response = await admin.messaging().send(message);
      
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fcm.service.ts:sendNotification:success',message:'FCM notification sent successfully',data:{userId,response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
      
      this.logger.log(`Successfully sent FCM notification to user ${userId}: ${response}`);
      return true;
    } catch (error) {
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fcm.service.ts:sendNotification:error',message:'FCM notification failed',data:{userId,errorCode:error?.code,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
      
      this.logger.error(`Failed to send FCM notification to user ${userId}:`, error);
      
      // If token is invalid, remove it from database
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (user) {
          user.fcmToken = null;
          await this.usersRepository.save(user);
          this.logger.log(`Removed invalid FCM token for user ${userId}`);
        }
      }
      
      return false;
    }
  }

  async sendNotificationToMultiple(
    userIds: string[],
    payload: FCMNotificationPayload,
  ): Promise<{ success: number; failed: number }> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Cannot send notifications.');
      return { success: 0, failed: userIds.length };
    }

    let success = 0;
    let failed = 0;

    await Promise.all(
      userIds.map(async (userId) => {
        const result = await this.sendNotification(userId, payload);
        if (result) {
          success++;
        } else {
          failed++;
        }
      }),
    );

    return { success, failed };
  }
}
