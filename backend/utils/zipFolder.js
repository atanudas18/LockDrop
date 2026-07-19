const archiver = require('archiver');
const fs = require('fs');

function zipFilesToPath(files, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    output.on('close', () => resolve(archive.pointer()));
    output.on('error', reject);
    archive.on('warning', (err) => (err.code === 'ENOENT' ? console.warn(err) : reject(err)));
    archive.on('error', reject);
    archive.pipe(output);

    for (const file of files) {
      archive.file(file.path, { name: file.relativePath || file.originalname });
    }
    archive.finalize();
  });
}

module.exports = { zipFilesToPath };
