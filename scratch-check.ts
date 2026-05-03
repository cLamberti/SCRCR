import { db } from './src/lib/db';

async function check() {
  try {
    const res = await db.query('SELECT * FROM reportes_asistencia LIMIT 10');
    console.log('Reportes:', res.rows);
    const res2 = await db.query('SELECT * FROM auditoria LIMIT 10');
    console.log('Auditoria:', res2.rows);
  } catch (e) {
    console.error(e);
  }
}

check();
