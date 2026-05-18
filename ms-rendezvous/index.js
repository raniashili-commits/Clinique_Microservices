const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { randomUUID } = require('crypto');
const db = require('./database');

const PROTO_PATH = path.join(__dirname, '../proto/rendezvous.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const rendezvousProto = grpc.loadPackageDefinition(packageDef).rendezvous;

const rendezvousService = {

  CreateRendezvous: (call, callback) => {
    const { patientId, date, heure, medecin } = call.request;
    const id = randomUUID();
    const statut = 'planifie';
    db.run(
      `INSERT INTO rendezvous (id, patientId, date, heure, medecin, statut)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, patientId, date, heure, medecin, statut],
      function (err) {
        if (err) return callback({ code: grpc.status.INTERNAL, message: err.message });
        callback(null, { rendezvous: { id, patientId, date, heure, medecin, statut } });
      }
    );
  },

  GetRendezvous: (call, callback) => {
    const { id } = call.request;
    db.get(`SELECT * FROM rendezvous WHERE id = ?`, [id], (err, row) => {
      if (err) return callback({ code: grpc.status.INTERNAL, message: err.message });
      if (!row) return callback({ code: grpc.status.NOT_FOUND, message: 'Rendez-vous non trouvé' });
      callback(null, { rendezvous: row });
    });
  },

  GetAllRendezvous: (call, callback) => {
    db.all(`SELECT * FROM rendezvous`, [], (err, rows) => {
      if (err) return callback({ code: grpc.status.INTERNAL, message: err.message });
      callback(null, { rendezvousList: rows });
    });
  },

  UpdateRendezvous: (call, callback) => {
    const { id, date, heure, medecin, statut } = call.request;
    db.run(
      `UPDATE rendezvous SET date=?, heure=?, medecin=?, statut=? WHERE id=?`,
      [date, heure, medecin, statut, id],
      function (err) {
        if (err) return callback({ code: grpc.status.INTERNAL, message: err.message });
        callback(null, { rendezvous: { id, date, heure, medecin, statut } });
      }
    );
  },

  DeleteRendezvous: (call, callback) => {
    const { id } = call.request;
    db.run(`DELETE FROM rendezvous WHERE id = ?`, [id], function (err) {
      if (err) return callback({ code: grpc.status.INTERNAL, message: err.message });
      callback(null, { success: true, message: 'Rendez-vous supprimé' });
    });
  },
};

const server = new grpc.Server();
server.addService(rendezvousProto.RendezvousService.service, rendezvousService);

const PORT = 50052;
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) { console.error(err); return; }
    console.log(`MS Rendez-vous démarré sur le port ${port}`);
  }
);