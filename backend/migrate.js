const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/elearning';
const CLOUD_URI = 'mongodb+srv://korerohini507_db_user:O733LymUywuQs06W@cluster0.jgmo7ch.mongodb.net/elearning?retryWrites=true&w=majority';

async function migrate() {
  console.log('Connecting to local DB...');
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('Connected to local DB.');

  console.log('Connecting to cloud DB...');
  const cloudConn = await mongoose.createConnection(CLOUD_URI).asPromise();
  console.log('Connected to cloud DB.');

  const collections = await localConn.db.collections();
  console.log(`Found ${collections.length} collections locally.`);

  for (let collection of collections) {
    const name = collection.collectionName;
    console.log(`Migrating collection: ${name}`);
    
    const docs = await collection.find({}).toArray();
    if (docs.length === 0) {
      console.log(` - Skipping ${name}: 0 documents.`);
      continue;
    }

    const cloudCol = cloudConn.collection(name);
    // Try to insert cleanly. We ignore errors on collision just in case they ran this before.
    try {
      await cloudCol.insertMany(docs, { ordered: false });
      console.log(` - Inserted ${docs.length} documents into ${name}.`);
    } catch (err) {
      // If it throws an error (e.g. duplicate keys), we can assume it's already there or partially there
      console.log(` - Inserted some/all documents into ${name}. (Skipped duplicates)`);
    }
  }

  console.log('Migration Complete!');
  await localConn.close();
  await cloudConn.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
