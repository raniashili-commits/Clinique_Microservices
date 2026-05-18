const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_DIR = path.join(__dirname, '../proto');

const patientProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(PROTO_DIR, 'patient.proto'), {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
  })
).patient;

const rendezvousProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(PROTO_DIR, 'rendezvous.proto'), {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
  })
).rendezvous;

const notificationProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(PROTO_DIR, 'notification.proto'), {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
  })
).notification;

const patientClient = new patientProto.PatientService(
  'localhost:50051', grpc.credentials.createInsecure()
);
const rendezvousClient = new rendezvousProto.RendezvousService(
  'localhost:50052', grpc.credentials.createInsecure()
);
const notificationClient = new notificationProto.NotificationService(
  'localhost:50053', grpc.credentials.createInsecure()
);

const resolvers = {
  Query: {
    patient: (_, { id }) => new Promise((resolve, reject) => {
      patientClient.GetPatient({ id }, (err, res) => {
        if (err) reject(err); else resolve(res.patient);
      });
    }),

    patients: () => new Promise((resolve, reject) => {
      patientClient.GetAllPatients({}, (err, res) => {
        if (err) reject(err); else resolve(res.patients);
      });
    }),

    rendezvous: (_, { id }) => new Promise((resolve, reject) => {
      rendezvousClient.GetRendezvous({ id }, (err, res) => {
        if (err) reject(err); else resolve(res.rendezvous);
      });
    }),

    allRendezvous: () => new Promise((resolve, reject) => {
      rendezvousClient.GetAllRendezvous({}, (err, res) => {
        if (err) reject(err); else resolve(res.rendezvousList);
      });
    }),

    notifications: (_, { patientId }) => new Promise((resolve, reject) => {
      notificationClient.GetNotifications({ patientId }, (err, res) => {
        if (err) reject(err); else resolve(res.notifications);
      });
    }),
  },

  Mutation: {
    createPatient: (_, args) => new Promise((resolve, reject) => {
      patientClient.CreatePatient(args, (err, res) => {
        if (err) reject(err); else resolve(res.patient);
      });
    }),

    updatePatient: (_, args) => new Promise((resolve, reject) => {
      patientClient.UpdatePatient(args, (err, res) => {
        if (err) reject(err); else resolve(res.patient);
      });
    }),

    deletePatient: (_, { id }) => new Promise((resolve, reject) => {
      patientClient.DeletePatient({ id }, (err, res) => {
        if (err) reject(err); else resolve(res.success);
      });
    }),

    createRendezvous: (_, args) => new Promise((resolve, reject) => {
      rendezvousClient.CreateRendezvous(args, (err, res) => {
        if (err) reject(err); else resolve(res.rendezvous);
      });
    }),

    updateRendezvous: (_, args) => new Promise((resolve, reject) => {
      rendezvousClient.UpdateRendezvous(args, (err, res) => {
        if (err) reject(err); else resolve(res.rendezvous);
      });
    }),

    deleteRendezvous: (_, { id }) => new Promise((resolve, reject) => {
      rendezvousClient.DeleteRendezvous({ id }, (err, res) => {
        if (err) reject(err); else resolve(res.success);
      });
    }),
  },
};

module.exports = resolvers;