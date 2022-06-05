import { Application, Request, Response } from 'express';
import fs from 'fs';
import libre from 'libreoffice-convert';
import multer from 'multer';
import path from 'path';

const docxFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname);
  if (ext === '.docx' || ext === '.doc') {
    return callback(null, true);
  }
  const err: Error = new Error('This extension is not supported.');
  return callback(err);
};

const outputFilePath = 'uploads/' + Date.now() + 'output.pdf'; // Set generated PDF file name

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, 'uploads');
  },
  filename: function (_req, file, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    );
  },
});

const uplodadFiles = async (req: Request, res: Response) => {
  if (req.file) {
    const path = req.file.path;
    const docFile = fs.readFileSync(path);

    libre.convert(docFile, '.pdf', undefined, (err, done) => {
      if (err) {
        fs.unlinkSync(path);
        fs.unlinkSync(outputFilePath);
        res.send('Error during file conversion.');
      } else {
        fs.writeFileSync(outputFilePath, done);

        res.download(outputFilePath, (err) => {
          if (err) {
            fs.unlinkSync(path);
            fs.unlinkSync(outputFilePath);
            res.send('Error during file download.');
          } else {
            fs.unlinkSync(path);
            fs.unlinkSync(outputFilePath);
          }
        });
      }
    });
  } else {
    return res.send('You need to send a file.');
  }
};

export const loadApiEndpoints = (app: Application): void => {
  app.post(
    '/api',
    multer({ storage, fileFilter: docxFilter }).single('file'),
    uplodadFiles
  );
};
