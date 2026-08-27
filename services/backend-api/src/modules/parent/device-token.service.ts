export interface DeviceTokenRecord {
  id: string;
  tenantId: string;
  parentId: string;
  token: string;
  platform: 'ANDROID' | 'IOS' | 'WEB';
  createdAt: Date;
  lastUsedAt: Date;
}

export interface RegisterDeviceDto {
  token: string;
  platform: 'ANDROID' | 'IOS' | 'WEB';
}

export class InMemoryDeviceTokenRepository {
  private tokens: DeviceTokenRecord[] = [];

  async registerToken(
    tenantId: string,
    parentId: string,
    token: string,
    platform: 'ANDROID' | 'IOS' | 'WEB'
  ): Promise<DeviceTokenRecord> {
    const existingIndex = this.tokens.findIndex(
      t => t.parentId === parentId && t.token === token
    );

    if (existingIndex >= 0) {
      this.tokens[existingIndex].lastUsedAt = new Date();
      this.tokens[existingIndex].platform = platform;
      return this.tokens[existingIndex];
    }

    const newRecord: DeviceTokenRecord = {
      id: `dev-${Math.random().toString(36).substring(2, 10)}`,
      tenantId,
      parentId,
      token,
      platform,
      createdAt: new Date(),
      lastUsedAt: new Date()
    };

    this.tokens.push(newRecord);
    return newRecord;
  }

  async deleteToken(tenantId: string, parentId: string, deviceId: string): Promise<boolean> {
    const initialLen = this.tokens.length;
    this.tokens = this.tokens.filter(
      t => !(t.id === deviceId && t.parentId === parentId && t.tenantId === tenantId)
    );
    return this.tokens.length < initialLen;
  }

  async getTokensForParents(tenantId: string, parentIds: string[]): Promise<DeviceTokenRecord[]> {
    const parentSet = new Set(parentIds);
    return this.tokens.filter(t => t.tenantId === tenantId && parentSet.has(t.parentId));
  }

  async deleteDeadTokens(deadTokens: string[]): Promise<number> {
    if (!deadTokens || deadTokens.length === 0) return 0;
    const deadSet = new Set(deadTokens);
    const initialLen = this.tokens.length;
    this.tokens = this.tokens.filter(t => !deadSet.has(t.token));
    return initialLen - this.tokens.length;
  }

  async getAllTokens(): Promise<DeviceTokenRecord[]> {
    return [...this.tokens];
  }

  clear() {
    this.tokens = [];
  }
}
