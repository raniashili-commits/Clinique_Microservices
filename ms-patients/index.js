const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { randomUUID } = require('crypto');
const db = require('./database');

const PROTO_PATH = path.join('C:\\Users\\hp\\clinique-microservices\\proto\\patient.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const patientProto = grpc.loadPackageDefinition(packageDef).patient;

const patientService = {

  CreatePatient: (call, callback) => {
    const { nom, prenom, email, telephone, dateNaissance } = call.request;
    const id = randomUUID();
    db.run(
      `INSERT INTO patients (id, nom, prenom, email, telephone, dateNaissance)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nom, prenom, email, telephone, dateNaissance],
      function (err) {
        if (err) return callback({ code: grpc.status.INTERNAL, message: err.message });
        callback(null, { patient: { id, nom, prenom, email, telephone, dateNaissance } });
      }
    );
  },

  GetPatient: (call, callback) => {
    const { id } = call.request;
    db.get(`SELECT * FROM patients WHERE id = ?`, [id], (err, row) => {
      if (err) return callback({ code: grpc.status.INTERNAL, message: err.message });
      if (!row) return callback({ code: grpc.status.NOT_FOUND, message: 'Patient non trouvé' });
      callback(null, { patient: row });
    });
  },

  GetAllPatients: (call, callback) => {
    db.all(`SELECT * FROM patients`, [], (err, rows) => {
      if (err) return callback({ code: grpc.status.INTERNAL, message: err.message });
      callback(null, { patients: rows });
    });
  },

  UpdatePatient: (call, callback) => {
    const { id, nom, prenom, email, telephone } = call.request;
    db.run(
      `UPDATE patients SET nom=?, prenom=?, email=?, telephone=? WHERE id=?`,
      [nom, prenom, email, telephone, id],
      function (err) {
        if (err) return callback({ code: grpc.status.INTERNAL, message: err.message });
        callback(null, { patient: { id, nom, prenom, email, telephone } });
      }
    );
  },

  DeletePatient: (call, callback) => {
    const { id } = call.request;
    db.run(`DELETE FROM patients WHERE id = ?`, [id], function (err) {
      if (err) return callback({ code: grpc.status.INTERNAL, message: err.message });
      callback(null, { success: true, message: 'Patient supprimé' });
    });
  },
};

const server = new grpc.Server();
server.addService(patientProto.PatientService.service, patientService);

const PORT = 50051;
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) { 
      console.error('Erreur:', err); 
      return; 
    }
    server.start();
    console.log(`MS Patients démarré sur le port ${port}`);
  
  }
);