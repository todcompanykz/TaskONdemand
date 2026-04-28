import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  info() {
    return {
      service: 'TaskOnDemand API',
      routes: {
        self: '/api/',
        health: '/api/health',
        metrics: '/api/metrics',
        auth: '/api/auth',
        tasks: '/api/tasks',
        users: '/api/users',
        admin: '/api/admin',
      },
      direct: {
        health: '/health',
        metrics: '/metrics',
      },
    };
  }
}
