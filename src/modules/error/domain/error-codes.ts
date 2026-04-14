export enum ConfigErrorCode {
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
}

export enum MethodNotImplementedErrorCode {
  METHOD_NOT_IMPLEMENTED = 'METHOD_NOT_IMPLEMENTED',
}

export type ErrorCode = ConfigErrorCode | MethodNotImplementedErrorCode | string;
