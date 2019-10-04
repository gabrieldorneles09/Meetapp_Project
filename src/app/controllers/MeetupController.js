import {
  startOfHour,
  startOfDay,
  parseISO,
  isBefore,
  endOfDay,
} from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import Banner from '../models/File';
import User from '../models/User';

class MeetupController {
  async store(req, res) {
    const { titulo, descricao, localizacao, date } = req.body;

    // check for past dates

    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted.' });
    }

    const meetup = await Meetup.create({
      titulo,
      descricao,
      localizacao,
      date,
      user_id: req.userId,
      banner_id: req.body.banner_id ? req.body.banner_id : null,
    });
    return res.json(meetup);
  }

  async update(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    // check if user logged is equal user meetup

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'You can not modify this meetup.' });
    }

    // check if meetup already happened

    const hourStart = startOfHour(meetup.date);

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'You can not change past meetups' });
    }

    // check if banner exists
    if (req.body.banner_id) {
      const banner = await Banner.findByPk(req.body.banner_id);
      if (!banner) {
        return res.json({ error: 'Banner does not exist.' });
      }
    }

    await meetup.update(req.body);

    const newMeetup = await Meetup.findByPk(req.params.id);

    return res.json(newMeetup);
  }

  async index(req, res) {
    const page = req.query.page || 1;
    const where = {};

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);

      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    const meetups = await Meetup.findAll({
      where,
      include: [
        {
          model: Banner,
          as: 'banner',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'user',
        },
      ],
      limit: 10,
      offset: 10 * page - 10,
    });

    return res.json(meetups);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup does not exist.' });
    }

    const checkUserPermission = meetup.user_id === req.userId;

    if (!checkUserPermission) {
      return res
        .status(401)
        .json({ error: 'You dont have permission to delete this meetup' });
    }

    await meetup.destroy();

    return res.json(meetup);
  }
}

export default new MeetupController();
