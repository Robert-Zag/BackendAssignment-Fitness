import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { z } from 'zod'
import { isAdmin, isAuthenticated } from '../middleware/auth'
import { ExerciseDifficulty } from '@prisma/client'
import { localize } from '../lib/localization'

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

const querySchema = z.object({
	page: z.number().int().min(1).optional(),
	limit: z.number().int().min(1).optional(),
	program: z.number().int().min(1).optional(),
	search: z.string().optional()
})

type WhereQuery = {
	programs?: { some: { id: number } },
	name?: { contains: string }
}

export default () => {
	router.get('/', async (req: Request, res: Response, _next: NextFunction) => {
		const parsedPage = parseInt(req.query.page as string) || undefined
		const parsedLimit = parseInt(req.query.limit as string) || undefined
		const parsedProgram = parseInt(req.query.program as string) || undefined

		let parsedData: z.infer<typeof querySchema>
		try {
			parsedData = querySchema.parse({
				page: parsedPage,
				limit: parsedLimit,
				program: parsedProgram,
				search: req.query.search
			})
		} catch (error) {
			return res.status(400).json({
				message: localize(req.headers.language as string, "Validation error"),
				errors: error.errors
			})
		}

		let prismaWhereQuery: WhereQuery = {}

		if (parsedData.program) {
			prismaWhereQuery.programs = { some: { id: parsedData.program } }
		}
		if (parsedData.search) {
			prismaWhereQuery.name = { contains: parsedData.search }
		}

		// only query with pagination if both limit and page are given		
		let page, limit, skip
		if (parsedData.page && parsedData.limit) {
			page = parsedData.page
			limit = parsedData.limit
			skip = (page - 1) * limit
		}


		const exercises = await prisma.exercise.findMany({
			where: prismaWhereQuery,
			include: { programs: true },
			skip: skip,
			take: limit
		})

		return res.json({
			data: exercises,
			message: localize(req.headers.language as string, 'List of exercises')
		})
	})

	router.post('/', isAuthenticated, isAdmin, async (req: Request, res: Response, _next: NextFunction) => {
		let parsedData: z.infer<typeof createSchema>
		try {
			parsedData = createSchema.parse(req.body)
		} catch (error) {
			return res.status(400).json({
				message: localize(req.headers.language as string, "Validation error"),
				errors: error.errors
			})
		}

		if (parsedData.programs) {
			for (const id of parsedData.programs) {
				const existingProgram = await prisma.program.findUnique({ where: { id } })
				if (!existingProgram) {
					return res.status(404).json({
						id,
						message: localize(req.headers.language as string, "Program not found")
					})
				}
			}
		}

		const programsToConnect = parsedData.programs && parsedData.programs.map((id) => { return { id } })
		const exercise = await prisma.exercise.create({
			data: {
				...parsedData,
				programs: {
					connect: programsToConnect
				}
			}
		})

		return res.status(201).json({
			exercise,
			message: localize(req.headers.language as string, 'Exercise created')
		})
	})

	router.put('/:id', isAuthenticated, isAdmin, async (req: Request, res: Response, _next: NextFunction) => {
		const id = parseInt(req.params.id)
		if (isNaN(id)) {
			return res.status(400).json({
				message: localize(req.headers.language as string, "Invalid exercise ID")
			})
		}

		// including the related programs aswell so they can be removed if needed
		const existingExercise = await prisma.exercise.findUnique({
			where: { id },
			include: { programs: true }
		})
		if (!existingExercise) {
			return res.status(404).json({
				id,
				message: localize(req.headers.language as string, "Exercise not found")
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

		if (parsedData.programs) {
			for (const id of parsedData.programs) {
				const existingProgram = await prisma.program.findUnique({ where: { id } })
				if (!existingProgram) {
					return res.status(404).json({
						id,
						message: localize(req.headers.language as string, "Program not found")
					})
				}
			}
		}

		// disconnecting all the existing exercise program relations if a programs property was passed
		if (parsedData.hasOwnProperty('programs')) {
			const currentlyConnectedPrograms = existingExercise.programs.map((program) => { return { id: program.id } })
			const disconnectPrograms = prisma.exercise.update({
				where: { id },
				data: {
					programs: {
						disconnect: currentlyConnectedPrograms
					}
				}
			})

			const programsToConnect = parsedData.programs && parsedData.programs.map((id) => { return { id } })
			const updateExercise = prisma.exercise.update({
				where: { id },
				data: {
					...parsedData,
					programs: {
						connect: programsToConnect
					}
				}
			})

			// make an atomic transaction to avoid risk of data loss
			const results = await prisma.$transaction([disconnectPrograms, updateExercise])

			return res.json({
				exercise: results[1],
				message: localize(req.headers.language as string, 'Exercise updated')
			})
			// if no programs property is passed in request body, update the other properties only 
		} else {
			const exercise = await prisma.exercise.update({
				where: { id },
				data: {
					...parsedData,
					programs: undefined
				}
			});

			return res.json({
				exercise,
				message: localize(req.headers.language as string, 'Exercise updated')
			});
		}
	})

	router.delete('/:id', isAuthenticated, isAdmin, async (req: Request, res: Response, _next: NextFunction) => {
		const id = parseInt(req.params.id)
		if (isNaN(id)) {
			return res.status(400).json({
				message: localize(req.headers.language as string, "Invalid exercise ID")
			})
		}

		const existingExercise = await prisma.exercise.findUnique({ where: { id } })
		if (!existingExercise) {
			return res.status(404).json({
				id,
				message: localize(req.headers.language as string, "Exercise not found")
			})
		}

		await prisma.exercise.delete({ where: { id } })

		return res.json({
			id,
			message: localize(req.headers.language as string, 'Exercise deleted')
		})
	})

	return router
}
