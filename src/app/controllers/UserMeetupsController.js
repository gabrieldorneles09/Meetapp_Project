import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import Banner from '../models/File';

class UserMeetupsController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: {
        user_id: req.userId,
        date: {
          [Op.gte]: new Date(),
        },
      },
      include: [
        {
          model: Banner,
          as: 'banner',
          attributes: ['id', 'name'],
        },
      ],
      order: ['date'],
    });

    return res.json(meetups);
  }
}

export default new UserMeetupsController();
