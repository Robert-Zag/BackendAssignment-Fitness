import {
	Router,
	Request,
	Response,
	NextFunction
} from 'express'
import { prisma } from '../lib/prisma'
import { isAdmin, isAuthenticated } from '../middleware/auth'
import { localize } from '../lib/localization'

const router: Router = Router()

export default () => {
	router.get('/', async (req: Request, res: Response, _next: NextFunction) => {
		const programs = await prisma.program.findMany()
		return res.json({
			data: programs,
			message: localize(req.headers.language as string, 'List of programs')
		})
	})

	router.delete('/:programId/:exerciseId', isAuthenticated, isAdmin, async (req: Request, res: Response, _next: NextFunction) => {
		const programId = parseInt(req.params.programId)
		const exerciseId = parseInt(req.params.exerciseId)
		if (isNaN(programId)) {
			return res.status(400).json({
				message: localize(req.headers.language as string, "Invalid program ID")
			})
		}
		if (isNaN(exerciseId)) {
			return res.status(400).json({
				message: localize(req.headers.language as string, "Invalid exercise ID")
			})
		}

		const existingProgram = await prisma.program.findUnique({ where: { id: programId }, include: { exercises: true } })
		if (!existingProgram) {
			return res.status(404).json({
				id: programId,
				message: localize(req.headers.language as string, "Program not found")
			})
		}

		const exerciseIsInProgram = existingProgram.exercises.some(exercise => exercise.id === exerciseId)
		if (!exerciseIsInProgram) {
			return res.status(400).json({
				message: localize(req.headers.language as string, 'Exercise not found on the given program')
			});
		}

		// deleting the relation from the intermediary table
		await prisma.program.update({
			where: { id: programId },
			data: {
				exercises: {
					disconnect: [{ id: exerciseId }]
				}
			}
		})

		return res.json({
			message: localize(req.headers.language as string, 'Exercise removed from program')
		})
	})

	router.post('/:programId/:exerciseId', isAuthenticated, isAdmin, async (req: Request, res: Response, _next: NextFunction) => {
		const programId = parseInt(req.params.programId)
		const exerciseId = parseInt(req.params.exerciseId)
		if (isNaN(programId)) {
			return res.status(400).json({
				message: localize(req.headers.language as string, "Invalid program ID")
			})
		}
		if (isNaN(exerciseId)) {
			return res.status(400).json({
				message: localize(req.headers.language as string, "Invalid exercise ID")
			})
		}

		const existingProgram = await prisma.program.findUnique({ where: { id: programId }, include: { exercises: true } })
		if (!existingProgram) {
			return res.status(404).json({
				id: programId,
				message: localize(req.headers.language as string, "Program not found")
			})
		}

		const exerciseIsInProgram = existingProgram.exercises.some(exercise => exercise.id === exerciseId)
		if (exerciseIsInProgram) {
			return res.status(400).json({
				message: localize(req.headers.language as string, 'Exercise already on the given program')
			});
		}

		const existingExercise = await prisma.exercise.findUnique({ where: { id: exerciseId } })
		if (!existingExercise) {
			return res.status(404).json({
				id: exerciseId,
				message: localize(req.headers.language as string, "Exercise not found")
			})
		}

		// adding the relation
		await prisma.program.update({
			where: { id: programId },
			data: {
				exercises: {
					connect: [{ id: exerciseId }]
				}
			}
		})

		return res.json({
			message: localize(req.headers.language as string, 'Exercise added to program')
		})
	})

	return router
}
