import * as Yup from 'yup';
import { Request, Response } from 'express';
import { getRepository } from 'typeorm';

import Orphanages from '../models/Orphanage';
import orphanageView from '../views/orphanages_view';

export default {
	// Lists All Orphanages

	async index (request: Request, response: Response) {
		const orphanagesRepository = getRepository(Orphanages);
		const orphanages = await orphanagesRepository.find({ relations: ['images'] });

		return response.json(orphanageView.renderMany(orphanages));
	},

	// Shows the Detail of an Orphanage

	async show (request: Request, response: Response) {
		const { id } = request.params;
		const orphanagesRepository = getRepository(Orphanages);

		const orphanage = await orphanagesRepository
			.createQueryBuilder('orphanage')
			.leftJoinAndSelect('orphanage.images', 'image')
			.where('orphanage.id = :id', { id })
			.getOneOrFail();

		return response.json(orphanageView.render(orphanage));
	},

	// Create an Orphanage

	async create (request: Request, response: Response) {
		const {
			name,
			latitude,
			longitude,
			about,
			instructions,
			opening_hours,
			open_on_weekends,
		} = request.body;

		const orphanagesRepository = getRepository(Orphanages);
		const requestImages = request.files as Express.Multer.File[];

		const images = requestImages.map(image => {
			return { path: image.filename }
		});

		const data = {
			name,
			latitude,
			longitude,
			about,
			instructions,
			opening_hours,
			open_on_weekends: open_on_weekends === 'true',
			images,
		};

		const schema = Yup.object().shape({
			name: Yup.string().required(),
			latitude: Yup.number().required(),
			longitude: Yup.number().required(),
			about: Yup.string().required().max(300),
			instructions: Yup.string().required(),
			opening_hours: Yup.string().required(),
			open_on_weekends: Yup.boolean().required(),

			images: Yup.array(Yup.object().shape({
				path: Yup.string().required()
			})).required(),
		});

		await schema.validate(data, { abortEarly: false });

		const orphanage = orphanagesRepository.create(data);

		await orphanagesRepository.save(orphanage);

		return response.status(201).json(orphanage);
	}
};
