import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'DRIVER' | 'PARENT';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive?: 'true' | 'false';
  createdAt?: Date;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<User>;
  listAll(): Promise<User[]>;
}

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  constructor() {
    this.seedDefaultUsers();
  }

  private seedDefaultUsers() {
    const defaultHash = '$2b$10$hrSM3.pKmMS6o9.3Ifa5AOBjZRecjPAQLiGE12bCjuuSoUZKQNYC2'; // Demo@1234
    const defaults: User[] = [
      { id: 'usr-super-admin-1', email: 'super-admin@platform.ir', role: 'SUPER_ADMIN', tenantId: 'system', fullName: 'راهبر کل پلتفرم', passwordHash: defaultHash, isActive: 'true' },
      { id: 'usr-school-admin-1', email: 'school-admin@demo.ir', role: 'SCHOOL_ADMIN', tenantId: 'tenant-school-mehr', fullName: 'مدیر دبستان مهر آفرین', passwordHash: defaultHash, isActive: 'true' },
      { id: 'usr-driver-1', email: 'driver@demo.ir', role: 'DRIVER', tenantId: 'tenant-school-mehr', fullName: 'علی رضایی (راننده)', passwordHash: defaultHash, isActive: 'true' },
      { id: 'usr-parent-1', email: 'parent@demo.ir', role: 'PARENT', tenantId: 'tenant-school-mehr', fullName: 'محمد تهرانی (ولی دانش‌آموز)', passwordHash: defaultHash, isActive: 'true' },
    ];
    for (const u of defaults) {
      this.users.set(u.id, u);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async create(user: User): Promise<User> {
    this.users.set(user.id, { ...user, isActive: user.isActive || 'true' });
    return user;
  }

  async listAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  clear() {
    this.users.clear();
  }
}

export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
}

export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly userRepo: IUserRepository,
    jwtSecret: string = 'super-secret-jwt-key-for-schools-fleet-12345'
  ) {
    this.jwtSecret = jwtSecret;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '8h' });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch (err) {
      throw new Error('INVALID_TOKEN');
    }
  }

  async login(
    emailOrDto: string | { email: string; password: string },
    passwordArg?: string
  ): Promise<{ access_token: string; user: Omit<User, 'passwordHash'> }> {
    let email: string;
    let password: string;

    if (typeof emailOrDto === 'object') {
      email = emailOrDto.email;
      password = emailOrDto.password;
    } else {
      email = emailOrDto;
      password = passwordArg!;
    }

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (user.isActive === 'false') {
      throw new Error('ACCOUNT_DISABLED');
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const token = this.generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      access_token: token,
      user: userWithoutPassword
    };
  }

  async register(user: { id: string; email: string; password: string; role: UserRole; tenantId: string; fullName?: string }): Promise<User> {
    const hash = await this.hashPassword(user.password);
    return this.userRepo.create({
      id: user.id,
      email: user.email,
      passwordHash: hash,
      fullName: user.fullName || user.email,
      role: user.role,
      tenantId: user.tenantId,
      isActive: 'true',
      createdAt: new Date()
    });
  }
}
