import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { isAdmin, isAuthenticated } from '../middleware/auth'
import { AuthenticateCallbackUser } from '../types/types'
import { UserRole } from '@prisma/client'
import { localize } from '../lib/localization'

const router: Router = Router()

const updateSchema = z.object({
    role: z.nativeEnum(UserRole).optional(),
    name: z.string().optional(),
    surname: z.string().optional(),
    nickName: z.string().optional(),
    age: z.number().int().min(1).optional(),
})

export default () => {
    router.get('/', isAuthenticated, async (
        req: Request & { user: AuthenticateCallbackUser },
        res: Response,
        _next: NextFunction
    ) => {
        const allUsers = await prisma.user.findMany()
        if (req.user && req.user.role === UserRole.ADMIN) {
            return res.json({
                data: allUsers,
                message: localize(req.headers.language as string, 'List of all users')
            })
        } else if (req.user && req.user.role === UserRole.USER) {
            //regular users can only see all the ids and nicknames
            const redactedUsers = allUsers.map((fullUser) => { return { id: fullUser.id, nickName: fullUser.nickName } })
            return res.json({
                data: redactedUsers,
                message: localize(req.headers.language as string, 'List of all users')
            })
        }
    })

    router.get('/:id', isAuthenticated, async (
        req: Request & { user: AuthenticateCallbackUser },
        res: Response,
        _next: NextFunction
    ) => {
        const id = parseInt(req.params.id)
        if (isNaN(id)) {
            return res.status(400).json({
                message: localize(req.headers.language as string, "Invalid user ID")
            })
        }
        if (req.user && req.user.role === UserRole.ADMIN) {
            const existingUser = prisma.user.findUnique({ where: { id } })
            if (!existingUser) {
                return res.status(404).json({
                    id,
                    message: localize(req.headers.language as string, "User not found")
                })
            }
            return res.json({
                data: existingUser,
                message: localize(req.headers.language as string, 'User detail')
            })
        } else if (req.user && req.user.role === UserRole.USER) {
            // regular users can only access their own profile
            if (req.user.id !== req.params.id) {
                return res.status(403).json({ message: localize(req.headers.language as string, 'Unauthorized') })
            }
            const userProfile = prisma.user.findUnique({ where: { id: parseInt(req.user.id) } })
            return res.json({
                data: userProfile,
                message: localize(req.headers.language as string, 'User profile')
            })
        }
    })

    router.put('/:id', isAuthenticated, isAdmin, async (req: Request, res: Response, _next: NextFunction) => {
        const id = parseInt(req.params.id)
        if (isNaN(id)) {
            return res.status(400).json({
                message: localize(req.headers.language as string, "Invalid user ID")
            })
        }

        const existingUser = await prisma.user.findUnique({ where: { id } })
        if (!existingUser) {
            return res.status(404).json({
                id,
                message: localize(req.headers.language as string, "User not found")
            })
        }

        let parsedData: z.infer<typeof updateSchema>
        try {
            parsedData = updateSchema.parse(req.body)
        } catch (error) {
            return res.status(400).json({
                message: localize(req.headers.language as string, "Validation error"),
                errors: error.errors
            })
        }

        const user = await prisma.user.update({
            where: { id },
            data: parsedData
        });

        return res.json({
            user,
            message: localize(req.headers.language as string, 'User updated')
        });

    })

    return router
}
