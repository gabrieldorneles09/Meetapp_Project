import Bee from 'bee-queue';
import SubscriptionMail from '../app/jobs/SubscriptionMail';

const jobs = [SubscriptionMail];

class Queue {
  constructor() {
    this.queues = {};

    this.init();
  }

  init() {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis: {
            host: 'localhost',
            port: 6379,
          },
        }),
        handle,
      };
    });
  }

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key];

      bee.on('failed', this.handleFailure).process(handle);
    });
  }

  handleFailure(job, err) {
    if (true) {
      console.log(`Queue ${job.queue.name}: Failed`, err);
    }
  }
}

export default new Queue();
