export class ApiError extends Error {
    readonly status: number;

    readonly code: string;

    constructor(status: number, code: string, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }

    get isUnauthorized(): boolean {
        return this.status === 401;
    }

    get isForbidden(): boolean {
        return this.status === 403;
    }

    get isNotFound(): boolean {
        return this.status === 404;
    }

    get isConflict(): boolean {
        return this.status === 409;
    }

    get isValidation(): boolean {
        return this.status === 400;
    }
}

export const ErrorCode = {
    Unauthorized: 'UNAUTHORIZED',
    TokenInvalid: 'TOKEN_INVALID',
    TokenRevoked: 'TOKEN_REVOKED',
    Forbidden: 'FORBIDDEN',
    SuperAdminOnly: 'SUPER_ADMIN_ONLY',
    AccountBanned: 'ACCOUNT_BANNED',
    BadCredentials: 'BAD_CREDENTIALS',
    PasswordChangeRequired: 'PASSWORD_CHANGE_REQUIRED',
    NotFound: 'NOT_FOUND',
    Conflict: 'CONFLICT',
    AssignmentFull: 'ASSIGNMENT_FULL',
    AlreadyClaimed: 'ALREADY_CLAIMED',
    NotClaimed: 'NOT_CLAIMED',
    ProjectClosed: 'PROJECT_CLOSED',
    DuplicateName: 'DUPLICATE_NAME',
    ValidationFailed: 'VALIDATION_FAILED',
    InternalError: 'INTERNAL_ERROR',
} as const;
