import { UserRole } from "@prisma/client";

type AuthenticateCallbackError = Error & {
    status?: number;
}

type AuthenticateCallbackUser = {
    id: string;
    role: UserRole;
}

type AuthenticateCallbackInfo = {
    message: string;
}
