import { ExerciseDifficulty } from '@prisma/client';
import { prisma } from "./lib/prisma"

const seedDB = async () => {
	await prisma.program.createMany({
		data: [
			{ name: 'Program 1' },
			{ name: 'Program 2' },
			{ name: 'Program 3' },
		]
	})

	await prisma.exercise.create({
		data: {
			name: 'Exercise 1',
			difficulty: ExerciseDifficulty.EASY,
			programs: {
				connect: [{ id: 1 }]
			}
		}
	})
	await prisma.exercise.create({
		data: {
			name: 'Exercise 2',
			difficulty: ExerciseDifficulty.EASY,
			programs: {
				connect: [{ id: 2 }]
			}
		}
	})
	await prisma.exercise.create({
		data: {
			name: 'Exercise 3',
			difficulty: ExerciseDifficulty.MEDIUM,
			programs: {
				connect: [{ id: 1 }]
			}
		}
	})
	await prisma.exercise.create({
		data: {
			name: 'Exercise 4',
			difficulty: ExerciseDifficulty.MEDIUM,
			programs: {
				connect: [{ id: 2 }]
			}
		}
	})
	await prisma.exercise.create({
		data: {
			name: 'Exercise 5',
			difficulty: ExerciseDifficulty.HARD,
			programs: {
				connect: [{ id: 1 }]
			}
		}
	})
	await prisma.exercise.create({
		data: {
			name: 'Exercise 6',
			difficulty: ExerciseDifficulty.HARD,
			programs: {
				connect: [{ id: 2 }]
			}
		}
	})
}

seedDB().then(() => {
	console.log('DB seed done')
	prisma.$disconnect()
	process.exit(0)
}).catch((err) => {
	console.error('error in seed, check your data and model \n \n', err)
	prisma.$disconnect()
	process.exit(1)
})
