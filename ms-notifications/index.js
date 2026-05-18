const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { Kafka } = require('kafkajs');
const dbPromise = require('./db');

const PROTO_PATH = path.join(__dirname, '../proto/notification.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const notificationProto = grpc.loadPackageDefinition(packageDef).notification;

const kafka = new Kafka({
  clientId: 'ms-notifications',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'notifications-group' });

async function connectConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'rdv.created', fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());
      console.log('Evenement Kafka recu :', data);
      const { notifications, persistNotifications, createId } = await dbPromise;
      const id = createId();
      const dateEnvoi = new Date().toISOString();
      await notifications.insert({
        id,
        patientId: data.patientId,
        message: data.message,
        type: data.type,
        dateEnvoi,
        lu: false,
      });
      await persistNotifications(notifications);
      console.log('Notification creee pour patient:', data.patientId);
    },
  });
  console.log('Kafka consumer connecte - ecoute rdv.created');
}

connectConsumer().catch(console.error);

const notificationService = {

  CreateNotification: async (call, callback) => {
    try {
      const { patientId, message, type } = call.request;
      const { notifications, persistNotifications, createId } = await dbPromise;
      const id = createId();
      const dateEnvoi = new Date().toISOString();
      const inserted = await notifications.insert({
        id, patientId, message, type, dateEnvoi, lu: false,
      });
      await persistNotifications(notifications);
      callback(null, { notification: inserted.toJSON() });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  GetNotifications: async (call, callback) => {
    try {
      const { patientId } = call.request;
      const { notifications } = await dbPromise;
      const docs = await notifications.find({
        selector: { patientId }
      }).exec();
      callback(null, { notifications: docs.map(d => d.toJSON()) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
};

const server = new grpc.Server();
server.addService(notificationProto.NotificationService.service, notificationService);

const PORT = 50053;
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) { console.error(err); return; }
    server.start();
    console.log(`MS Notifications demarre sur le port ${port}`);
  }
);