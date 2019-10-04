import { startOfHour, isBefore } from 'date-fns';
// import * as Yup from 'yup';
import User from '../models/User';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';

class SubscriptionController {
  async store(req, res) {
    const user = await User.findByPk(req.userId);
    const meetup = await Meetup.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }],
    });

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup does not exist.' });
    }

    const checkUserEqualOrganizer = meetup.user_id === req.userId;

    if (checkUserEqualOrganizer) {
      return res.status(401).json({
        error: 'You can not subscribe to meetups that you have organized',
      });
    }

    const hourStart = startOfHour(meetup.date);

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted.' });
    }

    const checkAlreadySubscribed = await Subscription.findOne({
      where: {
        user_id: req.userId,
        meetup_id: req.params.id,
      },
    });

    if (checkAlreadySubscribed) {
      return res.status(401).json({ error: 'You can not subscribe twice' });
    }

    const checkMeetupDate = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkMeetupDate) {
      return res
        .status(400)
        .json({ error: 'You can not subscribe two meetups at the same time.' });
    }

    const sub = await Subscription.create({
      user_id: req.userId,
      meetup_id: req.params.id,
    });

    await Queue.add(SubscriptionMail.key, {
      meetup,
      user,
    });

    return res.json(sub);
  }
}

export default new SubscriptionController();
