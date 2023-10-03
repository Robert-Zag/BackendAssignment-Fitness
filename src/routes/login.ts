import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express'
import { prisma } from '../lib/prisma'
import { z } from 'zod'
import { compare } from 'bcrypt'
import jwt from 'jsonwebtoken'

const router: Router = Router()

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export default () => {
    router.post('/', async (req: Request, res: Response, _next: NextFunction) => {
        let parsedData: z.infer<typeof loginSchema>
        try {
            parsedData = loginSchema.parse(req.body)
        } catch (error) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.errors
            })
        }

        const userWithEmail = await prisma.user.findUnique({ where: { email: parsedData.email.toLowerCase() } })
        const isPasswordValid = userWithEmail && await compare(parsedData.password, userWithEmail.password)
        if (!isPasswordValid) {
            return res.status(401).json({
                // generic error message for better security
                message: "Invalid credentials",
            })
        }

        const token = jwt.sign({ id: userWithEmail.id }, process.env.JWT_SECRET, { expiresIn: '1h' })
        return res.json({ token, message: "Logged in successfully" });
    })

    return router
}
