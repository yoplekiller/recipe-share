import fs from 'fs';
import path from 'path';

interface IStorageProvider {
  upload(file: Express.Multer.File): Promise<string>;
  delete(url: string): Promise<void>;
}

// Local Storage Provider
class LocalStorageProvider implements IStorageProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  }

  async upload(file: Express.Multer.File): Promise<string> {
    // File is already saved by multer, just return the URL
    return `${this.baseUrl}/uploads/${file.filename}`;
  }

  async delete(url: string): Promise<void> {
    const filename = url.split('/').pop();
    if (filename) {
      const filepath = path.join(process.env.UPLOAD_DIR || './uploads', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
  }
}

// S3 Storage Provider (placeholder for future implementation)
class S3StorageProvider implements IStorageProvider {
  // TODO: Implement S3 upload using @aws-sdk/client-s3
  // Required env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET

  async upload(file: Express.Multer.File): Promise<string> {
    // Example implementation:
    // const s3 = new S3Client({
    //   region: process.env.AWS_REGION,
    //   credentials: {
    //     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    //   },
    // });
    //
    // const command = new PutObjectCommand({
    //   Bucket: process.env.AWS_S3_BUCKET,
    //   Key: `recipes/${file.filename}`,
    //   Body: fs.readFileSync(file.path),
    //   ContentType: file.mimetype,
    // });
    //
    // await s3.send(command);
    //
    // // Delete local file after upload
    // fs.unlinkSync(file.path);
    //
    // return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/recipes/${file.filename}`;

    throw new Error('S3 storage not implemented. Set STORAGE_TYPE=local or implement S3 provider.');
  }

  async delete(url: string): Promise<void> {
    // const key = url.split('.amazonaws.com/').pop();
    // const command = new DeleteObjectCommand({
    //   Bucket: process.env.AWS_S3_BUCKET,
    //   Key: key,
    // });
    // await s3.send(command);

    throw new Error('S3 storage not implemented.');
  }
}

// Storage Service Factory
export class StorageService implements IStorageProvider {
  private provider: IStorageProvider;

  constructor() {
    const storageType = process.env.STORAGE_TYPE || 'local';

    switch (storageType) {
      case 's3':
        this.provider = new S3StorageProvider();
        break;
      case 'local':
      default:
        this.provider = new LocalStorageProvider();
    }
  }

  async upload(file: Express.Multer.File): Promise<string> {
    return this.provider.upload(file);
  }

  async delete(url: string): Promise<void> {
    return this.provider.delete(url);
  }
}
