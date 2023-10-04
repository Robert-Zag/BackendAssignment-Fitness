import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { z } from 'zod'
import { isAdmin, isAuthenticated } from '../middleware/auth'
import { ExerciseDifficulty } from '@prisma/client'
import { AuthenticateCallbackUser } from '../types/types'

const router: Router = Router()

const createSchema = z.object({
    name: z.string(),
    difficulty: z.nativeEnum(ExerciseDifficulty),
    programs: z.array(z.number().int()).optional()
})

const updateSchema = z.object({
    name: z.string().optional(),
    difficulty: z.nativeEnum(ExerciseDifficulty).optional(),
    programs: z.array(z.number().int()).optional()
})

export default () => {
    router.get('/', isAuthenticated, async (
        req: Request & { user: AuthenticateCallbackUser },
        res: Response,
        _next: NextFunction
    ) => {
        const userId: number = parseInt(req.user.id)
        const userWithCompleteExercises = await prisma.user.findUnique({ where: { id: userId }, include: { completedExercises: true } })
        const completedExercises = userWithCompleteExercises.completedExercises

        return res.json({
            data: completedExercises,
            message: 'List of completed exercises'
        })
    })

    router.post('/:exerciseId', isAuthenticated, async (
        req: Request & { user: AuthenticateCallbackUser },
        res: Response,
        _next: NextFunction
    ) => {
        const exerciseId = parseInt(req.params.exerciseId)
        if (isNaN(exerciseId)) {
            return res.status(400).json({
                message: "Invalid exercise ID"
            })
        }

        const existingExercise = await prisma.exercise.findUnique({ where: { id: exerciseId } })
        if (!existingExercise) {
            return res.status(404).json({
                id: exerciseId,
                message: "Exercise not found"
            })
        }
        const userId: number = parseInt(req.user.id)
        const duration: number = parseInt(req.body.duration)
        if (isNaN(duration)) {
            return res.status(400).json({
                message: "Invalid duration"
            })
        }

        const completedExercise = await prisma.completedExercise.create({ data: { duration, exerciseId, userId } })
        return res.json({
            data: completedExercise,
            message: 'Exercise completion tracked'
        })
    })

    router.delete('/:exerciseCompletionId', isAuthenticated, async (
        req: Request & { user: AuthenticateCallbackUser },
        res: Response,
        _next: NextFunction
    ) => {
        const exerciseCompletionId = parseInt(req.params.exerciseCompletionId)
        if (isNaN(exerciseCompletionId)) {
            return res.status(400).json({
                message: "Invalid exercise ID"
            })
        }

        const userId: number = parseInt(req.user.id)

        // check if exercise completion exists
        const existingExerciseCompletion = await prisma.completedExercise.findUnique({ where: { id: exerciseCompletionId } })
        if (!existingExerciseCompletion) {
            return res.status(404).json({
                id: exerciseCompletionId,
                message: "Exercise completion not found"
            })
        }

        // check if exercise completion belongs to current user
        if (existingExerciseCompletion.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized' })
        }

        await prisma.completedExercise.delete({ where: { id: exerciseCompletionId } })

        return res.json({
            message: 'Exercise completion deleted'
        })
    })

    return router
}
