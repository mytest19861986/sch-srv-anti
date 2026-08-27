import { appLogger } from "../observability/logger.service";

export type QueryOperation = "READ" | "WRITE";

export interface DatabaseRouterConfig {
  useReadReplica: boolean;
  primaryUrl: string;
  replicaUrl?: string;
  maxAllowedLagSeconds: number;
}

export class DatabaseRouter {
  private useReadReplica: boolean;
  private primaryUrl: string;
  private replicaUrl?: string;
  private maxAllowedLagSeconds: number;
  private lastReportedLagSeconds = 0;

  constructor(config?: Partial<DatabaseRouterConfig>) {
    this.useReadReplica = config?.useReadReplica ?? (process.env.USE_READ_REPLICA === "true");
    this.primaryUrl = config?.primaryUrl ?? (process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/school_transport");
    this.replicaUrl = config?.replicaUrl ?? (process.env.DATABASE_REPLICA_URL || undefined);
    this.maxAllowedLagSeconds = config?.maxAllowedLagSeconds ?? 5;

    appLogger.info(
      `[DatabaseRouter] Initialized router (useReadReplica: ${this.useReadReplica}, replicaConfigured: ${!!this.replicaUrl})`
    );
  }

  getTargetConnection(operation: QueryOperation): string {
    if (operation === "WRITE") {
      return this.primaryUrl;
    }

    // READ operation routing
    if (this.useReadReplica && this.replicaUrl) {
      if (this.lastReportedLagSeconds <= this.maxAllowedLagSeconds) {
        return this.replicaUrl;
      }
      appLogger.warn(
        `[DatabaseRouter] Replica lag (${this.lastReportedLagSeconds}s) exceeds threshold (${this.maxAllowedLagSeconds}s). Falling back to Primary.`
      );
    }

    return this.primaryUrl;
  }

  updateReplicaLag(lagSeconds: number) {
    this.lastReportedLagSeconds = lagSeconds;
  }

  isReplicaActive(): boolean {
    return this.useReadReplica && !!this.replicaUrl && this.lastReportedLagSeconds <= this.maxAllowedLagSeconds;
  }
}

export const dbRouter = new DatabaseRouter();
