const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const fs = require('fs');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const resolvers = require('./resolvers');

const app = express();
app.use(cors());
app.use(express.json());

const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8');

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

const patientClient = new patientProto.PatientService(
  'localhost:50051', grpc.credentials.createInsecure()
);
const rendezvousClient = new rendezvousProto.RendezvousService(
  'localhost:50052', grpc.credentials.createInsecure()
);

app.get('/patients', (req, res) => {
  patientClient.GetAllPatients({}, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response.patients);
  });
});

app.get('/patients/:id', (req, res) => {
  patientClient.GetPatient({ id: req.params.id }, (err, response) => {
    if (err) return res.status(404).json({ error: err.message });
    res.json(response.patient);
  });
});

app.post('/patients', (req, res) => {
  patientClient.CreatePatient(req.body, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(response.patient);
  });
});

app.put('/patients/:id', (req, res) => {
  patientClient.UpdatePatient({ id: req.params.id, ...req.body }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response.patient);
  });
});

app.delete('/patients/:id', (req, res) => {
  patientClient.DeletePatient({ id: req.params.id }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: response.success });
  });
});

app.get('/rendezvous', (req, res) => {
  rendezvousClient.GetAllRendezvous({}, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response.rendezvousList);
  });
});

app.get('/rendezvous/:id', (req, res) => {
  rendezvousClient.GetRendezvous({ id: req.params.id }, (err, response) => {
    if (err) return res.status(404).json({ error: err.message });
    res.json(response.rendezvous);
  });
});

app.post('/rendezvous', (req, res) => {
  rendezvousClient.CreateRendezvous(req.body, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(response.rendezvous);
  });
});

app.put('/rendezvous/:id', (req, res) => {
  rendezvousClient.UpdateRendezvous({ id: req.params.id, ...req.body }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response.rendezvous);
  });
});

app.delete('/rendezvous/:id', (req, res) => {
  rendezvousClient.DeleteRendezvous({ id: req.params.id }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: response.success });
  });
});
const notificationProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(PROTO_DIR, 'notification.proto'), {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
  })
).notification;

const notificationClient = new notificationProto.NotificationService(
  'localhost:50053', grpc.credentials.createInsecure()
);

app.get('/notifications/:patientId', (req, res) => {
  notificationClient.GetNotifications({ patientId: req.params.patientId }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response.notifications);
  });
});
async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use('/graphql', expressMiddleware(server));

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`API Gateway demarre sur http://localhost:${PORT}`);
    console.log(`REST  -> http://localhost:${PORT}/patients`);
    console.log(`REST  -> http://localhost:${PORT}/rendezvous`);
    console.log(`GraphQL -> http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);