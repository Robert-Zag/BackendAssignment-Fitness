import { enum_exercises_difficulty } from "@prisma/client"
import { prisma } from "./lib/prisma"

const seedDB = async () => {
	await prisma.programs.createMany({
		data: [
			{ name: 'Program 1' },
			{ name: 'Program 2' },
			{ name: 'Program 3' },
		]
	})

	await prisma.exercises.createMany({
		data: [{
			name: 'Exercise 1',
			difficulty: enum_exercises_difficulty.EASY,
			programID: 1
		}, {
			name: 'Exercise 2',
			difficulty: enum_exercises_difficulty.EASY,
			programID: 2
		}, {
			name: 'Exercise 3',
			difficulty: enum_exercises_difficulty.MEDIUM,
			programID: 1
		}, {
			name: 'Exercise 4',
			difficulty: enum_exercises_difficulty.MEDIUM,
			programID: 2
		}, {
			name: 'Exercise 5',
			difficulty: enum_exercises_difficulty.HARD,
			programID: 1
		}, {
			name: 'Exercise 6',
			difficulty: enum_exercises_difficulty.HARD,
			programID: 2
		}]
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
