import { UserRole } from '@prisma/client';
import {
    Request,
    Response,
    NextFunction
} from 'express'
import passport from 'passport';
import {
    AuthenticateCallbackError,
    AuthenticateCallbackInfo,
    AuthenticateCallbackUser
} from '../types/types';
import { localize } from '../lib/localization';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
        'jwt',
        { session: false },
        (
            err: AuthenticateCallbackError | null,
            user?: AuthenticateCallbackUser,
            _info?: AuthenticateCallbackInfo
        ) => {
            if (err) { return next(err) }
            if (!user) { return res.status(401).json({ message: localize(req.headers.language as string, 'User is not authenticated') }) }
            req.user = user
            next()
        })(req, res, next)
}

export const isAdmin = (
    req: Request & { user: AuthenticateCallbackUser },
    res: Response,
    next: NextFunction
) => {
    if (req.user && req.user.role === UserRole.ADMIN) {
        next()
    } else {
        return res.status(403).json({ message: localize(req.headers.language as string, 'Unauthorized') });
    }
};
