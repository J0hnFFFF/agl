import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: { name: string; email: string; password: string }) {
    // Generate API key
    const apiKey = this.generateApiKey();

    // Create client
    const client = await this.prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        apiKey,
        tier: 'FREE',
        quotaPerMonth: 10000,
      },
    });

    // Generate JWT
    const token = this.jwtService.sign({
      sub: client.id,
      email: client.email,
    });

    return {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        tier: client.tier,
      },
      apiKey: client.apiKey,
      token,
    };
  }

  async login(data: { email: string; password: string }) {
    // Find client
    const client = await this.prisma.client.findUnique({
      where: { email: data.email },
    });

    if (!client) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const token = this.jwtService.sign({
      sub: client.id,
      email: client.email,
    });

    return {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        tier: client.tier,
      },
      apiKey: client.apiKey,
      token,
    };
  }

  async verifyApiKey(apiKey: string) {
    const client = await this.prisma.client.findUnique({
      where: { apiKey },
    });

    if (!client || !client.isActive) {
      throw new UnauthorizedException('Invalid API key');
    }

    return {
      valid: true,
      client: {
        id: client.id,
        name: client.name,
        tier: client.tier,
      },
    };
  }

  private generateApiKey(): string {
    return `agl_${crypto.randomBytes(32).toString('hex')}`;
  }
}
