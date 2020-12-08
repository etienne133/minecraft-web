import { pbkdf2Sync, randomBytes } from 'crypto';
import { mongoFind, updateOne } from '../repositories';
import { User } from '../user';
import { logIntoDB } from '../util/logging';

export const SALT_LENGTH = 16;
export const ITERATIONS = 10000;
export const ENCODING = 'base64';

export interface AuthSettings {
  lockoutSeconds: number;
  maxAttempts: number;
  expiryTimeMS: number;
}

export interface PasswordSettings {
  min: number;
  max: number;
  /** Whether there must be an upper and lower case */
  enforceCase: boolean;
  /** Whether there must be a special character  */
  enforceSpChar: boolean;
  enforceDigit: boolean;
  /** How many old passwords are registered and blocked */
  blockedPasswordHistory: number;
}

const CONFIG = 'config';
const USER = 'user';
const AUTH_NAME = 'auth';
const PW_NAME = 'password'

const CASE_REGEX_LOWER = /[a-z]/;
const CASE_REGEX_UPPER = /[A-Z]/;
const SP_REGEX = /[$&+,:;=?@#|'<>.^*()%!-]/;
const DIGIT_REGEX = /[0-9]/;

export class AuthManager {
  static async getPasswordSettings(): Promise<PasswordSettings> {
    const configEntry = await mongoFind({ name: PW_NAME }, CONFIG) as { metadata: PasswordSettings };
    const pws = configEntry.metadata;

    return pws;
  }

  static generateSalt(): string {
    return randomBytes(SALT_LENGTH).toString(ENCODING);
  }

  static hashPasswordWithSalt(password: string, salt: string) {
    const hashedPassword = pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512').toString(ENCODING);
    return hashedPassword
  }

  static async validatePassword(password: string, oldPasswords: { hash: string; salt: string }[] = []): Promise<boolean> {
    const settings = await this.getPasswordSettings();

    if (password.length < settings.min || password.length > settings.max) {
      console.warn(`Needs to be between ${settings.min} and ${settings.max}.`)
      return false;
    }

    if (settings.enforceCase) {
      if (!(CASE_REGEX_LOWER.test(password) && CASE_REGEX_UPPER.test(password))) {
        console.warn('Needs both an upper and lower case');
        return false;
      }
    }

    if (settings.enforceSpChar) {
      if (!(SP_REGEX.test(password))) {
        console.warn('Needs a special character');
        return false;
      }
    }

    // digit
    if (settings.enforceDigit) {
      if (!(DIGIT_REGEX.test(password))) {
        console.warn('Needs a digit');
        return false;
      }
    }

    // password is not in history
    if(settings.blockedPasswordHistory && oldPasswords.length) {
      for (let i = oldPasswords.length - 1; i >= 0 && i >= oldPasswords.length - settings.blockedPasswordHistory; i--) {
        if (this.hashPasswordWithSalt(password, oldPasswords[i].salt) === oldPasswords[i].hash) {
          console.warn('Password already used');
          return false;
        }
      }
    }

    return true;
  }

  static async lockout(user: User): Promise<void> {
    const config = await mongoFind({ name: AUTH_NAME }, CONFIG) as { metadata: AuthSettings };
    const time = config.metadata.lockoutSeconds;
    user.timeout = new Date().getTime() + (time * 1000);
    updateOne(user._id, user, USER);
  }

  static async tryToBlock(user: User): Promise<void> {
    const config = await mongoFind({ name: AUTH_NAME }, CONFIG) as { metadata: AuthSettings };
    const max = config.metadata.maxAttempts;
    if (user.failedAttempts >= max) {
      user.blocked = true;
      updateOne(user._id, user, USER);
    }
  }

  static async setUserPasswordExpiry(): Promise<number> {
    const config = await mongoFind({ name: AUTH_NAME }, CONFIG) as { metadata: AuthSettings };
    //const expire = Number(config.metadata.expiryTimeMS);

    return (new Date().getTime() + 2.592e+9);
  }

  static async updateAuthSettings(settings: Partial<AuthSettings>): Promise<void> {
    const authConfig = await mongoFind({ name: AUTH_NAME }, CONFIG) as { _id: string; metadata: AuthSettings };
    const auth = authConfig.metadata;

    auth.maxAttempts = settings.maxAttempts || auth.maxAttempts;
    auth.lockoutSeconds = settings.lockoutSeconds || auth.lockoutSeconds;

    authConfig.metadata = auth;
    const result = await updateOne(authConfig._id, authConfig, CONFIG);
    if (result.modifiedCount) {
      logIntoDB(`config: Auth - (Request to change auth configs) Successfully changed authentification configurations`);
    } else {
      logIntoDB(`config: Auth - (Request to change auth configs) The authentification configurations were not changed`);
    }
  }

  static async updatePassSettings(settings: Partial<PasswordSettings>): Promise<void> {
    const passConfig = await mongoFind({ name: PW_NAME }, CONFIG) as { _id: string; metadata: PasswordSettings };
    const pass = passConfig.metadata;

    pass.min = settings.min || pass.min;
    pass.max = settings.max || pass.max;
    pass.enforceCase = settings.enforceCase || pass.enforceCase;
    pass.enforceSpChar = settings.enforceSpChar || pass.enforceSpChar;
    pass.enforceDigit = settings.enforceDigit || pass.enforceDigit;
    pass.blockedPasswordHistory = settings.blockedPasswordHistory || pass.blockedPasswordHistory;

    passConfig.metadata = pass;
    const result = await updateOne(passConfig._id, passConfig, CONFIG);
    if (result.modifiedCount) {
      logIntoDB(`config: Password - (Request to change pass configs) Successfully changed password configurations`);
    } else {
      logIntoDB(`config: Password - (Request to change pass configs) The password configurations were not changed`);
    }
  }
}
