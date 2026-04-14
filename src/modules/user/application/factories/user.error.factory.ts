import { BaseErrorFactory } from '@modules/error/application/factories';

const USER_ERROR_CONFIGS = {
  duplicateEmail: (email: string) => ({
    code: 'USER_DUPLICATE_EMAIL',
    message: `Email ${email} já está em uso`,
    details: { email },
  }),
  duplicateCpf: (cpf: string) => ({
    code: 'USER_DUPLICATE_CPF',
    message: `CPF ${cpf} já está cadastrado`,
    details: { cpf },
  }),
  duplicateRg: (rg: string) => ({
    code: 'USER_DUPLICATE_RG',
    message: `RG ${rg} já está cadastrado`,
    details: { rg },
  }),
  notFound: (userId?: string) => ({
    code: 'USER_NOT_FOUND',
    message: userId ? `Usuário com ID ${userId} não encontrado` : 'Usuário não encontrado',
    details: { userId },
  }),
  invalidPassword: () => ({
    code: 'USER_INVALID_PASSWORD',
    message: 'Senha inválida',
  }),
  accountDisabled: (userId: string) => ({
    code: 'USER_ACCOUNT_DISABLED',
    message: `Conta do usuário ${userId} está desabilitada`,
    details: { userId },
  }),
  emailNotVerified: (email: string) => ({
    code: 'USER_EMAIL_NOT_VERIFIED',
    message: `Email ${email} não foi verificado`,
    details: { email },
  }),
  invalidUserType: (type: string) => ({
    code: 'USER_INVALID_TYPE',
    message: `Tipo de usuário ${type} é inválido`,
    details: { type },
  }),
} as const;

export class UserErrorFactory extends BaseErrorFactory {
  static duplicateEmail(email: string) {
    return this.createConflict(USER_ERROR_CONFIGS.duplicateEmail(email));
  }

  static duplicateCpf(cpf: string) {
    return this.createConflict(USER_ERROR_CONFIGS.duplicateCpf(cpf));
  }

  static duplicateRg(rg: string) {
    return this.createConflict(USER_ERROR_CONFIGS.duplicateRg(rg));
  }

  static notFound(userId?: string) {
    return this.createNotFound(USER_ERROR_CONFIGS.notFound(userId));
  }

  static invalidPassword() {
    return this.createBusinessLogic(USER_ERROR_CONFIGS.invalidPassword());
  }

  static accountDisabled(userId: string) {
    return this.createBusinessLogic(USER_ERROR_CONFIGS.accountDisabled(userId));
  }

  static emailNotVerified(email: string) {
    return this.createBusinessLogic(USER_ERROR_CONFIGS.emailNotVerified(email));
  }

  static invalidUserType(type: string) {
    return this.createBusinessLogic(USER_ERROR_CONFIGS.invalidUserType(type));
  }
}
